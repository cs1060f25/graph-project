import type { Metadata } from "next";
import "../styles/global.css";

export const metadata: Metadata = {
  title: "Research Navigator",
  description: "Explore connections across research papers visually",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
