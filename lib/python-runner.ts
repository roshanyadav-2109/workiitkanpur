"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PG_BRIDGE_JS, PSYCOPG2_PY } from "@/lib/runtime/pg-bridge";

/**
 * In-browser Python via Pyodide, run inside a Web Worker created from a Blob so
 * it is independent of the bundler. Init (the ~10 MB Pyodide download) is a
 * separate, un-timed step from execution: `run()` awaits readiness first and
 * only then applies the per-run timeout to the actual execution, so a slow
 * download is never mistaken for an infinite loop. A failed init disposes the
 * worker so the next call retries with a fresh one.
 *
 * A question can also ask for a database (its `setup_sql`), input files and
 * command-line arguments. Postgres then loads too — lazily, so a plain Python
 * question never pays for it — and the program runs against it through the
 * `psycopg2` in lib/runtime/pg-bridge.ts. None of that is specific to any
 * question: whatever the run is given, it provides.
 */
const PYODIDE_VERSION = "0.26.4";
const PGLITE_URL = "https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js";

const WORKER_SRC = `
${PG_BRIDGE_JS}

const PSYCOPG2_SRC = ${JSON.stringify(PSYCOPG2_PY)};

let ready = null;
let pglite = null;   // the PGlite module, fetched once and kept

async function ensure() {
  if (ready) return ready;
  ready = (async () => {
    const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs');
    self.pyodide = await loadPyodide();
    self.pyodide.registerJsModule('_oppe_bridge', { exec: (sql) => self.__pgExec(sql) });
    self.pyodide.globals.set('_oppe_psycopg2_src', PSYCOPG2_SRC);
    await self.pyodide.runPythonAsync(\`
import sys, io, os, json, contextlib, traceback, types

# A program is written for a real server, so give it the environment one would
# have. The values are placeholders: there is a single database here, the one
# the question created, and psycopg2.connect ignores what it is handed.
os.environ.setdefault('PGUSER', 'postgres')
os.environ.setdefault('PGPASSWORD', 'postgres')
os.environ.setdefault('PGHOST', 'localhost')
os.environ.setdefault('PGPORT', '5432')

import _oppe_bridge
_psycopg2 = types.ModuleType('psycopg2')
# Registered before the source runs: _install looks itself up by __name__, and
# the submodules it creates hang off this same object.
sys.modules['psycopg2'] = _psycopg2
exec(_oppe_psycopg2_src, _psycopg2.__dict__)
_psycopg2._install(lambda sql: _oppe_bridge.exec(sql))

def _oppe_run(user_code, input_str, files_json, argv_json):
    files = json.loads(files_json or '{}')
    argv = json.loads(argv_json or '[]')
    written = []
    for name, content in files.items():
        try:
            with open(name, 'w', encoding='utf-8') as fh:
                fh.write(content)
            written.append(name)
        except OSError:
            pass

    out, err = io.StringIO(), io.StringIO()
    old_stdin, old_argv = sys.stdin, sys.argv
    sys.stdin = io.StringIO(input_str)
    sys.argv = ['main.py'] + [str(a) for a in argv]
    ok = True
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            exec(user_code, {"__name__": "__main__"})
    except SystemExit:
        pass
    except BaseException:
        ok = False
        traceback.print_exc(file=err)
    finally:
        sys.stdin, sys.argv = old_stdin, old_argv
        # Don't let one run's input file be read by the next one.
        for name in written:
            try:
                os.remove(name)
            except OSError:
                pass
    return [ok, out.getvalue(), err.getvalue()]
\`);
  })();
  return ready;
}

/** Fresh database per run, so nothing a program writes survives into the next. */
async function attachDatabase(setupSql) {
  if (self.__pgDb) {
    try { await self.__pgDb.close(); } catch (e) { /* already gone */ }
    self.__pgDb = null;
  }
  if (!setupSql) return;
  if (!pglite) pglite = await import(${JSON.stringify(PGLITE_URL)});
  const db = new pglite.PGlite();
  await db.waitReady;
  await db.exec(setupSql);
  self.__pgDb = db;
}

self.onmessage = async (e) => {
  const { id, type, code, stdin, setupSql, files, argv } = e.data;
  if (type === 'init') {
    try { await ensure(); self.postMessage({ id, type: 'ready' }); }
    catch (err) { ready = null; self.postMessage({ id, type: 'error', error: String(err) }); }
    return;
  }
  if (type === 'run') {
    try {
      await ensure();
      await attachDatabase(setupSql);
      const fn = self.pyodide.globals.get('_oppe_run');
      const res = fn(
        code,
        stdin || '',
        JSON.stringify(files || {}),
        JSON.stringify(argv || []),
      );
      const arr = res.toJs();
      res.destroy();
      fn.destroy();
      self.postMessage({ id, type: 'result', ok: arr[0], stdout: arr[1], stderr: arr[2] });
    } catch (err) {
      self.postMessage({ id, type: 'result', ok: false, stdout: '', stderr: String(err) });
    }
  }
};
`;

