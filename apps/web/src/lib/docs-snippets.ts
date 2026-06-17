export function getDocsSnippets(baseUrl: string) {
  const registry = baseUrl.replace(/\/$/, "");

  return {
    install: "npm install @digitalcard/sdk",
    resolve: `import { DigitalCard } from '@digitalcard/sdk'

const { card, meta } = await DigitalCard.resolve({
  domain: 'example.com',
})

console.log(card.name.official)
console.log(card.verified)
console.log(meta.source)`,
    curlResolve: `curl "${registry}/api/v1/resolve?domain=example.com"`,
    curlHandle: `curl "${registry}/api/v1/cards/your-handle"`,
    wellKnown: `curl "https://example.com/.well-known/digital-card"`,
    dnsTxt: "_digital-card.example.com TXT",
  };
}
