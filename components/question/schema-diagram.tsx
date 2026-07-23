"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DiagramColumn {
  name: string;
  type: string;
  pk?: boolean;
  /** "teams.team_id" when this column references another table. */
  fk?: string | null;
}
export interface DiagramTable {
  name: string;
  columns: DiagramColumn[];
}
export interface DiagramSpec {
  label?: string;
  tables: DiagramTable[];
}

/* Geometry. Fixed metrics keep every anchor point exact, so an edge can start
 * at the row that holds the foreign key and end at the row it references. */
const W = 196;          // table width
const HEAD = 26;        // header height
const ROW = 20;         // column row height
const GAP_X = 72;       // space between layers — room for the edges to curve
const GAP_Y = 20;       // space between tables in a layer
const PAD = 8;          // canvas padding

const heightOf = (t: DiagramTable) => HEAD + t.columns.length * ROW;

interface Placed extends DiagramTable {
  x: number;
  y: number;
  h: number;
  index: Map<string, number>;
}

/**
 * Lay the tables out in dependency layers: a table sits one layer right of the
 * tables it points at, so arrows mostly flow the same way and the diagram reads
 * as a hierarchy rather than a knot. Tables in a cycle settle into the same
 * layer, which is correct — neither depends on the other being placed first.
 */
function layout(tables: DiagramTable[]): { placed: Placed[]; w: number; h: number } {
  const byName = new Map(tables.map((t) => [t.name.toLowerCase(), t]));
  const refs = (t: DiagramTable) =>
    t.columns
      .map((c) => c.fk?.split(".")[0]?.toLowerCase())
      .filter((n): n is string => !!n && n !== t.name.toLowerCase() && byName.has(n));

  const depth = new Map<string, number>();
  const resolve = (name: string, seen: Set<string>): number => {
    const key = name.toLowerCase();
    if (depth.has(key)) return depth.get(key)!;
    if (seen.has(key)) return 0; // cycle: stop here rather than recurse forever
    seen.add(key);
    const t = byName.get(key);
    const d = t?.columns.length
      ? refs(t).reduce((m, r) => Math.max(m, resolve(r, seen) + 1), 0)
      : 0;
    seen.delete(key);
    depth.set(key, d);
    return d;
  };
  for (const t of tables) resolve(t.name, new Set());

  const layers: DiagramTable[][] = [];
  for (const t of tables) {
    const d = depth.get(t.name.toLowerCase()) ?? 0;
    (layers[d] ??= []).push(t);
  }

  const placed: Placed[] = [];
  let x = PAD;
  let maxH = 0;
  for (const layer of layers) {
    if (!layer) continue;
    const colH = layer.reduce((n, t) => n + heightOf(t) + GAP_Y, -GAP_Y);
    let y = PAD;
    for (const t of layer) {
      placed.push({
        ...t,
        x,
        y,
        h: heightOf(t),
        index: new Map(t.columns.map((c, i) => [c.name.toLowerCase(), i])),
      });
      y += heightOf(t) + GAP_Y;
    }
    maxH = Math.max(maxH, colH);
    x += W + GAP_X;
  }
  return { placed, w: x - GAP_X + PAD, h: maxH + PAD * 2 };
}

/**
 * A key, the way a database tool draws one: solid for a primary key, outlined
 * for a foreign key. Same shape for both, because both are keys — the fill is
 * what says which.
 */
function KeyGlyph({ x, y, filled }: { x: number; y: number; filled: boolean }) {
  const stroke = "var(--accent)";
  return (
    <g
      transform={`translate(${x} ${y})`}
      stroke={stroke}
      strokeOpacity={filled ? 1 : 0.6}
      strokeWidth="1.1"
      strokeLinecap="round"
      fill="none"
    >
      {/* bow */}
      <circle cx="3.2" cy="5" r="2.4" fill={filled ? stroke : "none"} />
      {/* shaft and teeth */}
      <path d="M5.6 5 H11" />
      <path d="M8.4 5 V7.4" />
      <path d="M10.4 5 V6.9" />
    </g>
  );
}

/** Vertical centre of a column's row, or of the header when it has none. */
function rowY(t: Placed, column?: string) {
  const i = column ? t.index.get(column.toLowerCase()) : undefined;
  return i == null ? t.y + HEAD / 2 : t.y + HEAD + i * ROW + ROW / 2;
}

/**
 * The database, drawn: every table with its columns and types, and a line from
 * each foreign key to the exact column it references. Drag to pan, scroll or
 * use the buttons to zoom.
 */
