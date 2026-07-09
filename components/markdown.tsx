import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Question / solution markdown. Styling lives in the `.prose-oppe` layer in
 * globals.css — comfortable measure, monochrome, code that reads as code with
 * no syntax colour. No raw HTML is rendered (react-markdown default).
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
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
