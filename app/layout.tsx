import type { Metadata } from "next";
import "./globals.css";
import "@/styles/dashboard.css";

export const metadata: Metadata = {
  title: "IRL XP — Turn Real Life into an RPG Adventure",
  description: "Turn your daily habits into an epic adventure. Complete quests, level up, and become the hero of your own life.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased bg-[#080C14] text-[#F3F4F6] selection:bg-[#E5B869]/30 selection:text-[#E5B869]">
        {children}
      </body>
    </html>
  );
}
