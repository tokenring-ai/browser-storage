import type { TokenRingPlugin } from "@tokenring-ai/app";

import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import { z } from "zod";
import BrowserStorageService from "./BrowserStorageService.ts";
import packageJSON from "./package.json" with { type: "json" };
import { BrowserStorageServiceConfigSchema } from "./schema.ts";

const packageConfigSchema = z.object({
  browserStorage: BrowserStorageServiceConfigSchema,
});

export default {
  name: packageJSON.name,
  displayName: "Browser Storage",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.browserStorage) {
      const browserStorage = new BrowserStorageService(config.browserStorage);
      app.services.register(browserStorage);
      app.services.waitForItemByType(AgentCheckpointService, checkpointService => {
        checkpointService.setCheckpointProvider(browserStorage);
      });
    }
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
