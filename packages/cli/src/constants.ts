export type EilConfig = {
  registry: string;
  handle?: string;
  domain?: string;
  cardFile: string;
};

export const DEFAULT_REGISTRY = "https://eilcard.com";
export const DEFAULT_CARD_FILE = ".eil/card.json";
export const CONFIG_FILE = "eil.config.json";
