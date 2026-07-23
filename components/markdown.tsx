"use client";

import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import {
  SchemaDiagram,
  type DiagramSpec,
} from "@/components/question/schema-diagram";

/**
 * Question / solution markdown. Styling lives in the `.prose-oppe` layer in
 * globals.css — comfortable measure, monochrome, code that reads as code with
 * no syntax colour. No raw HTML is rendered (react-markdown default).
 *
 * One fence is special: ```schema holds a database's tables as JSON and renders
 * as a diagram. It stays inside the question that way — the schema travels with
 * the text it belongs to, and nothing has to look it up or keep it in sync.
 *
 * Memoised, and everything it hands to react-markdown is stable. A paper runs a
 * clock that ticks every second, and each tick re-rendered this component with
 * a fresh renderer config and a freshly parsed spec — enough for React to throw
 * away the diagram and build a new one, which read on screen as a flicker once
 * a second.
 */
export const Markdown = memo(function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const components = useMemo<Components>(
    () => ({
      code(props) {
        const { className: cls, children: content, ...rest } = props;
        if (/\blanguage-schema\b/.test(cls ?? "")) {
          const spec = parseSpec(String(content));
          // A malformed spec falls through to a normal code block rather than
          // blanking the question.
          if (spec) return <SchemaDiagram spec={spec} />;
        }
        return (
          <code className={cls} {...rest}>
            {content}
          </code>
        );
      },
    }),
    [],
  );

  return (
    <div className={cn("prose-oppe", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
});

/**
 * Parsed specs are cached by their source text, so re-rendering hands the
 * diagram the same object it had before and it keeps its zoom and position
 * instead of being rebuilt.
 */
const specCache = new Map<string, DiagramSpec | null>();

function parseSpec(raw: string): DiagramSpec | null {
  if (specCache.has(raw)) return specCache.get(raw) ?? null;
  let spec: DiagramSpec | null = null;
  try {
    const parsed = JSON.parse(raw) as DiagramSpec;
    if (Array.isArray(parsed?.tables) && parsed.tables.length) spec = parsed;
  } catch {
    spec = null;
  }
  specCache.set(raw, spec);
  return spec;
}
