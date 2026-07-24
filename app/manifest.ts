import type { MetadataRoute } from "next";

/** Web app manifest — installability + richer mobile/search presentation. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IITM BS Community — OPPE Practice",
    short_name: "IITM BS Community",
    description:
      "OPPE practice for the IIT Madras BS Degree — previous-year questions and timed mocks with in-browser grading.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5a48d6",
    icons: [
      {
        src: "/iitm-logo-color.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
