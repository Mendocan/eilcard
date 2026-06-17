import { NextResponse } from "next/server";
import { buildRegistryLlmsTxt } from "@/lib/registry-llms";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";
  const body = buildRegistryLlmsTxt(appUrl);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
