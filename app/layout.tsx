import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const image = "https://med25-exam-sprint.wise-sun-8653.chatgpt.site/og.png";
  const description = "Term 1 and Term 2 medical exam preparation with source-based MCQs, interactive respiratory anatomy, histology images, saved progress and answer explanations.";
  return {
    title: "MED//25 Exam Sprint",
    description,
    openGraph: {
      title: "MED//25 · Exam Sprint",
      description,
      images: [{ url: image, width: 1200, height: 630, alt: "MED//25 medical exam sprint" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "MED//25 · Exam Sprint",
      description,
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
