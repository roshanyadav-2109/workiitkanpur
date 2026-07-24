import type { MetadataRoute } from "next";

/** Web app manifest — installability + richer mobile/search presentation. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OPPE Practice — IIT Madras BS Degree OPPE",
    short_name: "OPPE Practice",
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
