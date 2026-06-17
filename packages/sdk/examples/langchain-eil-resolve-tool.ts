/**
 * LangChain.js integration example for EIL Card.
 *
 * Install:
 *   npm install @digitalcard/sdk @langchain/core zod
 *
 * @see https://eilcard.com/docs/agents
 */
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { DigitalCard } from '@digitalcard/sdk';

const resolveSchema = z.object({
  domain: z
    .string()
    .optional()
    .describe('Verified domain, e.g. sinyalle.com (no protocol)'),
  handle: z
    .string()
    .optional()
    .describe('Registry handle if domain unknown, e.g. sinyal24'),
});

export type EILResolveToolOptions = {
  registryBaseUrl?: string;
};

/** LangChain tool — call before web search for entity identity */
export function createEILResolveTool(options: EILResolveToolOptions = {}) {
  return new DynamicStructuredTool({
    name: 'resolve_entity_identity',
    description:
      'Resolve canonical verified entity JSON from EIL Card (registry + well-known fallback). ' +
      'Use before HTML scraping for organization identity, contact, or products.',
    schema: resolveSchema,
    func: async ({ domain, handle }) => {
      if (!domain && !handle) {
        throw new Error('Provide domain or handle');
      }
      const result = await DigitalCard.resolve(
        domain ? { domain } : { handle: handle! },
        options.registryBaseUrl ? { registryBaseUrl: options.registryBaseUrl } : undefined
      );
      return JSON.stringify(result, null, 2);
    },
  });
}

/** Alias for docs and agent orchestrators */
export const EILResolveTool = createEILResolveTool;