export function SchemaDiagram({ spec }: { spec: DiagramSpec }) {
  const { placed, w, h } = useMemo(() => layout(spec.tables), [spec.tables]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  /**
   * Show the whole schema to begin with. These sit in a narrow question column
   * beside an editor, so a diagram that opened at full size would be mostly
   * off-screen and every student would have to drag it into view before they
   * could read anything.
   */
  const fit = useCallback(() => {
    const box = viewport.current?.getBoundingClientRect();
    if (!box || !box.width) return;
    const z = Math.min(1, box.width / w, box.height / h);
    setZoom(z);
    setPan({ x: (box.width - w * z) / 2, y: (box.height - h * z) / 2 });
  }, [w, h]);

  useEffect(() => {
    fit();
    const el = viewport.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  const at = (name: string) =>
    placed.find((p) => p.name.toLowerCase() === name.toLowerCase());

  const edges = placed.flatMap((t) =>
    t.columns.flatMap((c) => {
      if (!c.fk) return [];
      const [target, col] = c.fk.split(".");
      const to = at(target);
      if (!to) return [];
      return [{ from: t, fromCol: c.name, to, toCol: col, id: `${t.name}.${c.name}` }];
    }),
  );

  const active = (tableName: string) =>
    !hover ||
    hover === tableName ||
    edges.some(
      (e) =>
        (e.from.name === hover && e.to.name === tableName) ||
        (e.to.name === hover && e.from.name === tableName),
    );

  return (
    <div className="not-prose my-4">
      {/* The canvas is the whole thing — no card around it. Controls float over
          it and the legend is a plain caption, so the diagram doesn't read as a
          panel nested inside the question's panel. */}
      <div
        ref={viewport}
        className="relative h-[380px] cursor-grab overflow-hidden active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          setZoom((z) => Math.min(1.8, Math.max(0.4, z - e.deltaY * 0.002)));
        }}
      >
        <span className="absolute right-0 top-0 z-10 flex items-center gap-1">
          {([["−", -0.15], ["+", 0.15]] as const).map(([sign, d]) => (
            <button
              key={sign}
              type="button"
              onClick={() => setZoom((z) => Math.min(1.8, Math.max(0.3, z + d)))}
              aria-label={d > 0 ? "Zoom in" : "Zoom out"}
              className="grid h-6 w-6 place-items-center rounded-[3px] border border-hairline bg-canvas/90 text-[13px] text-fg-muted hover:text-fg"
            >
              {sign}
            </button>
          ))}
          <button
            type="button"
            onClick={fit}
            className="rounded-[3px] border border-hairline bg-canvas/90 px-2 py-0.5 text-[11.5px] text-fg-muted hover:text-fg"
          >
            Fit
          </button>
        </span>

        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="absolute left-0 top-0 origin-top-left select-none"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          role="img"
          aria-label={`Schema diagram: ${spec.tables.map((t) => t.name).join(", ")}`}
        >
          <defs>
            <marker
              id="sd-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 1 L7 4 L0 7 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Relationships, drawn under the tables so they never cross text. */}
          {edges.map((e) => {
            const y1 = rowY(e.from, e.fromCol);
            const y2 = rowY(e.to, e.toCol);
            // Leave from whichever side faces the target.
            const leftward = e.to.x + W <= e.from.x;
            const x1 = leftward ? e.from.x : e.from.x + W;
            const x2 = leftward ? e.to.x + W : e.to.x;
            const dx = Math.max(36, Math.abs(x2 - x1) * 0.45);
            const c1 = leftward ? x1 - dx : x1 + dx;
            const c2 = leftward ? x2 + dx : x2 - dx;
            const lit = hover === e.from.name || hover === e.to.name;
            return (
              <path
                key={e.id}
                d={`M${x1} ${y1} C${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={lit ? 1.8 : 1.1}
                strokeOpacity={hover ? (lit ? 0.95 : 0.12) : 0.42}
                markerEnd="url(#sd-arrow)"
              />
            );
          })}

          {placed.map((t) => {
            const on = active(t.name);
            return (
              <g
                key={t.name}
                opacity={on ? 1 : 0.25}
                onMouseEnter={() => setHover(t.name)}
                onMouseLeave={() => setHover(null)}
              >
                <rect
                  x={t.x}
                  y={t.y}
                  width={W}
                  height={t.h}
                  rx="3"
                  fill="var(--canvas)"
                  stroke={hover === t.name ? "var(--accent)" : "var(--hairline-strong)"}
                />
                <rect
                  x={t.x}
                  y={t.y}
                  width={W}
                  height={HEAD}
                  rx="3"
                  fill="var(--accent-weak)"
                />
                <rect x={t.x} y={t.y + HEAD - 1} width={W} height="1" fill="var(--hairline)" />
                <text
                  x={t.x + 10}
                  y={t.y + HEAD / 2 + 4}
                  className="fill-[var(--accent)] font-mono text-[12px] font-semibold"
                >
                  {t.name}
                </text>

                {t.columns.map((c, i) => {
                  const y = t.y + HEAD + i * ROW;
                  return (
                    <g key={c.name}>
                      {i > 0 && (
                        <rect x={t.x} y={y} width={W} height="1" fill="var(--hairline)" opacity="0.6" />
                      )}
                      {(c.pk || c.fk) && (
                        <KeyGlyph
                          x={t.x + 6}
                          y={y + ROW / 2 - 5}
                          filled={!!c.pk}
                        />
                      )}
                      <text
                        x={t.x + 22}
                        y={y + ROW / 2 + 3.5}
                        className={cn(
                          "font-mono text-[11px]",
                          c.pk ? "fill-[var(--fg)] font-semibold" : "fill-[var(--fg)]",
                        )}
                      >
                        {c.name}
                      </text>
                      <text
                        x={t.x + W - 9}
                        y={y + ROW / 2 + 3.5}
                        textAnchor="end"
                        className="fill-[var(--fg-faint)] font-mono text-[10px]"
                      >
                        {c.type}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-fg-faint">
        <span className="flex items-center gap-1.5">
          <svg width="13" height="11" aria-hidden>
            <KeyGlyph x={0} y={0} filled />
          </svg>
          primary key
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="13" height="11" aria-hidden>
            <KeyGlyph x={0} y={0} filled={false} />
          </svg>
          foreign key
        </span>
        <span>arrow points to the referenced column</span>
        <span className="ml-auto">drag to pan</span>
      </div>
    </div>
  );
}
