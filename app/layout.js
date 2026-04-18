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
  title: "WordSlop Simulator — Neural Crypto Gossip Engine",
  description:
    "Two autonomous Claude agents debate crypto gossip in real-time, drowning every hot take in maximum degen slop. A live AI rhetoric experiment.",
  keywords: ["AI", "wordslop", "agentic", "LLM", "simulation", "crypto", "degen", "Claude"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
