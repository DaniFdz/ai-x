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

function tryOnce(creds: Credentials): Promise<{ valid: boolean; account?: string; error?: string }> {
  const authArgs =
    creds.method === "cookie-source"
      ? `--cookie-source '${creds.cookieSource}'${creds.chromeProfileDir ? ` --chrome-profile-dir '${creds.chromeProfileDir}'` : ""}`
      : `--auth-token '${creds.authToken}' --ct0 '${creds.ct0}'`;

  return new Promise((resolve) => {
    exec(`bird whoami ${authArgs}`, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ valid: false, error: stderr || error.message });
      } else {
        resolve({ valid: true, account: stdout.trim() });
      }
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyCredentials(creds: Credentials): Promise<{ valid: boolean; account?: string; error?: string }> {
  const maxAttempts = 20;
  let lastError = "";

  for (let i = 0; i < maxAttempts; i++) {
    const result = await tryOnce(creds);
    if (result.valid) return result;
    lastError = result.error || "Unknown error";
    if (i < maxAttempts - 1) {
      process.stdout.write(`\r  Waiting for access... (${i + 1}/${maxAttempts}s)`);
      await sleep(1000);
    }
  }

  process.stdout.write("\n");
  return { valid: false, error: lastError };
}

async function main() {
  console.log("\n  ai-x — Twitter/X credential setup\n");

  const existing = readCredentials();
  if (existing) {
    console.log(`  Found existing credentials (${existing.method})`);
    console.log("  Verifying (approve Keychain access if prompted)...");
    const result = await verifyCredentials(existing);
    if (result.valid) {
      console.log(`  Authenticated as: ${result.account}`);
      console.log(`  Stored at: ${CREDENTIALS_PATH}\n`);
      return;
    }
    console.log(`  Credentials invalid: ${result.error}`);
    console.log("  Let's set up new ones.\n");
  }

  console.log("  How do you want to authenticate?\n");
  console.log("  1) Browser cookies (easiest — uses your logged-in browser session)");
  console.log("  2) Manual tokens (auth_token + ct0 from DevTools)\n");

  const choice = await ask("  Choice [1/2]: ");

  let creds: Credentials;

  if (choice === "2") {
    console.log("\n  Open x.com → DevTools → Application → Cookies → x.com");
    console.log("  Copy the values for auth_token and ct0\n");
    const authToken = await ask("  auth_token: ");
    const ct0 = await ask("  ct0: ");
    if (!authToken || !ct0) {
      console.error("\n  Both auth_token and ct0 are required.");
      process.exit(1);
    }
    creds = { method: "tokens", authToken, ct0 };
  } else {
    console.log("\n  Which browser are you logged into X with?");
    console.log("  Options: chrome, firefox, brave, arc, edge\n");
    const cookieSource = await ask("  Browser: ");
    if (!cookieSource) {
      console.error("\n  Browser name is required.");
      process.exit(1);
    }

    let chromeProfileDir: string | undefined;
    if (["arc", "brave"].includes(cookieSource.toLowerCase())) {
      chromeProfileDir = (await ask("  Chrome profile directory (or press Enter to skip): ")) || undefined;
    }

    creds = {
      method: "cookie-source",
      cookieSource: cookieSource.toLowerCase(),
      ...(chromeProfileDir ? { chromeProfileDir } : {}),
    };
  }

  console.log("\n  Verifying (approve Keychain access if prompted)...");
  const result = await verifyCredentials(creds);

  if (!result.valid) {
    console.error(`\n  Authentication failed: ${result.error}`);
    console.error("  Check your credentials and try again.");
    process.exit(1);
  }

  saveCredentials(creds);
  console.log(`  Authenticated as: ${result.account}`);
  console.log(`  Saved to: ${CREDENTIALS_PATH}\n`);
  console.log("  Run 'npm start' to launch ai-x.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
