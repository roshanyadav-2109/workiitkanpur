/**
 * The databases a paper's questions run against.
 *
 * One definition per database, holding both the SQL that creates it and the
 * table metadata the schema reference renders. They live together deliberately:
 * if the diagram a student reads and the database their query runs against ever
 * disagreed, the paper would mark correct answers wrong for reasons no one
 * could see. scripts/check-databases.mjs runs the DDL in PGlite and asserts the
 * metadata matches what Postgres actually created.
 */

export interface SchemaColumn {
  name: string;
  type: string;
  pk: boolean;
  /** "teams.team_id" when this column references another table, else null. */
  fk: string | null;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface DatabaseDef {
  /** Stable key used by questions, e.g. "flis". */
  key: string;
  /** How the paper names it, e.g. "FLIS". */
  label: string;
  /** One line on what it models, shown above the tables. */
  blurb: string;
  tables: SchemaTable[];
  /** CREATE TABLE statements. */
  ddl: string;
  /** INSERT statements, run after the DDL. */
  seed: string;
}

/** Everything a question needs to run: schema then data, in that order. */
export function setupSqlFor(db: DatabaseDef): string {
  return `${db.ddl.trim()}\n\n${db.seed.trim()}\n`;
}

const REGISTRY = new Map<string, DatabaseDef>();

export function registerDatabase(def: DatabaseDef) {
  REGISTRY.set(def.key, def);
}

export function getDatabase(key: string): DatabaseDef | null {
  return REGISTRY.get(key) ?? null;
}

export function allDatabases(): DatabaseDef[] {
  return [...REGISTRY.values()];
}
