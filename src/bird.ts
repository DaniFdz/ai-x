import { exec } from "child_process";
import { readCredentials } from "./config.js";

function shellEscape(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export function executeBird(args: string[]): Promise<string> {
  const creds = readCredentials();
  if (!creds) {
    return Promise.resolve(
      JSON.stringify({
        error:
          "No credentials configured. Ask the user to set up credentials first using the manage_credentials tool.",
      })
    );
  }

  const authArgs: string[] =
    creds.method === "cookie-source"
      ? [
          "--cookie-source",
          creds.cookieSource,
          ...(creds.chromeProfileDir
            ? ["--chrome-profile-dir", creds.chromeProfileDir]
            : []),
        ]
      : ["--auth-token", creds.authToken, "--ct0", creds.ct0];

  const allArgs = [...args, ...authArgs, "--json"];
  const cmd = ["bird", ...allArgs.map(shellEscape)].join(" ");

  return new Promise((resolve) => {
    exec(cmd, { timeout: 30000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        resolve(
          JSON.stringify({ error: stderr || error.message })
        );
        return;
      }
      resolve(stdout || "{}");
    });
  });
}
