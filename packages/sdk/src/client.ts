import {
  CardNotFoundError,
  InvalidResolveInputError,
  JwsVerificationError,
  RegistryError,
} from './errors.js';
import { verifyRegistryJws } from './jws.js';
import type {
  Card,
  DigitalCardClientOptions,
  JwsVerifyClientOption,
  ResolveInput,
  ResolveMeta,
  ResolveResult,
} from './types.js';

const DEFAULT_REGISTRY = 'https://eilcard.com';
const API_PREFIX = '/api/v1';
const DEFAULT_TIMEOUT = 10_000;
const WELL_KNOWN_PATH = '/.well-known/digital-card';

export class DigitalCardClient {
  private readonly registryBaseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private readonly skipWellKnownFallback: boolean;
  private readonly verifyJws?: JwsVerifyClientOption;
  private readonly fetchFn: typeof fetch;

  constructor(options: DigitalCardClientOptions = {}) {
    this.registryBaseUrl = (options.registryBaseUrl ?? DEFAULT_REGISTRY).replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.skipWellKnownFallback = options.skipWellKnownFallback ?? false;
    this.verifyJws = options.verifyJws;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async resolve(input: ResolveInput): Promise<ResolveResult> {
    if (Boolean(input.domain) === Boolean(input.handle)) {
      throw new InvalidResolveInputError();
    }

    const result = input.handle
      ? await this.resolveByHandle(input.handle)
      : await this.resolveByDomain(input.domain!);

    return this.attachTrust(result);
  }

  private async attachTrust(result: ResolveResult): Promise<ResolveResult> {
    if (!this.verifyJws) return result;

    const opts = typeof this.verifyJws === 'object' ? this.verifyJws : {};
    const jws = await verifyRegistryJws(result.card, {
      publicKeyPem: opts.publicKeyPem,
    });

    if (opts.requireValid && !jws.ok) {
      throw new JwsVerificationError(jws.message);
    }

    return {
      ...result,
      trust: { jws },
    };
  }

  private async resolveByHandle(handle: string): Promise<ResolveResult> {
    const url = `${this.registryBaseUrl}${API_PREFIX}/cards/${encodeURIComponent(handle)}`;
    const card = await this.fetchRegistryCard(url);
    return {
      card,
      meta: {
        source: 'registry',
        registry_url: url,
        well_known_url: card.contact.website
          ? `${card.contact.website.replace(/\/$/, '')}${WELL_KNOWN_PATH}`
          : undefined,
        resolved_at: new Date().toISOString(),
      },
    };
  }

  private async resolveByDomain(domain: string): Promise<ResolveResult> {
    const normalized = normalizeDomain(domain);
    const registryUrl = `${this.registryBaseUrl}${API_PREFIX}/resolve?domain=${encodeURIComponent(normalized)}`;

    try {
      const card = await this.fetchRegistryCard(registryUrl);
      return {
        card,
        meta: {
          source: 'registry',
          registry_url: registryUrl,
          well_known_url: `https://${normalized}${WELL_KNOWN_PATH}`,
          resolved_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (!(error instanceof RegistryError) || error.status !== 404) {
        throw error;
      }
    }

    if (this.skipWellKnownFallback) {
      throw new CardNotFoundError({ domain: normalized });
    }

    const wellKnownUrl = `https://${normalized}${WELL_KNOWN_PATH}`;
    const card = await this.fetchWellKnownCard(wellKnownUrl);
    if (!card) {
      throw new CardNotFoundError({ domain: normalized });
    }

    return {
      card,
      meta: {
        source: 'well-known',
        well_known_url: wellKnownUrl,
        resolved_at: new Date().toISOString(),
      },
    };
  }

  private async fetchRegistryCard(url: string): Promise<Card> {
    const response = await this.fetchWithTimeout(url, {
      headers: this.buildHeaders({ accept: 'application/json' }),
    });

    if (response.status === 404) {
      throw new RegistryError(`Registry returned 404 for ${url}`, 404);
    }
    if (!response.ok) {
      throw new RegistryError(`Registry error ${response.status}`, response.status);
    }

    const body = (await response.json()) as { card?: Card } | Card;
    return 'card' in body && body.card ? body.card : (body as Card);
  }

  private async fetchWellKnownCard(url: string): Promise<Card | null> {
    try {
      const response = await this.fetchWithTimeout(url, {
        headers: { Accept: 'application/json' },
      });
      if (response.status === 404) return null;
      if (!response.ok) return null;
      return (await response.json()) as Card;
    } catch {
      return null;
    }
  }

  private buildHeaders(extra: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = { ...extra };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await this.fetchFn(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Convenience singleton-style API */
export const DigitalCard = {
  resolve(input: ResolveInput, options?: DigitalCardClientOptions): Promise<ResolveResult> {
    return new DigitalCardClient(options).resolve(input);
  },
};

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}
