import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  const description = "July 25, August 22, and August 25 medical exam preparation with sourced MCQs, a 55-specimen histology practical atlas, persistent review, and reasoning repair.";
  return {
    title: "MED//25 Exam Sprint",
    description,
    openGraph: {
      title: "MED//25 · Exam Sprint",
      description: "1,837 focused questions · 55-specimen histology practical atlas",
      images: [{ url: image, width: 1200, height: 630, alt: "MED//25 medical exam sprint" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "MED//25 · Exam Sprint",
      description: "1,837 focused questions · 55-specimen histology practical atlas",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
