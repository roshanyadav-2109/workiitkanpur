/**
 * Placeholder institutional emblem (lamp of knowledge in a double ring).
 * Swap for the official IIT Madras logo by dropping the asset in /public and
 * replacing this component's usage with an <img>/<Image>.
 */
export function IitmEmblem({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="IIT Madras BS Degree"
      className={className}
    >
      <circle cx="24" cy="24" r="22.5" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M24 13 C21.5 17 22.5 20.5 24 22.5 C25.5 20.5 26.5 17 24 13 Z"
        fill="currentColor"
      />
      <path
        d="M24 22.5 V25.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M15.5 25.5 C15.5 24.9 32.5 24.9 32.5 25.5 C32.5 28.6 27 30.5 24 30.5 C21 30.5 15.5 28.6 15.5 25.5 Z"
        fill="currentColor"
      />
      <path
        d="M20 33 H28"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
