import { ImageResponse } from "next/og";

export const alt = "OPPE Practice — OPPE prep for the IIT Madras BS Degree";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social-share card. Generated at build time (no request-time data), so it
 * is static and cached. Uses system fonts only — no asset to load or fail.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #6d5ce2 0%, #5a48d6 60%, #4a39c0 100%)",
          color: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
          IIT Madras Online BS Degree
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Practice for your
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#f2d98a",
            }}
          >
            OPPE Exams
          </div>
          <div style={{ marginTop: 28, fontSize: 34, fontWeight: 400, color: "rgba(255,255,255,0.9)" }}>
            Previous-year questions & timed mocks · in-browser grading
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 600 }}>
          oppepractice.iitmbsdegree.in
        </div>
      </div>
    ),
    { ...size },
  );
}
