import {TokenRingPlugin} from "@tokenring-ai/app";
import {CheckpointConfigSchema} from "@tokenring-ai/checkpoint";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import {z} from "zod";
import BrowserAgentStateStorage, {BrowserAgentStateStorageOptionsSchema,} from "./BrowserAgentStateStorage.js";
import packageJSON from "./package.json" with {type: "json"};

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
});

export default {
	name: packageJSON.name,
	version: packageJSON.version,
	description: packageJSON.description,
  install(app, config) {
    if (config.checkpoint) {
			app.services
				.waitForItemByType(AgentCheckpointService, (checkpointService) => {
          const provider = config.checkpoint!.provider;

          if (provider.type === "browser") {
            checkpointService.setCheckpointProvider(
              new BrowserAgentStateStorage(
                BrowserAgentStateStorageOptionsSchema.parse(provider),
              ),
            );
					}
				});
		}
	},
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;