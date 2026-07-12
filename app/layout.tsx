import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
      </body>
    </html>
  );
}
