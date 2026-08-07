// Import the public DBMS practice bank into this project's live Supabase.
//
//   npm run import:dbms-bank             # audit only
//   npm run import:dbms-bank -- --print-titles
//   npm run import:dbms-bank -- --commit # insert missing questions
//
// Imported records reuse the established OPE topic names. A rerun compares
// normalized statements with every existing DBMS question before it writes, so
// the remote collection can grow without duplicating this bank.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");
const PRINT_TITLES = process.argv.includes("--print-titles");
const REMOTE = "https://oppe.dev";
const SUBJECT_SLUG = "dbms";
const MAX_POST_CHARS = 2_500_000;
const IMPORTED_TAG = "dbms-bank";

function credentials() {
  const out = { ...process.env };
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !out[match[1]]) {
        out[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // CI can provide the same values directly.
  }
  return out;
}

const ENV = credentials();
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

async function rest(path, method = "GET", body, prefer) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Supabase ${method} ${path} failed (${response.status}): ${text.slice(0, 500)}`,
    );
  }
  return text ? JSON.parse(text) : null;
}

async function trpc(name, input) {
  const query =
    input === undefined
      ? ""
      : `?input=${encodeURIComponent(JSON.stringify(input))}`;
  const response = await fetch(`${REMOTE}/trpc/${name}${query}`);
  if (!response.ok) {
    throw new Error(`Question feed ${name} failed (${response.status}).`);
  }
  const payload = await response.json();
  return payload.result.data;
}

function coreStatement(value) {
  return String(value ?? "")
    .split(/\n---\s*\n/)[0]
    .split(/\n#{2,4}\s+(?:database )?schema\b/i)[0]
    .trim();
}

function normalizedStatement(value) {
  return coreStatement(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[`*_#>\[\](){}]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(normalizedStatement(value).split(" ").filter(Boolean));
}

function containment(source, candidate) {
  const left = tokens(source);
  const right = tokens(candidate);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return overlap / Math.min(left.size, right.size);
}

