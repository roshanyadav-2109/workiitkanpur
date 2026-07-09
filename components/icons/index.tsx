/**
 * Bespoke monochrome icon set — NO icon library by design.
 *
 * Every icon obeys one drawing spec so the family reads as a single hand:
 *   viewBox 0 0 24 24, artwork optically centred in a ~20px live area,
 *   fill none, stroke currentColor, stroke-width 1.5, round caps + joins.
 * Colour is inherited (currentColor) so icons are theme-aware automatically.
 * Rendered at 16-18px. Solid fill is avoided everywhere.
 */
import * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function IconBase({
  size = 18,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </IconBase>
  );
}

export function IconSubjects(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4.5" y="4" width="15" height="16" rx="1.5" />
      <path d="M8.5 4 V20" />
      <path d="M11.5 9.5 H16.5" />
      <path d="M11.5 13 H16.5" />
    </IconBase>
  );
}

export function IconProgress(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 4 V19 H20" />
      <path d="M8 15.5 L11 12 L14 13.5 L18.5 8" />
    </IconBase>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 8 H12.5" />
      <path d="M17.5 8 H20" />
      <circle cx="15" cy="8" r="2.5" />
      <path d="M4 16 H8.5" />
      <path d="M13.5 16 H20" />
      <circle cx="11" cy="16" r="2.5" />
    </IconBase>
  );
}

export function IconAccount(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5 a6.5 6.5 0 0 1 13 0" />
    </IconBase>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 L20 20" />
    </IconBase>
  );
}

export function IconTimer(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M9.5 3 H14.5" />
      <path d="M12 3 V6.5" />
      <path d="M12 13.5 V9.5" />
    </IconBase>
  );
}

/** Solved. Pairs with IconCircle (a bare ring) as the not-solved state. */
export function IconCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5 L11 15 L15.5 9.5" />
    </IconBase>
  );
}

/** Unsolved / attempted. */
export function IconCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
    </IconBase>
  );
}

/** Attempted-but-not-solved: half-marked ring. */
export function IconHalfCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4 a8 8 0 0 1 0 16 Z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/** Disclosure chevron, points right; rotate via CSS for up/down/left. */
export function IconChevron(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9.5 6.5 L15 12 L9.5 17.5" />
    </IconBase>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.5 6.5 L18 12 L8.5 17.5 Z" />
    </IconBase>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5 V19" />
      <path d="M5 12 H19" />
    </IconBase>
  );
}

export function IconSun(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.5 V4.8" />
      <path d="M12 19.2 V21.5" />
      <path d="M21.5 12 H19.2" />
      <path d="M4.8 12 H2.5" />
      <path d="M18.9 5.1 L17.3 6.7" />
      <path d="M6.7 17.3 L5.1 18.9" />
      <path d="M18.9 18.9 L17.3 17.3" />
      <path d="M6.7 6.7 L5.1 5.1" />
    </IconBase>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.5 14 A8.5 8.5 0 1 1 10 3.5 A6.5 6.5 0 0 0 20.5 14 Z" />
    </IconBase>
  );
}

export function IconClose(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 6.5 L17.5 17.5" />
      <path d="M17.5 6.5 L6.5 17.5" />
    </IconBase>
  );
}

export function IconExternalLink(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 5 H6 a1 1 0 0 0 -1 1 V18 a1 1 0 0 0 1 1 H18 a1 1 0 0 0 1 -1 V14" />
      <path d="M14 5 H19 V10" />
      <path d="M19 5 L12 12" />
    </IconBase>
  );
}

/** Responsive sidebar toggle. */
export function IconMenu(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17 H20" />
    </IconBase>
  );
}

/** Bespoke wordmark glyph: a terminal prompt in a rounded frame. */
export function Logo(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7.5 9.5 L10.5 12 L7.5 14.5" />
      <path d="M12.5 15 H16" />
    </IconBase>
  );
}
