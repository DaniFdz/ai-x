import readline from "readline";
import { exec } from "child_process";
import {
  readCredentials,
  saveCredentials,
  CREDENTIALS_PATH,
  type Credentials,
} from "./config.js";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function verifyTwitter(authToken: string, ct0: string): Promise<{ valid: boolean; account?: string; error?: string }> {
  return new Promise((resolve) => {
    exec(
      `bird whoami --auth-token '${authToken}' --ct0 '${ct0}'`,
      { timeout: 15000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve({ valid: false, error: stderr || error.message });
        } else {
          resolve({ valid: true, account: stdout.trim() });
        }
      }
    );
  });
}

async function main() {
  console.log("\n  ai-x — setup\n");

  const existing = readCredentials();
  if (existing) {
    console.log("  Found existing credentials");
    console.log("  Verifying Twitter...");
    const result = await verifyTwitter(existing.authToken, existing.ct0);
    if (result.valid && existing.anthropicApiKey) {
      console.log(`  Twitter: ${result.account}`);
      console.log(`  Anthropic API key: ${"*".repeat(8)}...${existing.anthropicApiKey.slice(-4)}`);
      console.log(`  Stored at: ${CREDENTIALS_PATH}\n`);
      return;
    }
    console.log(`  Credentials incomplete or invalid.`);
    console.log("  Let's set up new ones.\n");
  }

  // Anthropic API key
  console.log("  1. Anthropic API key");
  console.log("  Get one at https://console.anthropic.com/settings/keys\n");
  const anthropicApiKey = await ask("  API key: ");
  if (!anthropicApiKey) {
    console.error("\n  Anthropic API key is required.");
    process.exit(1);
  }

  // Twitter credentials
  console.log("\n  2. Twitter/X credentials");
  console.log("  Open x.com → DevTools → Application → Cookies → x.com");
  console.log("  Copy the values for auth_token and ct0\n");

  const authToken = await ask("  auth_token: ");
  const ct0 = await ask("  ct0: ");

  if (!authToken || !ct0) {
    console.error("\n  Both auth_token and ct0 are required.");
    process.exit(1);
  }

  console.log("\n  Verifying Twitter...");
  const result = await verifyTwitter(authToken, ct0);

  if (!result.valid) {
    console.error(`\n  Twitter auth failed: ${result.error}`);
    console.error("  Check your credentials and try again.");
    process.exit(1);
  }

  const creds: Credentials = { method: "tokens", authToken, ct0, anthropicApiKey };
  saveCredentials(creds);

  console.log(`  Twitter: ${result.account}`);
  console.log(`  Anthropic API key: ${"*".repeat(8)}...${anthropicApiKey.slice(-4)}`);
  console.log(`  Saved to: ${CREDENTIALS_PATH}\n`);
  console.log("  Run 'npm start' to launch ai-x.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
