import {
  createAgentSession,
  AuthStorage,
  ModelRegistry,
  DefaultResourceLoader,
  InteractiveMode,
} from "@mariozechner/pi-coding-agent";
import { getModel } from "@mariozechner/pi-ai";
import { tools } from "./tools/index.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { CONFIG_DIR, readCredentials } from "./config.js";

async function main() {
  const creds = readCredentials();
  if (!creds) {
    console.error("\n  No Twitter/X credentials found.");
    console.error("  Run 'npm run auth' to set up authentication first.\n");
    process.exit(1);
  }

  const authStorage = new AuthStorage();
  const modelRegistry = new ModelRegistry(authStorage);

  const model = getModel("anthropic", "claude-opus-4-5");
  if (!model) {
    console.error(
      "Could not find model claude-opus-4-5. Make sure you have an Anthropic API key set."
    );
    console.error("Set it via: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const resourceLoader = new DefaultResourceLoader({
    agentDir: CONFIG_DIR,
    systemPrompt: SYSTEM_PROMPT,
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    model,
    thinkingLevel: "low",
    tools: tools as any,
    authStorage,
    modelRegistry,
    agentDir: CONFIG_DIR,
    resourceLoader,
  });

  // Trigger the agent's greeting before the TUI starts so the user
  // sees suggestions immediately without having to type first.
  await session.prompt("hello");

  const mode = new InteractiveMode(session);
  await mode.run();
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
