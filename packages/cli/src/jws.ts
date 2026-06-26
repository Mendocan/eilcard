import { readFileSync } from "node:fs";
import {
  verifyRegistryJws as verifyJws,
  type Card,
  type JwsVerifyResult,
} from "@digitalcard/sdk";

export type { JwsVerifyResult };

/** CLI helper — reads PEM path then delegates to SDK verify. */
export async function verifyRegistryJws(
  card: Card,
  publicKeyPemPath?: string
): Promise<JwsVerifyResult> {
  const publicKeyPem = publicKeyPemPath
    ? readFileSync(publicKeyPemPath, "utf8")
    : undefined;
  return verifyJws(card, { publicKeyPem });
}
