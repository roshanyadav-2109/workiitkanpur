import { OppeContentHub } from "@/components/marketing/oppe-content-hub";
import { getOppeHubSubjects } from "@/lib/oppe-hubs";
import {
  breadcrumbNode,
  collectionPageNode,
  itemListNode,
  jsonLdGraph,
  pageMetadata,
} from "@/lib/seo";

const TITLE = "IIT Madras BS Degree OPPE Mock Tests & Test Series";
const DESCRIPTION =
  "Take full IIT Madras BS Degree OPPE mock tests for Python and DBMS with a countdown, question palette, test-case grading, scores and attempt review.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/test-series",
  keywords: [
    "IIT Madras BS OPPE mock test",
    "OPPE test series",
    "Python OPPE mock test",
    "DBMS OPPE mock test",
  ],
});

export default async function TestSeriesPage() {
  const subjects = await getOppeHubSubjects("test-series");
  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Test Series", path: "/test-series" },
    ]),
    collectionPageNode({
      name: TITLE,
      description: DESCRIPTION,
      path: "/test-series",
    }),
    itemListNode(subjects.map((subject) => ({ name: subject.name, path: subject.href }))),
  ]);

  return (
    <OppeContentHub kind="test-series" subjects={subjects} jsonLd={jsonLd} />
  );
}
