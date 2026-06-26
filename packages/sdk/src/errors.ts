import type { ResolveInput } from './types.js';

export class DigitalCardError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DigitalCardError';
  }
}

export class CardNotFoundError extends DigitalCardError {
  readonly input: ResolveInput;

  constructor(input: ResolveInput) {
    const target = input.domain ?? input.handle ?? 'unknown';
    super(`Digital card not found: ${target}`);
    this.name = 'CardNotFoundError';
    this.input = input;
  }
}

export class InvalidResolveInputError extends DigitalCardError {
  constructor() {
    super('Provide exactly one of domain or handle');
    this.name = 'InvalidResolveInputError';
  }
}

export class RegistryError extends DigitalCardError {
  readonly status?: number;

  constructor(message: string, status?: number, cause?: unknown) {
    super(message, { cause });
    this.name = 'RegistryError';
    this.status = status;
  }
}

export class SchemaValidationError extends DigitalCardError {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export class JwsVerificationError extends DigitalCardError {
  constructor(message: string) {
    super(message);
    this.name = 'JwsVerificationError';
  }
}
