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

function verifyCredentials(creds: Credentials): Promise<{ valid: boolean; account?: string; error?: string }> {
  return new Promise((resolve) => {
    exec(
      `bird whoami --auth-token '${creds.authToken}' --ct0 '${creds.ct0}'`,
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
  console.log("\n  ai-x — Twitter/X credential setup\n");

  const existing = readCredentials();
  if (existing) {
    console.log("  Found existing credentials");
    console.log("  Verifying...");
    const result = await verifyCredentials(existing);
    if (result.valid) {
      console.log(`  Authenticated as: ${result.account}`);
      console.log(`  Stored at: ${CREDENTIALS_PATH}\n`);
      return;
    }
    console.log(`  Credentials invalid: ${result.error}`);
    console.log("  Let's set up new ones.\n");
  }

  console.log("  Open x.com → DevTools → Application → Cookies → x.com");
  console.log("  Copy the values for auth_token and ct0\n");

  const authToken = await ask("  auth_token: ");
  const ct0 = await ask("  ct0: ");

  if (!authToken || !ct0) {
    console.error("\n  Both auth_token and ct0 are required.");
    process.exit(1);
  }

  const creds: Credentials = { method: "tokens", authToken, ct0 };

  console.log("\n  Verifying...");
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
