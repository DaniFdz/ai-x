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

  // Check what we already have
  let anthropicApiKey = existing?.anthropicApiKey || "";
  let authToken = existing?.authToken || "";
  let ct0 = existing?.ct0 || "";
  let twitterValid = false;
  let twitterAccount = "";

  // Verify existing Twitter credentials if present
  if (authToken && ct0) {
    console.log("  Checking Twitter credentials...");
    const result = await verifyTwitter(authToken, ct0);
    if (result.valid) {
      twitterValid = true;
      twitterAccount = result.account || "";
      console.log(`  Twitter: ${twitterAccount} ✓`);
    } else {
      console.log(`  Twitter: invalid (${result.error})`);
      authToken = "";
      ct0 = "";
    }
  }

  if (anthropicApiKey) {
    console.log(`  Anthropic API key: ********...${anthropicApiKey.slice(-4)} ✓`);
  }

  // If everything is valid, we're done
  if (twitterValid && anthropicApiKey) {
    console.log(`\n  All good! Stored at: ${CREDENTIALS_PATH}\n`);
    return;
  }

  console.log("");

  // Ask for what's missing
  if (!anthropicApiKey) {
    console.log("  Anthropic API key");
    console.log("  Get one at https://console.anthropic.com/settings/keys\n");
    anthropicApiKey = await ask("  API key: ");
    if (!anthropicApiKey) {
      console.error("\n  Anthropic API key is required.");
      process.exit(1);
    }
    console.log("");
  }

  if (!twitterValid) {
    console.log("  Twitter/X credentials");
    console.log("  Open x.com → DevTools → Application → Cookies → x.com");
    console.log("  Copy the values for auth_token and ct0\n");

    authToken = await ask("  auth_token: ");
    ct0 = await ask("  ct0: ");

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
    twitterAccount = result.account || "";
  }

  const creds: Credentials = { method: "tokens", authToken, ct0, anthropicApiKey };
  saveCredentials(creds);

  console.log(`\n  Twitter: ${twitterAccount}`);
  console.log(`  Anthropic API key: ********...${anthropicApiKey.slice(-4)}`);
  console.log(`  Saved to: ${CREDENTIALS_PATH}\n`);
  console.log("  Run 'npm start' to launch ai-x.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