/** Everything a run needs beyond the code and stdin. All optional. */
export interface RunContext {
  /** SQL that builds the question's database. Postgres loads only if set. */
  setupSql?: string | null;
  /** Files placed in the working directory, e.g. { "number.txt": "3" }. */
  files?: Record<string, string>;
  /** Arguments after the program name, so argv[0] here is sys.argv[1]. */
  argv?: string[];
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

type Status = "idle" | "loading" | "ready" | "error";

export function usePythonRunner(runTimeoutMs = 15000) {
  const [status, setStatus] = useState<Status>("idle");
  const workerRef = useRef<Worker | null>(null);
  const urlRef = useRef<string | null>(null);
  const seq = useRef(0);
  const pending = useRef<
    Map<number, { resolve: (r: RunResult) => void; timer: number }>
  >(new Map());
  const readyRef = useRef<{
    promise: Promise<void>;
    resolve: () => void;
    reject: (e: unknown) => void;
  } | null>(null);

  const disposeWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    for (const [, p] of pending.current) window.clearTimeout(p.timer);
    pending.current.clear();
    readyRef.current = null;
  }, []);

  const ensureReady = useCallback((): Promise<void> => {
    if (readyRef.current) return readyRef.current.promise;

    const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    // A module worker, so both runtimes can be pulled in with dynamic import:
    // PGlite ships as an ES module, and importScripts can't load one.
    const worker = new Worker(url, { type: "module" });
    urlRef.current = url;
    workerRef.current = worker;
    setStatus("loading");

    let resolve!: () => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    readyRef.current = { promise, resolve, reject };

    worker.onmessage = (e: MessageEvent) => {
      const { id, type, ok, stdout, stderr, error } = e.data ?? {};
      if (type === "ready") {
        setStatus("ready");
        readyRef.current?.resolve();
        return;
      }
      if (type === "error") {
        const r = readyRef.current;
        setStatus("error");
        disposeWorker();
        r?.reject(new Error(error || "Failed to load Python."));
        return;
      }
      if (type === "result") {
        setStatus("ready");
        const p = pending.current.get(id);
        if (p) {
          window.clearTimeout(p.timer);
          pending.current.delete(id);
          p.resolve({ ok, stdout: stdout ?? "", stderr: stderr ?? "" });
        }
      }
    };
    worker.onerror = (e: ErrorEvent) => {
      const r = readyRef.current;
      setStatus("error");
      disposeWorker();
      const where = e?.lineno ? ` (line ${e.lineno})` : "";
      r?.reject(
        new Error(
          e?.message
            ? `Worker failed: ${e.message}${where}`
            : "Something went wrong. Please run again.",
        ),
      );
    };

    worker.postMessage({ id: ++seq.current, type: "init" });
    return promise;
  }, [disposeWorker]);

  const load = useCallback(() => {
    void ensureReady().catch(() => {});
  }, [ensureReady]);

  const run = useCallback(
    async (
      code: string,
      stdin: string,
      context: RunContext = {},
    ): Promise<RunResult> => {
      try {
        await ensureReady();
      } catch (err) {
        // Keep the underlying reason: "check your connection" is misleading
        // when the runtime actually failed for some other reason.
        const detail = err instanceof Error ? err.message : String(err);
        return {
          ok: false,
          stdout: "",
          stderr:
            "Could not load the Python runtime. Check your connection and try again." +
            (detail ? `\n${detail}` : ""),
        };
      }
      const worker = workerRef.current;
      if (!worker) {
        return {
          ok: false,
          stdout: "",
          stderr: "The editor isn't ready yet. Please try again in a moment.",
        };
      }
      const id = ++seq.current;
      return new Promise<RunResult>((resolve) => {
        // Timeout covers execution only — init already completed above.
        const timer = window.setTimeout(() => {
          pending.current.delete(id);
          disposeWorker();
          setStatus("idle");
          resolve({
            ok: false,
            stdout: "",
            stderr: "Timed out — is there an infinite loop?",
            timedOut: true,
          });
        }, runTimeoutMs);
        pending.current.set(id, { resolve, timer });
        worker.postMessage({
          id,
          type: "run",
          code,
          stdin,
          setupSql: context.setupSql ?? null,
          files: context.files ?? {},
          argv: context.argv ?? [],
        });
      });
    },
    [ensureReady, disposeWorker, runTimeoutMs],
  );

  useEffect(() => () => disposeWorker(), [disposeWorker]);

  return { status, load, run };
}
