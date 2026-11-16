import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tic-Tac-Toe Arcade",
  description:
    "Retro neo-brutalist Tic-Tac-Toe with animated rivalry packs, synth sound effects and a persistent scoreboard.",
};

export const viewport: Viewport = {
  themeColor: "#FFFDF5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFFDF5] text-black transition-colors dark:bg-[#141418] dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
