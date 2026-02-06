import { Type } from "@sinclair/typebox";
import { exec } from "child_process";
import {
  readCredentials,
  saveCredentials,
  type Credentials,
} from "../config.js";

function text(t: string) {
  return { content: [{ type: "text" as const, text: t }], details: {} };
}

function runBirdCheck(creds: Credentials): Promise<string> {
  const authArgs =
    creds.method === "cookie-source"
      ? `--cookie-source '${creds.cookieSource}'${creds.chromeProfileDir ? ` --chrome-profile-dir '${creds.chromeProfileDir}'` : ""}`
      : `--auth-token '${creds.authToken}' --ct0 '${creds.ct0}'`;

  return new Promise((resolve) => {
    exec(
      `bird whoami ${authArgs} --json`,
      { timeout: 15000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve(JSON.stringify({ valid: false, error: stderr || error.message }));
          return;
        }
        resolve(JSON.stringify({ valid: true, account: stdout.trim() }));
      }
    );
  });
}

export const credentialsTool = {
  name: "manage_credentials",
  label: "Credentials",
  description:
    "Check or save Twitter/X credentials for the bird CLI. Use action 'check' to verify if credentials exist and are valid. Use action 'save' to store new credentials.",
  parameters: Type.Object({
    action: Type.String({ description: "Action: 'check' or 'save'" }),
    method: Type.Optional(
      Type.String({
        description:
          "Auth method: 'cookie-source' (browser cookies, easiest) or 'tokens' (manual). Required for save.",
      })
    ),
    cookieSource: Type.Optional(
      Type.String({
        description: "Browser: chrome, firefox, brave, arc, edge. For cookie-source method.",
      })
    ),
    chromeProfileDir: Type.Optional(
      Type.String({
        description: "Chrome/Chromium profile dir path. Optional, for Arc/Brave.",
      })
    ),
    authToken: Type.Optional(
      Type.String({ description: "auth_token cookie value. For tokens method." })
    ),
    ct0: Type.Optional(
      Type.String({ description: "ct0 cookie value. For tokens method." })
    ),
  }),
  async execute(
    _toolCallId: string,
    params: { action: string; method?: string; cookieSource?: string; chromeProfileDir?: string; authToken?: string; ct0?: string },
  ) {
    const { action } = params;

    if (action === "check") {
      const creds = readCredentials();
      if (!creds) {
        return text(
          JSON.stringify({
            configured: false,
            message:
              "No credentials found. Ask the user to set up credentials. They can use browser cookies (easiest) or provide auth_token + ct0 manually.",
          })
        );
      }
      const validation = await runBirdCheck(creds);
      return text(
        JSON.stringify({ configured: true, method: creds.method, validation: JSON.parse(validation) })
      );
    }

    if (action === "save") {
      const { method } = params;

      if (method === "cookie-source") {
        if (!params.cookieSource) {
          return text(
            JSON.stringify({
              error: "cookieSource is required. Ask which browser the user is logged into X with.",
            })
          );
        }
        const creds: Credentials = {
          method: "cookie-source",
          cookieSource: params.cookieSource,
          ...(params.chromeProfileDir ? { chromeProfileDir: params.chromeProfileDir } : {}),
        };
        saveCredentials(creds);
        const validation = await runBirdCheck(creds);
        return text(JSON.stringify({ saved: true, validation: JSON.parse(validation) }));
      }

      if (method === "tokens") {
        if (!params.authToken || !params.ct0) {
          return text(
            JSON.stringify({
              error:
                "Both authToken and ct0 are required. Ask the user to extract them from DevTools > Application > Cookies on x.com.",
            })
          );
        }
        const creds: Credentials = { method: "tokens", authToken: params.authToken, ct0: params.ct0 };
        saveCredentials(creds);
        const validation = await runBirdCheck(creds);
        return text(JSON.stringify({ saved: true, validation: JSON.parse(validation) }));
      }

      return text(JSON.stringify({ error: "Invalid method. Use 'cookie-source' or 'tokens'." }));
    }

    return text(JSON.stringify({ error: "Invalid action. Use 'check' or 'save'." }));
  },
};
