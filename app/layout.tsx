import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Google Analytics 4 (gtag.js) measurement ID.
const GA_ID = "G-JK1FNY0TB5";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

// Public origin — used as the base for canonical URLs, sitemap and OG tags.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppepractice.iitmbsdegree.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IITM BS Community — OPPE Practice for the IIT Madras BS Degree",
    template: "%s — IITM BS Community",
  },
  description:
    "Free OPPE practice for the IIT Madras BS Degree. Solve previous-year OPPE questions (PYQs) and full timed mock tests in Python, DBMS and more — write code in the browser, get instant grading, and track your progress.",
  applicationName: "IITM BS Community",
  keywords: [
    "IIT Madras BS Degree",
    "IITM BS",
    "IITM BS Degree",
    "OPPE",
    "OPPE practice",
    "OPPE 1",
    "OPPE 2",
    "IITM OPPE questions",
    "OPPE previous year questions",
    "PYQ",
    "IIT Madras online degree",
    "Programming in Python OPPE",
    "DBMS OPPE",
    "IITM BS data science",
    "OPPE mock test",
  ],
  authors: [{ name: "IITM BS Community" }],
  creator: "IITM BS Community",
  publisher: "IITM BS Community",
  category: "education",
  openGraph: {
    type: "website",
    siteName: "IITM BS Community",
    title: "OPPE Practice for the IIT Madras BS Degree",
    description:
      "Solve previous-year OPPE questions and full timed mocks in Python, DBMS and more — write code in the browser with instant grading.",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "OPPE Practice for the IIT Madras BS Degree",
    description:
      "Previous-year OPPE questions and timed mocks with in-browser grading. Python, DBMS and more.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full">
        {/* Accent bar across the very top, above every page's navbar. */}
        <div className="h-1.5 w-full bg-accent" />
        <ThemeProvider>{children}</ThemeProvider>

        {/* Google tag (gtag.js). beforeInteractive so it is injected into the
            server-rendered HTML head — this is what Google's "verify tag"
            checker (and Tag Assistant) fetches, so the tag is detectable, not
            just present after client hydration. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
