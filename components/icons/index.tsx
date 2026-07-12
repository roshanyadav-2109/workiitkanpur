/**
 * App icon set — Phosphor icons (https://phosphoricons.com), imported from the
 * SSR-safe entry so they render in both server and client components.
 *
 * Every icon is exposed under the app's own `Icon*` name and wrapped so the
 * whole family shares one weight ("bold" — a semibold-looking stroke) and a
 * default size. Colour is inherited via `currentColor`, so icons stay
 * theme-aware automatically. To restyle every icon, change WEIGHT below.
 */
import * as React from "react";
// Per-icon deep imports (not the barrel) so bundlers only compile what we use.
import { ArrowSquareOutIcon as ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { BooksIcon as Books } from "@phosphor-icons/react/dist/ssr/Books";
import { CaretDoubleRightIcon as CaretDoubleRight } from "@phosphor-icons/react/dist/ssr/CaretDoubleRight";
import { CaretRightIcon as CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { ChartLineUpIcon as ChartLineUp } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleIcon as Circle } from "@phosphor-icons/react/dist/ssr/Circle";
import { CircleHalfIcon as CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf";
import { GearIcon as Gear } from "@phosphor-icons/react/dist/ssr/Gear";
import { ListIcon as List } from "@phosphor-icons/react/dist/ssr/List";
import { LockIcon as Lock } from "@phosphor-icons/react/dist/ssr/Lock";
import { LockSimpleIcon as LockSimple } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { MoonIcon as Moon } from "@phosphor-icons/react/dist/ssr/Moon";
import { NotePencilIcon as NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { PlayIcon as Play } from "@phosphor-icons/react/dist/ssr/Play";
import { PlayCircleIcon as PlayCircle } from "@phosphor-icons/react/dist/ssr/PlayCircle";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { SunIcon as Sun } from "@phosphor-icons/react/dist/ssr/Sun";
import { TerminalWindowIcon as TerminalWindow } from "@phosphor-icons/react/dist/ssr/TerminalWindow";
import { TimerIcon as Timer } from "@phosphor-icons/react/dist/ssr/Timer";
import { UserIcon as User } from "@phosphor-icons/react/dist/ssr/User";
import { XIcon as X } from "@phosphor-icons/react/dist/ssr/X";

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
type PhosphorIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number | string; weight?: IconWeight }
>;

/** Shared weight for the whole set — "bold" reads as a semibold stroke. */
const WEIGHT: IconWeight = "bold";

/** Wrap a Phosphor icon as an app icon with our default size + weight. */
function icon(Glyph: PhosphorIcon, weight: IconWeight = WEIGHT) {
  function Wrapped({ size = 18, ...props }: IconProps) {
    // Phosphor accepts size/weight/color/className and forwards SVG props.
    return <Glyph size={size} weight={weight} {...(props as object)} />;
  }
  Wrapped.displayName = `Icon(${Glyph.displayName ?? "phosphor"})`;
  return Wrapped;
}

/**
 * Bespoke dashboard glyph — an asymmetric 2×2 grid: the two short blocks
 * (top-left + bottom-right) match, and the two tall blocks (top-right +
 * bottom-left) match, giving a real "dashboard layout" feel. Drawn with a
 * bold stroke so it sits with the Phosphor family.
 */
export function IconDashboard({ size = 18, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* top-left — short */}
      <rect x="3" y="3.5" width="7.5" height="5" rx="1.8" />
      {/* bottom-left — tall */}
      <rect x="3" y="11.5" width="7.5" height="9" rx="1.8" />
      {/* top-right — tall */}
      <rect x="13.5" y="3.5" width="7.5" height="9" rx="1.8" />
      {/* bottom-right — short */}
      <rect x="13.5" y="15.5" width="7.5" height="5" rx="1.8" />
    </svg>
  );
}
export const IconResources = icon(PlayCircle);
export const IconSubjects = icon(Books);
export const IconProgress = icon(ChartLineUp);
export const IconSettings = icon(Gear);
export const IconAccount = icon(User);
export const IconSearch = icon(MagnifyingGlass);
export const IconTimer = icon(Timer);
export const IconCheck = icon(CheckCircle);
export const IconCircle = icon(Circle);
export const IconHalfCircle = icon(CircleHalf, "fill");
export const IconChevron = icon(CaretRight);
export const IconChevronDouble = icon(CaretDoubleRight);
export const IconPlay = icon(Play, "fill");
export const IconPlus = icon(Plus);
export const IconSun = icon(Sun);
export const IconMoon = icon(Moon);
export const IconClose = icon(X);
export const IconExternalLink = icon(ArrowSquareOut);
export const IconLock = icon(LockSimple);
export const IconLockFilled = icon(Lock, "fill");
export const IconNote = icon(NotePencil);
export const IconMenu = icon(List);
export const Logo = icon(TerminalWindow);
