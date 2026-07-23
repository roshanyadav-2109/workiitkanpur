/**
 * Pull the first ```sql fenced block out of a solution. That query is the
 * grading key for SQL questions: the runtime executes it in the browser and
 * compares its result to the learner's. Shared by the practice IDE and the
 * Test Series runner so a SQL paper grades the same way in both.
 */
export function extractSqlBlock(md: string | null): string | null {
  if (!md) return null;
  const m = md.match(/```sql\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : null;
}
