"use client";

import ReactMarkdown from "react-markdown";
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
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-oppe", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className: cls, children: content, ...rest } = props;
            if (/\blanguage-schema\b/.test(cls ?? "")) {
              const spec = parseSpec(String(content));
              // A malformed spec falls through to a normal code block rather
              // than blanking the question.
              if (spec) return <SchemaDiagram spec={spec} />;
            }
            return (
              <code className={cls} {...rest}>
                {content}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function parseSpec(raw: string): DiagramSpec | null {
  try {
    const spec = JSON.parse(raw) as DiagramSpec;
    return Array.isArray(spec?.tables) && spec.tables.length ? spec : null;
  } catch {
    return null;
  }
}
