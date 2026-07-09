"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * In-browser Python via Pyodide, run inside a Web Worker created from a Blob so
 * it is independent of the bundler. Init (the ~10 MB Pyodide download) is a
 * separate, un-timed step from execution: `run()` awaits readiness first and
 * only then applies the per-run timeout to the actual execution, so a slow
 * download is never mistaken for an infinite loop. A failed init disposes the
 * worker so the next call retries with a fresh one.
 */
const PYODIDE_VERSION = "0.26.4";

const WORKER_SRC = `
let ready = null;
async function ensure() {
  if (ready) return ready;
  ready = (async () => {
    importScripts('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js');
    self.pyodide = await loadPyodide();
    await self.pyodide.runPythonAsync(\`
import sys, io, contextlib, traceback
def _oppe_run(user_code, input_str):
    out = io.StringIO()
    err = io.StringIO()
    old_stdin = sys.stdin
    sys.stdin = io.StringIO(input_str)
    ok = True
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            g = {"__name__": "__main__"}
            exec(user_code, g)
    except SystemExit:
        pass
    except BaseException:
        ok = False
        traceback.print_exc(file=err)
    finally:
        sys.stdin = old_stdin
    return [ok, out.getvalue(), err.getvalue()]
\`);
  })();
  return ready;
}

self.onmessage = async (e) => {
  const { id, type, code, stdin } = e.data;
  if (type === 'init') {
    try { await ensure(); self.postMessage({ id, type: 'ready' }); }
    catch (err) { ready = null; self.postMessage({ id, type: 'error', error: String(err) }); }
    return;
  }
  if (type === 'run') {
    try {
      await ensure();
      const fn = self.pyodide.globals.get('_oppe_run');
      const res = fn(code, stdin || '');
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
    const worker = new Worker(url);
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
    worker.onerror = () => {
      const r = readyRef.current;
      setStatus("error");
      disposeWorker();
      r?.reject(new Error("Python worker crashed."));
    };

    worker.postMessage({ id: ++seq.current, type: "init" });
    return promise;
  }, [disposeWorker]);

  const load = useCallback(() => {
    void ensureReady().catch(() => {});
  }, [ensureReady]);

  const run = useCallback(
    async (code: string, stdin: string): Promise<RunResult> => {
      try {
        await ensureReady();
      } catch {
        return {
          ok: false,
          stdout: "",
          stderr:
            "Could not load the Python runtime. Check your connection and try again.",
        };
      }
      const worker = workerRef.current;
      if (!worker) {
        return { ok: false, stdout: "", stderr: "Runtime unavailable." };
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
        worker.postMessage({ id, type: "run", code, stdin });
      });
    },
    [ensureReady, disposeWorker, runTimeoutMs],
  );

  useEffect(() => () => disposeWorker(), [disposeWorker]);

  return { status, load, run };
}
