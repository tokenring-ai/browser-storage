import z from "zod";

export const BrowserStorageServiceConfigSchema = z
  .object({
    storageKeyPrefix: z.string().default("tokenring:"),
  })
  .default({storageKeyPrefix: "tokenring:"});

export type ParsedBrowserStorageConfig = z.output<
  typeof BrowserStorageServiceConfigSchema
>;
