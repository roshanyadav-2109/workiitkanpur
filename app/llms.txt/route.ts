import { getSubjects } from "@/lib/queries";
import { listAllArticles } from "@/lib/articles";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * /llms.txt — the emerging standard (llmstxt.org) that hands AI answer engines
 * (ChatGPT, Claude, Perplexity, Gemini) a clean, curated map of the site so
 * they can read, cite and surface it. Generated from live subjects + articles.
 */
export async function GET() {
  let subjects: { name: string; slug: string; is_active: boolean }[] = [];
  try {
    subjects = await getSubjects();
  } catch {
    /* DB unavailable at build/edge — still ship the static intro */
  }
  const articles = listAllArticles();

  const L: string[] = [];
  L.push(`# ${SITE_NAME}`);
  L.push("");
  L.push(
    "> Free practice for the OPPE (Online Proctored Programming Exam) of the " +
      "Online IIT Madras BS Degree. Previous-year questions (PYQs) and full " +
      "timed mock tests with instant grading, in Programming in " +
      "Python, DBMS and more. Built and run by the student community; not " +
      "officially affiliated with IIT Madras.",
  );
  L.push("");
  L.push(
    `${SITE_NAME} helps IITM BS students rehearse the exam workflow: ` +
      "write code, run it against hidden test cases, and get " +
      "graded instantly, just like the real proctored OPPE. Everything here is " +
      "free and requires no account to browse.",
  );
  L.push("");

  L.push("## Subjects");
  for (const s of subjects.filter((subject) => subject.is_active)) {
    L.push(
      `- [${s.name}](${SITE_URL}/app/subjects/${s.slug}): OPPE syllabus, ` +
        `practice questions, PYQs, mock tests and study guides for ${s.name}.`,
    );
  }
  L.push("");

  L.push("## Guides and articles");
  L.push(
    "In-depth, student-written OPPE preparation guides. Free to read and cite:",
  );
  for (const a of articles) {
    L.push(
      `- [${a.title}](${SITE_URL}/app/subjects/${a.subject}/articles/${a.slug}): ${a.description}`,
    );
  }
  L.push("");

  L.push("## Key pages");
  L.push(`- [Home](${SITE_URL}/): what ${SITE_NAME} is and how it works.`);
  L.push(
    `- [Practice questions](${SITE_URL}/practice): subject-wise OPPE problem banks with test-case grading.`,
  );
  L.push(
    `- [Previous-year questions](${SITE_URL}/pyqs): available OPPE PYQ papers grouped by subject.`,
  );
  L.push(
    `- [Test series](${SITE_URL}/test-series): full timed OPPE mock tests.`,
  );
  L.push(
    `- [All subjects](${SITE_URL}/app/subjects): every subject with OPPE practice.`,
  );
  L.push(
    `- [Leaderboard](${SITE_URL}/leaderboard): fastest solvers on the practice questions.`,
  );
  L.push(
    `- [Sign in](${SITE_URL}/login): save progress, submit solutions and take timed tests.`,
  );
  L.push("");

  L.push("## About");
  L.push(
    `${SITE_NAME} is an independent, free study resource for students of the ` +
      "IIT Madras (IITM) BS Degree in Data Science and Applications and in " +
      "Electronic Systems. It focuses specifically on the OPPE / OPE exams. It " +
      "is not affiliated with, endorsed by, or an official product of IIT Madras.",
  );
  L.push("");

  return new Response(L.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
