/**
 * The one site footer — a full-bleed violet band with the independence notice.
 * Shared by every public page so the footer is identical everywhere.
 */
export function SiteFooter() {
  return (
    <footer className="bg-accent text-white">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-3 py-3.5 text-[12px] sm:w-[85%] sm:px-8">
        <span className="font-medium">IITM BS Community</span>
        <span className="text-right font-medium">
          Independent website by IITM BS Student Community — not affiliated with
          IIT Madras
        </span>
      </div>
    </footer>
  );
}
