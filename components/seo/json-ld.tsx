/**
 * Renders a JSON-LD structured-data block. Server component — the script is
 * part of the SSR HTML so crawlers read it without running JavaScript.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
