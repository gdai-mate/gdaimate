import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "G'dAI Mate - AI-Powered Property Quotes",
  description: "Transform property walkthroughs into professional quotes in minutes. Voice-to-quote magic for Australian trades and property managers. No worries, mate.",
  keywords: ["property quotes", "AI quotes", "voice to quote", "Australian trades", "property management"],
  authors: [{ name: "G'dAI Mate" }],
  creator: "G'dAI Mate",
  publisher: "G'dAI Mate",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://gdaimate.com",
    title: "G'dAI Mate - AI-Powered Property Quotes",
    description: "Transform property walkthroughs into professional quotes in minutes. Voice-to-quote magic for Australian trades.",
    siteName: "G'dAI Mate",
  },
  twitter: {
    card: "summary_large_image",
    title: "G'dAI Mate - AI-Powered Property Quotes",
    description: "Transform property walkthroughs into professional quotes in minutes. Voice-to-quote magic for Australian trades.",
    creator: "@gdaimate",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#D9B43B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
