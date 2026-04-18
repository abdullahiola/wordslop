import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WordSlop Simulator — Agentic AI Rhetoric Engine",
  description:
    "Watch two autonomous AI agents generate increasingly verbose, cliché-ridden text in real-time. A satirical demonstration of LLM wordslop.",
  keywords: ["AI", "wordslop", "agentic", "LLM", "simulation", "rhetoric"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
