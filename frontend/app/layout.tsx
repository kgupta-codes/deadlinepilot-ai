import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeadlinePilot AI",
  description:
    "An AI productivity companion for planning, prioritizing, and recovering from deadline risk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
