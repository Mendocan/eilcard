import { Polar } from "@polar-sh/sdk";
import { getPolarServer } from "@/lib/polar-config";

let client: Polar | null = null;

export function getPolarClient(): Polar {
  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }

  if (!client) {
    client = new Polar({
      accessToken: token,
      server: getPolarServer(),
    });
  }

  return client;
}
