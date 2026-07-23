// Renders a database definition as the schema section of a question.
//
// The schema belongs in the question itself, the way a README carries the
// tables it documents: the student reads the problem and the columns in one
// place, in practice and in the exam alike, with nothing to open and nothing to
// go looking for. It is baked into body_md at import time, so it also survives
// anywhere markdown is rendered — the IDE, the paper, a PDF export.
//
// Foreign keys read as "→ teams.team_id" on the column's own row rather than as
// lines between boxes: it is the fastest thing to scan mid-exam, it survives a
// narrow screen, and unlike a diagram it can be searched with ctrl-F.

const pad = (s, n) => String(s) + " ".repeat(Math.max(0, n - String(s).length));

/** One table as a GitHub-flavoured markdown table. */
function tableMarkdown(table) {
  const rows = table.columns.map((c) => ({
    name: c.name,
    type: c.type,
    key: c.pk ? "PK" : c.fk ? `→ ${c.fk}` : "",
  }));
  const w = {
    name: Math.max(6, ...rows.map((r) => r.name.length)),
    type: Math.max(4, ...rows.map((r) => r.type.length)),
    key: Math.max(3, ...rows.map((r) => r.key.length)),
  };
  const line = (a, b, c) => `| ${pad(a, w.name)} | ${pad(b, w.type)} | ${pad(c, w.key)} |`;
  return [
    `#### ${table.name}`,
    "",
    line("Column", "Type", "Key"),
    `| ${"-".repeat(w.name)} | ${"-".repeat(w.type)} | ${"-".repeat(w.key)} |`,
    ...rows.map((r) => line(r.name, r.type, r.key)),
  ].join("\n");
}

/**
 * The full schema section for a database.
 * @param {{label: string, blurb: string, tables: Array}} db
 */
/**
 * The diagram spec, in a ```schema fence.
 *
 * components/markdown.tsx renders this fence as an interactive diagram: every
 * table with its columns and types, and a line from each foreign key to the
 * column it references. It sits in the question body so the picture and the
 * database it describes can never drift apart, and it degrades to a readable
 * code block anywhere the renderer isn't available.
 */
function diagramFence(db) {
  const spec = {
    label: db.label,
    tables: db.tables.map((t) => ({
      name: t.name,
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
        ...(c.pk ? { pk: true } : {}),
        ...(c.fk ? { fk: c.fk } : {}),
      })),
    })),
  };
  return "```schema\n" + JSON.stringify(spec) + "\n```";
}

export function schemaMarkdown(db) {
  const names = db.tables.map((t) => `\`${t.name}\``).join(" · ");
  // The diagram carries every column, type and key, so listing each table again
  // underneath only made the question longer to scroll past. The names stay as
  // one line of real text, which the diagram can't be: it is what ctrl-F finds.
  return [
    "---",
    "",
    `### Database: ${db.label}`,
    "",
    db.blurb,
    "",
    diagramFence(db),
    "",
    `**Tables** — ${names}`,
  ].join("\n");
}

/** A question's body with its schema appended. */
export function bodyWithSchema(bodyMd, db) {
  return `${bodyMd.trim()}\n\n${schemaMarkdown(db)}\n`;
}
