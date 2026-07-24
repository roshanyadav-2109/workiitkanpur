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

export const metadata: Metadata = {
  title: {
    default: "IITM BS Community",
    template: "%s — IITM BS Community",
  },
  description:
    "Focused practice for the IIT Madras BS Degree OPPE. Browse curated questions, time your attempts, and watch your progress grow.",
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

        {/* Google tag (gtag.js) — loads after hydration, the strategy Next
            recommends for analytics/tag managers. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
