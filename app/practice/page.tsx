import { OppeContentHub } from "@/components/marketing/oppe-content-hub";
import { getOppeHubSubjects } from "@/lib/oppe-hubs";
import {
  breadcrumbNode,
  collectionPageNode,
  itemListNode,
  jsonLdGraph,
  pageMetadata,
} from "@/lib/seo";

const TITLE = "OPPE Practice Questions by Subject";
const DESCRIPTION =
  "Solve IIT Madras BS Degree OPPE practice questions for Python and DBMS with topic-wise problem banks, test cases, instant grading and saved progress.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/practice",
  keywords: [
    "IIT Madras BS OPPE practice questions",
    "OPPE coding practice",
    "Python OPPE questions",
    "DBMS OPPE questions",
  ],
});

export default async function PracticePage() {
  const subjects = await getOppeHubSubjects("practice");
  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Practice", path: "/practice" },
    ]),
    collectionPageNode({ name: TITLE, description: DESCRIPTION, path: "/practice" }),
    itemListNode(subjects.map((subject) => ({ name: subject.name, path: subject.href }))),
  ]);

  return <OppeContentHub kind="practice" subjects={subjects} jsonLd={jsonLd} />;
}