function literalValues(value) {
  return [
    ...coreStatement(value).matchAll(
      /(["'])(.*?)\1|\b\d+(?:\.\d+)?\b/g,
    ),
  ]
    .map((match) => String(match[2] ?? match[0]).toLowerCase())
    .sort();
}

/**
 * Catch a statement that has already been expanded with examples/connection
 * instructions. Requiring every source literal to survive avoids collapsing
 * questions that differ only by a date, score range, name or jersey number.
 */
function isExpandedDuplicate(source, candidate) {
  const sourceTokens = tokens(source);
  if (sourceTokens.size < 20 || containment(source, candidate) < 0.98) {
    return false;
  }
  const candidateLiterals = new Set(literalValues(candidate));
  return literalValues(source).every((value) => candidateLiterals.has(value));
}

function statementHash(value) {
  return createHash("sha256")
    .update(normalizedStatement(value))
    .digest("hex");
}

function schemaFromDump(dump) {
  const tables = dump.match(/CREATE TABLE[\s\S]*?\n\);/gi) ?? [];
  if (!tables.length) throw new Error("A database dump has no CREATE TABLE statements.");
  return tables.join("\n\n").trim();
}

const TITLE_STOP_WORDS = new Set([
  "a",
  "all",
  "along",
  "an",
  "and",
  "are",
  "as",
  "based",
  "be",
  "been",
  "corresponding",
  "currently",
  "each",
  "every",
  "for",
  "from",
  "given",
  "has",
  "have",
  "having",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "respective",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "those",
  "to",
  "using",
  "was",
  "were",
  "which",
  "who",
  "whose",
  "you",
]);
const MAX_TITLE_WORDS = 8;
const MAX_TITLE_CHARS = 58;

function pythonTitle(question) {
  const text = coreStatement(question).toLowerCase();
  const lineFunction = titleQualifier(question);
  if (/user name.*user_id/.test(text)) return "User name by ID";
  if (/manager of the player/.test(text) && /leap year/.test(text)) {
    return "Player manager and leap-year check";
  }
  if (/mobile number of user/.test(text) && /user id/.test(text)) {
    return "User mobile number by ID";
  }
  if (/department name/.test(text) && /even.*odd/.test(text)) {
    return "Student department and birth-year parity";
  }
  if (/name of referee/.test(text) && /referee_id/.test(text)) {
    return "Referee name by ID";
  }
  if (/players/.test(text) && /jersey number is a prime/.test(text)) {
    return "Players with prime jersey numbers";
  }
  if (/encoding of the ids of the teams/.test(text)) {
    return "Encoded team IDs by jersey colour";
  }
  if (/jersey number of the player/.test(text)) return "Player jersey number";
  if (/last name of the student in reverse/.test(text)) {
    return "Reversed student last name";
  }
  if (/roll number of the student/.test(text)) return "Student roll number";
  if (/isbn numbers of books/.test(text)) {
    return `Book ISBNs by computed year${lineFunction ? ` — ${lineFunction}` : ""}`;
  }
  if (/playground of the given team id/.test(text)) return "Team playground by ID";
  if (/email id of user/.test(text)) return "User email by ID";
  if (/first name, last name/.test(text) && /evenyear/.test(text)) {
    return "Student name and birth-year parity";
  }
  if (/faculty's first name/.test(text) && /date of joining/.test(text)) {
    return "Faculty name and joining date";
  }
  if (/student's gender/.test(text)) return "Student gender";
  if (/student's date of birth/.test(text) && /sum of all digits/.test(text)) {
    return "Birth-date digit sum";
  }
  if (/consonants/.test(text)) return "Last-name consonant count";
  if (/student's mobile number/.test(text) && /sum of all digits/.test(text)) {
    return "Mobile-number digit sum";
  }
  return null;
}

/**
 * Rows need scan-friendly labels, not a copy of the question paragraph. Keep
 * the complete wording in body_md and derive a stable 3-8 word title here.
 */
function titleFromQuestion(question, kind) {
  if (kind === "python") {
    const known = pythonTitle(question);
    if (known) return known;
  }

  const normalizedCore = coreStatement(question).toLowerCase();
  if (/^retrieve all details of every user/.test(normalizedCore)) {
    return "User details";
  }
  if (/names of all teams\.?$/.test(normalizedCore)) return "All team names";
  if (/number of female students in each department/.test(normalizedCore)) {
    return /department name/.test(normalizedCore)
      ? "Female students by department name"
      : "Female students by department code";
  }

  let phrase = coreStatement(question)
    .replace(/\s+/g, " ")
    .replace(/^["'“”]+\s*/, "")
    .replace(
      /^in this (?:question|problem),?\s+you (?:have to|must)\s+write\s+(?:an?\s+)?python program\s+to\s+/i,
      "",
    )
    .replace(
      /^write\s+(?:an?\s+)?(?:sql(?:\s+(?:query|statement))?|query|python program)(?:\s+that)?\s+to\s+/i,
      "",
    )
    .replace(/^write\s+(?:an?\s+)?python program\s+that\s+/i, "")
    .replace(
      /^(?:find out|find|retrieve|fetch|list|calculate|identify|generate|print|output|display|obtain|provide|return)\s+/i,
      "",
    )
    .replace(/^all details of (?:every|each|the)?\s*(.+?) from (?:the )?database$/i, "$1 details")
    .replace(/\b(?:the )?total number of\b/gi, "count of")
    .replace(/\bcount\s+(?:the\s+)?count\b/gi, "count")
    .replace(/\bfor each\b/gi, "per")
    .replace(/\bof each\b/gi, "per")
    .trim();

  phrase = phrase
    .split(/(?<=[!?])\s+|(?<=\.)\s+(?=[A-Z"'“])/)[0]
    .replace(/[.!?"'“”]+$/, "")
    .trim();

  const words = phrase.match(/[\p{L}\p{N}_]+(?:[-'’][\p{L}\p{N}_]+)*/gu) ?? [];
  const meaningful = words.filter(
    (word) => !TITLE_STOP_WORDS.has(word.toLocaleLowerCase("en")),
  );
  const pool = meaningful.length >= 3 ? meaningful : words;
  const picked = [];
  for (const word of pool) {
    if (picked.length >= MAX_TITLE_WORDS) break;
    const next = [...picked, word].join(" ");
    if (next.length > MAX_TITLE_CHARS && picked.length >= 3) break;
    picked.push(word);
  }

  let title = picked.join(" ").trim();
  if (!title) {
    title = kind === "sql" ? "SQL practice question" : "Python database question";
  }
  return title[0].toUpperCase() + title.slice(1);
}

function titleQualifier(question) {
  const lineFunction = /\b(L\d+)\s*\(/i.exec(question)?.[1];
  if (lineFunction) return lineFunction.toUpperCase();
  return null;
}

function truncateTitle(title, limit) {
  if (title.length <= limit) return title;
  return title.slice(0, limit).replace(/\s+\S*$/, "") || title.slice(0, limit);
}

function uniqueTitle(base, used, question = "") {
  let title = base;
  const qualifier = titleQualifier(question);
  if (used.has(title.toLowerCase()) && qualifier) {
    const available = MAX_TITLE_CHARS - qualifier.length - 3;
    const shortBase = truncateTitle(base, available);
    title = `${shortBase} — ${qualifier}`;
  }
  let suffix = 2;
  while (used.has(title.toLowerCase())) {
    const marker = ` (${suffix})`;
    const available = MAX_TITLE_CHARS - marker.length;
    const shortBase = truncateTitle(base, available);
    title = `${shortBase}${marker}`;
    suffix += 1;
  }
  used.add(title.toLowerCase());
  return title;
}

function referenceSolution(question) {
  const language = question.type === "sql" ? "sql" : "python";
  const label = question.type === "sql" ? "query" : "solution";
  return `A reference ${label}:\n\n\`\`\`${language}\n${question.golden.trim()}\n\`\`\`\n`;
}

/** The feed stores file content and filename in the opposite-named columns. */
function filesFor(question) {
  const content = String(question.dataFileName ?? "");
  const filename = String(question.dataFileContents ?? "");
  if (!content && !filename) return {};
  if (/\.[a-z0-9]+$/i.test(filename)) return { [filename]: content };
  if (/\.[a-z0-9]+$/i.test(content)) return { [content]: filename };
  return {};
}

function pythonTests(group) {
  const seen = new Set();
  const tests = [];
  for (const question of group) {
    const files = filesFor(question);
    const key = JSON.stringify([
      question.solutionHash,
      files,
      question.databaseName,
    ]);
    if (seen.has(key)) continue;
    seen.add(key);
    tests.push({
      stdin: "",
      expected: "",
      expected_hash: question.solutionHash.toLowerCase(),
      hidden: tests.length > 0,
      files,
      argv: [question.databaseName],
    });
  }
  return tests;
}

function batchesBySize(rows) {
  const batches = [];
  let batch = [];
  let size = 2;
  for (const row of rows) {
    const rowSize = JSON.stringify(row).length + 1;
    if (batch.length && size + rowSize > MAX_POST_CHARS) {
      batches.push(batch);
      batch = [];
      size = 2;
    }
    batch.push(row);
    size += rowSize;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

const setMetas = await trpc("getAllProblemSets");
const sets = await Promise.all(
  setMetas.map((set) => trpc("getProblemSetById", String(set.id))),
);
const sourceRows = sets.flatMap((set) =>
  set.problems.map((question) => ({
    ...question,
    setType: set.type,
    sourceSetId: set.id,
    sourceSetName: set.name,
  })),
);

function paperCategory(set) {
  if (set.type === "PYQ") return "pyq";
  if (/\bmock\b/i.test(set.name)) return "mock";
  return null;
}

const paperSets = sets.filter((set) => paperCategory(set));
const paperStatementKeys = new Set(
  paperSets.flatMap((set) =>
    set.problems.map((question) => normalizedStatement(question.question)),
  ),
);

const databaseNames = [...new Set(sourceRows.map((row) => row.databaseName))];
const databaseEntries = await Promise.all(
  databaseNames.map(async (name) => {
    const response = await fetch(`${REMOTE}/db_dumps/${name}.sql`);
    if (!response.ok) throw new Error(`Database ${name} failed (${response.status}).`);
    const dump = await response.text();
    return [name, { dump, schema: schemaFromDump(dump) }];
  }),
);
const databases = new Map(databaseEntries);

const [subject] = await rest(
  `subjects?select=id,name,slug&slug=eq.${SUBJECT_SLUG}`,
);
if (!subject) throw new Error(`Subject "${SUBJECT_SLUG}" does not exist.`);

const existing = await rest(
  `questions?select=id,title,body_md,kind,tags,sort_order,practice_only,topic_id` +
    `&subject_id=eq.${subject.id}&limit=1000`,
);
const existingExact = new Map(
  existing.map((question) => [normalizedStatement(question.body_md), question]),
);

// Identical statements become one question. For Python, repeated rows are
// retained as separate public/hidden fixtures rather than discarded.
const grouped = new Map();
for (const question of sourceRows) {
  const key = normalizedStatement(question.question);
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(question);
}

const skipped = [];
const candidates = [];
for (const group of grouped.values()) {
  const question = group[0];
  const exact = existingExact.get(normalizedStatement(question.question));
  if (exact) {
    skipped.push({ reason: "exact", question, existing: exact });
    continue;
  }
  const expanded = existing.find((item) =>
    isExpandedDuplicate(question.question, item.body_md),
  );
  if (expanded) {
    skipped.push({ reason: "expanded", question, existing: expanded });
    continue;
  }
  candidates.push({ group, question });
}

const topicNames = {
  sql: "OPE SQL Questions",
  python: "OPE Python-PostgreSQL Questions",
};
const legacyTopicNames = {
  sql: "SQL Practice Bank",
  python: "Python-PostgreSQL Practice Bank",
};
const existingTopics = await rest(
  `topics?select=id,name,sort_order&subject_id=eq.${subject.id}` +
    `&order=sort_order.asc`,
);
const topics = new Map(existingTopics.map((topic) => [topic.name, topic]));

async function ensureTopic(name, sortOrder) {
  if (topics.has(name)) return topics.get(name);
  if (!COMMIT) return { id: `dry-run:${name}`, name, sort_order: sortOrder };
  const [created] = await rest(
    "topics",
    "POST",
    [{ subject_id: subject.id, name, week: null, sort_order: sortOrder }],
    "return=representation",
  );
  topics.set(name, created);
  return created;
}

const nextTopicOrder =
  Math.max(0, ...existingTopics.map((topic) => topic.sort_order ?? 0)) + 1;
const sqlTopic = await ensureTopic(topicNames.sql, nextTopicOrder);
const pythonTopic = await ensureTopic(topicNames.python, nextTopicOrder + 1);

const legacyTopics = Object.values(legacyTopicNames)
  .map((name) => topics.get(name))
  .filter(Boolean);
const legacyTopicIds = new Set(legacyTopics.map((topic) => topic.id));
const isManagedQuestion = (question) =>
  legacyTopicIds.has(question.topic_id) ||
  (question.tags ?? []).includes(IMPORTED_TAG);

// Recompute imported titles in feed order so reruns can shorten old rows while
// keeping their labels deterministic. Existing OPE questions are reserved and
// never renamed; imported rows share their established topic labels.
const usedTitles = new Set(
  existing
    .filter((question) => !isManagedQuestion(question))
    .map((question) => question.title.toLowerCase()),
);
const matchedExisting = new Map(
  skipped.map(({ question, existing: match }) => [
    normalizedStatement(question.question),
    match,
  ]),
);
const plannedTitles = new Map();
for (const [key, group] of grouped) {
  const match = matchedExisting.get(key);
  if (match && !isManagedQuestion(match)) continue;
  plannedTitles.set(
    key,
    uniqueTitle(
      titleFromQuestion(group[0].question, group[0].type),
      usedTitles,
      group[0].question,
    ),
  );
}

let sortOrder = Math.max(0, ...existing.map((question) => question.sort_order ?? 0)) + 1;
const rows = candidates.map(({ group, question }) => {
  const database = databases.get(question.databaseName);
  if (!database) throw new Error(`Unknown database "${question.databaseName}".`);
  if (!question.golden?.trim()) throw new Error(`Question ${question.id} has no solution.`);
  if (
    question.type === "python" &&
    !group.every((item) => /^[a-f0-9]{64}$/i.test(item.solutionHash ?? ""))
  ) {
    throw new Error(`Question ${question.id} has an invalid output digest.`);
  }

  const category =
    question.setType === "PYQ"
      ? "pyq"
      : question.setType === "Ace"
        ? "challenge"
        : "practice";
  const kind = question.type === "sql" ? "sql" : "coding";
  const body = [
    coreStatement(question.question),
    "---",
    "### Database schema",
    `\`\`\`sql\n${database.schema}\n\`\`\``,
  ].join("\n\n");

  return {
    subject_id: subject.id,
    topic_id: question.type === "sql" ? sqlTopic.id : pythonTopic.id,
    title:
      plannedTitles.get(normalizedStatement(question.question)) ??
      titleFromQuestion(question.question, question.type),
    body_md: body,
    difficulty:
      question.setType === "Ace"
        ? "hard"
        : question.setType === "PYQ"
          ? "medium"
          : "easy",
    kind,
    solution_md: referenceSolution(question),
    tags: [
      "dbms",
      IMPORTED_TAG,
      category,
      question.type === "sql" ? "sql" : "python-postgresql",
      `db:${question.databaseName}`,
    ],
    sort_order: sortOrder++,
    tests: question.type === "python" ? pythonTests(group) : [],
    mcq_options: [],
    mcq_answer: null,
    setup_sql: database.dump,
    input_labels: null,
    exam: question.setType === "PYQ" ? "PYQ" : null,
    starter_code:
      question.type === "python" ? "# Write your Python solution here.\n" : null,
    language: question.type === "sql" ? "sql" : "python",
    harness: null,
    // A paper question belongs only in PYQs/Test Series. Everything else is a
    // normal practice-bank row.
    practice_only: !paperStatementKeys.has(
      normalizedStatement(question.question),
    ),
  };
});

const internalDuplicateRows = sourceRows.length - grouped.size;
const exactSkipped = skipped.filter((item) => item.reason === "exact").length;
const expandedSkipped = skipped.filter((item) => item.reason === "expanded").length;
const sqlRows = rows.filter((row) => row.kind === "sql");
const codingRows = rows.filter((row) => row.kind === "coding");
const existingPaperMoves = skipped.filter(
  ({ question, existing: match }) =>
    paperStatementKeys.has(normalizedStatement(question.question)) &&
    match.practice_only,
).length;
const newPaperOnly = rows.filter((row) => !row.practice_only).length;
const existingTopicMoves = existing.filter(
  (question) =>
    isManagedQuestion(question) &&
    question.topic_id !==
      (question.kind === "sql" ? sqlTopic.id : pythonTopic.id),
).length;
const existingTitleUpdates = [...plannedTitles].filter(([key, title]) => {
  const match = matchedExisting.get(key);
  return match && match.title !== title;
}).length;

console.log(`DBMS bank audit for "${subject.name}"`);
console.log(`  feed rows:                 ${sourceRows.length}`);
console.log(`  unique statements:         ${grouped.size}`);
console.log(`  repeated rows merged:      ${internalDuplicateRows}`);
console.log(`  exact existing matches:    ${exactSkipped}`);
console.log(`  expanded existing matches: ${expandedSkipped}`);
console.log(`  new SQL questions:         ${sqlRows.length}`);
console.log(`  new Python questions:      ${codingRows.length}`);
console.log(`  total new questions:       ${rows.length}`);
console.log(`  new paper-only questions:  ${newPaperOnly}`);
console.log(`  existing rows to move:     ${existingPaperMoves}`);
console.log(`  imported topic moves:      ${existingTopicMoves}`);
console.log(`  existing titles to shorten:${String(existingTitleUpdates).padStart(5)}`);
console.log(`  PYQ papers:                ${paperSets.filter((set) => paperCategory(set) === "pyq").length}`);
console.log(`  mock papers:               ${paperSets.filter((set) => paperCategory(set) === "mock").length}`);
console.log(
  `  content fingerprint:      ${statementHash(
    [...grouped.values()]
      .map((group) => coreStatement(group[0].question))
      .join("\n"),
  )}`,
);

if (PRINT_TITLES) {
  console.log("\nImported question titles:");
  let index = 0;
  for (const title of plannedTitles.values()) {
    index += 1;
    console.log(`  ${String(index).padStart(3, "0")}. ${title}`);
  }
}

if (!COMMIT) {
  console.log("\nDRY RUN - re-run with --commit to synchronize these rows.");
  process.exit(0);
}

const batches = batchesBySize(rows);
let inserted = 0;
for (const batch of batches) {
  await rest("questions", "POST", batch, "return=minimal");
  inserted += batch.length;
  console.log(`  inserted ${inserted}/${rows.length}`);
}

// Resolve every remote statement to its single local row. This includes the
// rows that were already present before this import and the rows just added.
const current = await rest(
  `questions?select=id,title,body_md,practice_only,topic_id,tags` +
    `&subject_id=eq.${subject.id}&limit=1000`,
);
const currentExact = new Map(
  current.map((question) => [normalizedStatement(question.body_md), question]),
);
const resolved = new Map();
for (const [key, group] of grouped) {
  let local = currentExact.get(key);
  if (!local) {
    local = current.find((question) =>
      isExpandedDuplicate(group[0].question, question.body_md),
    );
  }
  if (!local) throw new Error(`Could not resolve imported statement ${group[0].id}.`);
  resolved.set(key, local);
}

const questionUpdates = [];
let titleUpdates = 0;
for (const [key, title] of plannedTitles) {
  const local = resolved.get(key);
  if (!local || !isManagedQuestion(local)) continue;
  const expectedTopic =
    grouped.get(key)[0].type === "sql" ? sqlTopic.id : pythonTopic.id;
  const patch = {};
  if (local.title !== title) {
    patch.title = title;
    titleUpdates += 1;
  }
  if (local.topic_id !== expectedTopic) patch.topic_id = expectedTopic;
  if (!(local.tags ?? []).includes(IMPORTED_TAG)) {
    patch.tags = [...(local.tags ?? []), IMPORTED_TAG];
  }
  if (Object.keys(patch).length) questionUpdates.push({ id: local.id, patch });
}
for (let index = 0; index < questionUpdates.length; index += 20) {
  await Promise.all(
    questionUpdates.slice(index, index + 20).map(({ id, patch }) =>
      rest(
        `questions?id=eq.${id}`,
        "PATCH",
        patch,
        "return=minimal",
      ),
    ),
  );
}

let removedLegacyTopics = 0;
for (const topic of legacyTopics) {
  const remaining = await rest(
    `questions?select=id&topic_id=eq.${topic.id}&limit=1`,
  );
  if (remaining.length === 0) {
    await rest(`topics?id=eq.${topic.id}`, "DELETE", undefined, "return=minimal");
    removedLegacyTopics += 1;
  }
}

// Questions that belong to a paper must not also appear in Practice.
const paperQuestionIds = new Set();
for (const set of paperSets) {
  for (const question of set.problems) {
    const local = resolved.get(normalizedStatement(question.question));
    if (!local) throw new Error(`Paper question ${question.id} was not resolved.`);
    paperQuestionIds.add(local.id);
  }
}
const idsToMove = [...paperQuestionIds].filter(
  (id) => current.find((question) => question.id === id)?.practice_only,
);
for (let index = 0; index < idsToMove.length; index += 50) {
  const ids = idsToMove.slice(index, index + 50);
  await rest(
    `questions?id=in.(${ids.join(",")})`,
    "PATCH",
    { practice_only: false },
    "return=minimal",
  );
}

function pyqTitle(set, additionalIndex) {
  const match = /^(\d{2})T\d\s+([A-Za-z]{3})(\d{1,2})$/.exec(set.name);
  if (match) {
    return {
      title: `DBMS PYQ - ${Number(match[3])} ${match[2]} 20${match[1]}`,
      year: Number(`20${match[1]}`),
    };
  }
  return { title: `DBMS PYQ - Additional Set ${additionalIndex}`, year: null };
}

const existingPapers = await rest(
  `test_sets?select=id,slug,title,sort_order,category` +
    `&subject_id=eq.${subject.id}&order=sort_order.asc`,
);
let nextPaperOrder =
  Math.max(0, ...existingPapers.map((paper) => paper.sort_order ?? 0)) + 1;
let nextMockNumber =
  Math.max(
    0,
    ...existingPapers
      .map((paper) => /DBMS Mock Test\s+(\d+)/i.exec(paper.title)?.[1])
      .filter(Boolean)
      .map(Number),
  ) + 1;
let additionalPyq = 1;
let papersCreated = 0;

for (const set of paperSets) {
  const category = paperCategory(set);
  const slug = `dbms-${category}-set-${set.id}`;
  const found = existingPapers.find((paper) => paper.slug === slug);
  let title;
  let year = null;
  if (category === "pyq") {
    const named = pyqTitle(set, additionalPyq);
    title = named.title;
    year = named.year;
    if (!/^(\d{2})T\d\s+([A-Za-z]{3})(\d{1,2})$/.test(set.name)) {
      additionalPyq += 1;
    }
  } else {
    title = found?.title ?? `DBMS Mock Test ${nextMockNumber++}`;
  }

  let paper = found;
  if (!paper) {
    [paper] = await rest(
      "test_sets",
      "POST",
      [
        {
          subject_id: subject.id,
          slug,
          title,
          exam: "DBMS OPPE",
          year,
          source: null,
          category,
          duration_seconds: 5400,
          sort_order: nextPaperOrder++,
          is_available: true,
        },
      ],
      "return=representation",
    );
    papersCreated += 1;
  }

  const links = [];
  const seenQuestionIds = new Set();
  for (const question of [...set.problems].sort(
    (left, right) => left.questionNo - right.questionNo,
  )) {
    const local = resolved.get(normalizedStatement(question.question));
    if (!local || seenQuestionIds.has(local.id)) continue;
    seenQuestionIds.add(local.id);
    links.push({
      set_id: paper.id,
      question_id: local.id,
      section:
        question.type === "sql"
          ? "SQL Questions"
          : "Python-PostgreSQL Questions",
      marks: 1,
      sort_order: question.questionNo,
    });
  }
  await rest(
    "test_set_questions?on_conflict=set_id,question_id",
    "POST",
    links,
    "resolution=merge-duplicates,return=minimal",
  );

  const sectionNames = [...new Set(links.map((link) => link.section))];
  await rest(
    "test_set_sections?on_conflict=set_id,name",
    "POST",
    sectionNames.map((name, index) => ({
      set_id: paper.id,
      name,
      sort_order: index + 1,
      best_of: null,
      note: null,
    })),
    "resolution=merge-duplicates,return=minimal",
  );
}

console.log(`\nInserted ${inserted} deduplicated DBMS questions.`);
console.log(`Shortened ${titleUpdates} imported question titles.`);
console.log(`Moved ${existingTopicMoves} imports into the existing OPE topics.`);
console.log(`Removed ${removedLegacyTopics} obsolete import topics.`);
console.log(`Moved ${idsToMove.length} questions out of Practice.`);
console.log(`Created ${papersCreated} papers; ${paperSets.length} are synchronized.`);
