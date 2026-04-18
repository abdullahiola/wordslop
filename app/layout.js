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
  title: "AIWordSlop — Neural Crypto Gossip Engine",
  description:
    "Two AI agents invent the most absurd crypto token names — HarryPotterObamaPacman8INU, RetardioButtFuckAnsem420AI — and roast each other about it.",
  keywords: ["AI", "wordslop", "crypto", "memecoin", "degen", "slop", "token", "Claude"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
