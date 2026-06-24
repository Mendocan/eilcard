import type { Card, OrganizationCard, PersonCard } from './types.js';
import { SchemaValidationError } from './errors.js';

/** schema.org JSON-LD object (Organization or Person) */
export type SchemaOrgDocument = Record<string, unknown>;

function isOrganization(card: Card): card is OrganizationCard {
  return card.type === 'organization';
}

function isPerson(card: Card): card is PersonCard {
  return card.type === 'person';
}

/**
 * Convert Digital Card → schema.org JSON-LD.
 * @see packages/sdk/SDK.md §6
 */
export function toSchemaOrg(card: Card): SchemaOrgDocument {
  if (isOrganization(card)) {
    const baseUrl = card.contact.website ?? `https://${card.card_id}`;
    const doc: SchemaOrgDocument = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: card.name.official,
      url: card.contact.website ?? baseUrl,
    };

    if (card.name.short) doc.alternateName = card.name.short;
    if (card.contact.email) doc.email = card.contact.email;
    if (card.contact.phone) doc.telephone = card.contact.phone;
    if (card.logo_url) doc.logo = card.logo_url;
    if (card.same_as?.length) doc.sameAs = card.same_as;

    const desc = [card.description?.tagline, card.description?.summary]
      .filter(Boolean)
      .join(' — ');
    if (desc) doc.description = desc;

    if (card.offerings?.length) {
      doc.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: `${card.name.official} offerings`,
        itemListElement: card.offerings.map((offering, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: offering.name,
          ...(offering.description && { description: offering.description }),
          ...(offering.url && { url: offering.url }),
        })),
      };
    }

    return doc;
  }

  if (isPerson(card)) {
    const baseUrl = card.human_url ?? `https://eilcard.com/kart/${card.handle ?? card.card_id}`;
    const doc: SchemaOrgDocument = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${baseUrl}/#person`,
      name: card.name.full,
      url: baseUrl,
    };

    if (card.name.title) doc.jobTitle = card.name.title;
    if (card.contact.email) doc.email = card.contact.email;
    if (card.contact.phone) doc.telephone = card.contact.phone;
    if (card.photo_url) doc.image = card.photo_url;
    if (card.same_as?.length) doc.sameAs = card.same_as;
    if (card.description?.summary) doc.description = card.description.summary;

    if (card.organization_ref) {
      doc.worksFor = {
        '@id': card.organization_ref.startsWith('http')
          ? card.organization_ref
          : `https://${card.organization_ref}/#organization`,
      };
    }

    return doc;
  }

  throw new SchemaValidationError(`Unsupported card type`);
}

/**
 * Convert Person Card → vCard 4.0 text.
 * Organization cards throw SchemaValidationError.
 */
export function toVCard(card: Card): string {
  if (!isPerson(card)) {
    throw new SchemaValidationError('toVCard() supports person cards only');
  }

  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `FN:${escapeVCard(card.name.full)}`,
  ];

  if (card.name.given) lines.push(`N:${escapeVCard(card.name.family ?? '')};${escapeVCard(card.name.given)};;;`);
  if (card.name.title) lines.push(`TITLE:${escapeVCard(card.name.title)}`);
  if (card.contact.email) lines.push(`EMAIL:${card.contact.email}`);
  if (card.contact.phone) lines.push(`TEL:${card.contact.phone}`);
  if (card.human_url) lines.push(`URL:${card.human_url}`);
  if (card.organization_ref) lines.push(`ORG:${escapeVCard(card.organization_ref)}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Generate an llms.txt section for site-level agent discovery.
 */
export function toLlmsTxtSection(card: Card): string {
  const title = isOrganization(card)
    ? card.name.official
    : card.name.full;

  const lines = [`# ${title}`, ''];

  if (card.description?.tagline) lines.push(`> ${card.description.tagline}`, '');
  if (card.description?.summary) lines.push(card.description.summary, '');

  if (isOrganization(card) && card.offerings?.length) {
    lines.push('## Offerings', '');
    for (const o of card.offerings) {
      lines.push(`- ${o.name}${o.description ? `: ${o.description}` : ''}`);
      if (o.items?.length) {
        for (const item of o.items) {
          lines.push(
            `  - ${item.name}${item.description ? `: ${item.description}` : ''}`
          );
        }
      }
    }
    lines.push('');
  } else if (isOrganization(card) && card.products?.length) {
    lines.push('## Products', '');
    for (const p of card.products) {
      lines.push(`- ${p.name}${p.description ? `: ${p.description}` : ''}`);
    }
    lines.push('');
  }

  if (card.human_url) lines.push(`- [Digital Card](${card.human_url})`, '');
  if (card.registry_url) lines.push(`- [Registry JSON](${card.registry_url})`, '');

  return lines.join('\n').trim();
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}
