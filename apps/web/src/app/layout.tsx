import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n/get-locale";

export const metadata: Metadata = {
  title: "EIL — Entity Identity Layer",
  description:
    "Domain-verified entity identity for AI agents. Canonical JSON in milliseconds.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
