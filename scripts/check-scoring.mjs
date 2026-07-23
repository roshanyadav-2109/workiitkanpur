// Exercises lib/scoring.ts — the paper marking rules — against the shapes real
// OPPE papers use, including the DBMS "solve any one" section.
//
//   node --experimental-strip-types scripts/check-scoring.mjs
//
// Uses Node's built-in TypeScript stripping so the rules are tested as shipped,
// with no build step and no duplicated copy of the logic to drift.
const { scorePaper, countedCount, describeSectionRule } = await import(
  "../lib/scoring.ts"
);

let failures = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
};

const sec = (name, bestOf, qs) => ({
  name,
  bestOf,
  questions: qs.map(([id, correct, marks]) => ({ questionId: id, correct, marks })),
});

// --- The real DBMS paper: 7 SQL (all count) + 2 Python (best 1 of 2) ---------
const sql7 = (correctCount) =>
  sec(
    "OPE SQL Questions",
    null,
    Array.from({ length: 7 }, (_, i) => [`s${i}`, i < correctCount, 10]),
  );

check(
  "all 7 SQL right, neither Python -> 70/80",
  (() => {
    const r = scorePaper([sql7(7), sec("Python", 1, [["q8", false, 10], ["q9", false, 10]])]);
    return [r.score, r.total];
  })(),
  [70, 80],
);

check(
  "solved only Q8 -> the one answer counts",
  (() => {
    const r = scorePaper([sql7(0), sec("Python", 1, [["q8", true, 10], ["q9", false, 10]])]);
    return [r.score, r.total];
  })(),
  [10, 80],
);

check(
  "solved BOTH Python questions -> still only one counts",
  (() => {
    const r = scorePaper([sql7(0), sec("Python", 1, [["q8", true, 10], ["q9", true, 10]])]);
    return [r.score, r.total];
  })(),
  [10, 80],
);

check(
  "full marks",
  (() => {
    const r = scorePaper([sql7(7), sec("Python", 1, [["q8", true, 10], ["q9", true, 10]])]);
    return [r.score, r.total];
  })(),
  [80, 80],
);

// --- Unequal marks -----------------------------------------------------------
check(
  "best-1-of-2 with unequal marks: total is the HIGHER question, everyone out of the same",
  (() => {
    const r = scorePaper([sec("S", 1, [["a", true, 20], ["b", false, 30]])]);
    return [r.score, r.total];
  })(),
  [20, 30],
);

check(
  "best-1-of-2 picks the higher-scoring answer",
  (() => {
    const r = scorePaper([sec("S", 1, [["a", true, 20], ["b", true, 30]])]);
    return [r.score, r.total];
  })(),
  [30, 30],
);

check(
  "best 2 of 4",
  (() => {
    const r = scorePaper([
      sec("S", 2, [["a", true, 10], ["b", false, 10], ["c", true, 10], ["d", true, 10]]),
    ]);
    return [r.score, r.total];
  })(),
  [20, 20],
);

// --- Defensive / config-error cases -----------------------------------------
check("bestOf null = all count", countedCount(null, 5), 5);
check("bestOf larger than section = all count", countedCount(9, 5), 5);
check("bestOf 0 falls back to all (never silently discard work)", countedCount(0, 5), 5);
check("bestOf negative falls back to all", countedCount(-2, 5), 5);

check(
  "missing/zero marks default to 1",
  (() => {
    const r = scorePaper([sec("S", null, [["a", true, 0], ["b", true, NaN]])]);
    return [r.score, r.total];
  })(),
  [2, 2],
);

check(
  "empty paper doesn't crash",
  (() => {
    const r = scorePaper([]);
    return [r.score, r.total];
  })(),
  [0, 0],
);

// --- Wording -----------------------------------------------------------------
check("rule text: solve any one", describeSectionRule(1, 2), "Solve any one");
check("rule text: best 2 of 4", describeSectionRule(2, 4), "Best 2 of 4");
check("rule text: none when all count", describeSectionRule(null, 7), null);
check("rule text: none when bestOf covers everything", describeSectionRule(7, 7), null);

// --- Section breakdown -------------------------------------------------------
check(
  "counted ids reported for review UI",
  scorePaper([sec("S", 1, [["a", false, 10], ["b", true, 10]])]).sections[0]
    .countedQuestionIds,
  ["b"],
);

console.log(failures === 0 ? "\nAll scoring cases correct." : `\n${failures} FAILED`);
process.exit(failures ? 1 : 0);
