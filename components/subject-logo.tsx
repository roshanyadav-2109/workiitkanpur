import {
  siPython,
  siPostgresql,
  siOpenjdk,
  siC,
  siGnubash,
} from "simple-icons";
import { IconSubjects } from "@/components/icons";

// Map each subject to its language/tech brand mark, rendered in the brand colour.
const SUBJECT_LOGO: Record<
  string,
  { path: string; hex: string } | undefined
> = {
  python: siPython,
  pdsa: siPython,
  dbms: siPostgresql,
  java: siOpenjdk,
  c: siC,
  syscmd: siGnubash,
};

export function SubjectLogo({
  slug,
  size = 24,
  className,
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const icon = SUBJECT_LOGO[slug];
  if (!icon) return <IconSubjects size={size} className={className} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={`#${icon.hex}`}
      aria-hidden="true"
      className={className}
    >
      <path d={icon.path} />
    </svg>
  );
}
