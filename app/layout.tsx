import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "H5P AI Generator",
  description: "Generate editable H5P True/False questions from plain text."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
