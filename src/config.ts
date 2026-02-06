import fs from "fs";
import path from "path";
import os from "os";

export const CONFIG_DIR = path.join(os.homedir(), ".config", "x-ai");
export const CREDENTIALS_PATH = path.join(CONFIG_DIR, "credentials.json");
export const MEMORY_PATH = path.join(CONFIG_DIR, "memory.json");

function ensureConfigDir(): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

export interface Credentials {
  method: "tokens";
  authToken: string;
  ct0: string;
}

export function readCredentials(): Credentials | null {
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  ensureConfigDir();
  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2));
}

export interface UserMemory {
  interests: string[];
  preferredAccounts: string[];
  summaryStyle: "brief" | "balanced" | "detailed";
  notes: string[];
}

const DEFAULT_MEMORY: UserMemory = {
  interests: [],
  preferredAccounts: [],
  summaryStyle: "balanced",
  notes: [],
};

export function readMemory(): UserMemory {
  try {
    const raw = fs.readFileSync(MEMORY_PATH, "utf-8");
    return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

export function saveMemory(memory: UserMemory): void {
  ensureConfigDir();
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}
