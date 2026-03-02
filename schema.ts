import z from "zod";

export const BrowserStorageServiceConfigSchema = z.object({
  storageKeyPrefix: z.string().default('tokenring:'),
}).prefault({});

export type ParsedBrowserStorageConfig = z.output<typeof BrowserStorageServiceConfigSchema>;