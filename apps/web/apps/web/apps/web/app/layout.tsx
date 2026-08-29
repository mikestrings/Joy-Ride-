import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joy Ride — Ride. Earn. Repeat.",
  description:
    "Hyper-local mobility and rewards for students and commuters in Ile-Ife."
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
