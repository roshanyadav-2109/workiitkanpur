import { OppeContentHub } from "@/components/marketing/oppe-content-hub";
import { getOppeHubSubjects } from "@/lib/oppe-hubs";
import {
  breadcrumbNode,
  collectionPageNode,
  itemListNode,
  jsonLdGraph,
  pageMetadata,
} from "@/lib/seo";

const TITLE = "IIT Madras BS Degree OPPE Previous-Year Questions (PYQs)";
const DESCRIPTION =
  "Practise available IIT Madras BS Degree OPPE previous-year papers by subject, with paper order, sections, marks, timing and in-browser answer testing.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/pyqs",
  keywords: [
    "IIT Madras BS OPPE PYQ",
    "OPPE previous year questions",
    "Python OPPE PYQ",
    "DBMS OPPE PYQ",
  ],
});

export default async function PyqPage() {
  const subjects = await getOppeHubSubjects("pyqs");
  const jsonLd = jsonLdGraph([
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "OPPE PYQs", path: "/pyqs" },
    ]),
    collectionPageNode({ name: TITLE, description: DESCRIPTION, path: "/pyqs" }),
    itemListNode(subjects.map((subject) => ({ name: subject.name, path: subject.href }))),
  ]);

  return <OppeContentHub kind="pyqs" subjects={subjects} jsonLd={jsonLd} />;
}
