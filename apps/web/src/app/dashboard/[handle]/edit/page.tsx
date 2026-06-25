import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getSession } from "@/lib/session";
import { getUserPlan } from "@/lib/user-plan";
import type { CardEdition, Offering, OfferingKind } from "@digitalcard/schema";
import { isBusinessEdition } from "@/lib/offering-validation";
import { EditCardForm } from "./edit-card-form";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function EditCardPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const d = t(locale).dashboard;
  const { handle } = await params;

  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.handle, handle), eq(cards.userId, session.user.id)))
    .limit(1);

  if (!card) notFound();

  const { limits, allowedEditions } = await getUserPlan(session.user.id);
  const body = card.body as Record<string, unknown>;
  const contact = (body.contact ?? {}) as {
    email?: string;
    phone?: string;
    website?: string;
  };
  const description = (body.description ?? {}) as {
    tagline?: string;
    summary?: string;
  };
  const sameAs = (body.same_as as string[] | undefined) ?? [];
  const rawActions =
    (body.actions as Array<{
      type: string;
      label: string;
      value?: string;
      url?: string;
    }>) ?? [];
  const products =
    card.type === "organization"
      ? ((body.products as Array<{
          id: string;
          name: string;
          description?: string;
          url?: string;
        }>) ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          url: p.url ?? "",
        }))
      : [];

  const mapOffering = (o: Offering) => ({
    id: o.id,
    name: o.name,
    description: o.description ?? "",
    url: o.url ?? "",
    kind: (o.kind ?? "line") as OfferingKind,
    items: (o.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      url: item.url ?? "",
      kind: (item.kind ?? "product") as OfferingKind,
    })),
  });

  const offerings =
    card.type === "organization"
      ? ((body.offerings as Offering[] | undefined) ?? []).map(mapOffering)
      : [];

  const rawLocale = body.content_locale;
  const contentLocale: "en" | "tr" | "" =
    rawLocale === "tr" ? "tr" : rawLocale === "en" ? "en" : "";

  const registrySignature = (
    body.signatures as { registry?: { alg?: string; kid?: string; jws?: string } } | undefined
  )?.registry;
  const signatureAlg: "RS256" | "ES256" | "EdDSA" | "" =
    registrySignature?.alg === "ES256" ||
    registrySignature?.alg === "EdDSA" ||
    registrySignature?.alg === "RS256"
      ? registrySignature.alg
      : "";
  const signatureKid = registrySignature?.kid ?? "";
  const signatureJws = registrySignature?.jws ?? "";

  const rawCapabilities = body.capabilities as
    | {
        agent_gateway?: string;
        auth?: "none" | "oauth2" | "api_key";
        scopes?: string[];
        actions?: Array<{
          id: string;
          label?: string;
          method: "POST" | "PUT" | "PATCH" | "DELETE";
          path: string;
          scopes: string[];
          idempotent?: boolean;
        }>;
      }
    | undefined;
  const capAgentGateway = rawCapabilities?.agent_gateway ?? "";
  const capAuth: "none" | "oauth2" | "api_key" | "" =
    rawCapabilities?.auth === "none" ||
    rawCapabilities?.auth === "oauth2" ||
    rawCapabilities?.auth === "api_key"
      ? rawCapabilities.auth
      : "";
  const capScopesText = (rawCapabilities?.scopes ?? []).join("\n");
  const capActions = (rawCapabilities?.actions ?? []).map((action) => ({
    id: action.id,
    label: action.label ?? "",
    method: action.method,
    path: action.path,
    scopesText: action.scopes.join(", "),
    idempotent: action.idempotent ?? false,
  }));

  const initial =
    card.type === "organization"
      ? {
          type: "organization" as const,
          nameOfficial: (body.name as { official?: string })?.official ?? "",
          nameShort: (body.name as { short?: string })?.short ?? "",
          tagline: description.tagline ?? "",
          summary: description.summary ?? "",
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          website: contact.website ?? "",
          domain: card.domain ?? "",
          products,
          offerings,
          contentLocale,
          signatureAlg,
          signatureKid,
          signatureJws,
          capAgentGateway,
          capAuth,
          capScopesText,
          capActions,
          sameAsText: sameAs.join("\n"),
        }
      : {
          type: "person" as const,
          nameFull: (body.name as { full?: string })?.full ?? "",
          tagline: description.tagline ?? "",
          summary: description.summary ?? "",
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          website: contact.website ?? "",
          domain: card.domain ?? "",
          sameAsText: sameAs.join("\n"),
          links: rawActions
            .filter((a) => a.type === "link" && a.url)
            .map((a) => ({ label: a.label, url: a.url! })),
          preservedActions: rawActions.filter((a) => a.type !== "link"),
        };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/${handle}`}
        className="mb-4 inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        ← @{handle}
      </Link>
      <h1 className="text-2xl font-bold">{d.editCardTitle}</h1>
      <div className="mt-8">
        <EditCardForm
          handle={handle}
          initial={initial}
          edition={card.edition as CardEdition}
          allowedEditions={allowedEditions}
          maxProducts={limits.maxProducts}
          maxOfferings={limits.maxOfferings}
          m={d}
        />
      </div>
    </div>
  );
}
