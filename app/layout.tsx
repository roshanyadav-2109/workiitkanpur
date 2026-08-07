import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PUBLISHER_NAME, SITE_NAME, SITE_URL } from "@/lib/seo";

// Google Analytics 4 (gtag.js) measurement ID.
const GA_ID = "G-JK1FNY0TB5";
// Google Tag Manager container ID.
const GTM_ID = "GTM-56MDXL9N";

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
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — PYQs & Mock Tests`,
    template: "%s",
  },
  description:
    "Practise IIT Madras BS Degree OPPE questions for Python, DBMS and more. Solve PYQs, take timed mock tests and get instant test-case grading.",
  applicationName: SITE_NAME,
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
  authors: [{ name: PUBLISHER_NAME }],
  creator: PUBLISHER_NAME,
  publisher: PUBLISHER_NAME,
  category: "education",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "IIT Madras BS Degree OPPE practice with PYQs, coding questions and timed mock tests for Python, DBMS and more.",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Practise IIT Madras BS Degree OPPE questions, PYQs and timed mock tests with instant grading.",
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
        {/* Google Tag Manager (noscript) — Google requires this immediately
            after the opening <body> tag, for visitors without JavaScript. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>

        {/* Accent bar across the very top, above every page's navbar. */}
        <div className="h-1.5 w-full bg-accent" />
        <ThemeProvider>{children}</ThemeProvider>

        {/* Google Tag Manager loader. beforeInteractive so it lands in the
            server-rendered head, as high up as possible. */}
        <Script id="gtm" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>

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
