import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface CredentialProfile {
  id: string;
  ssid: string;
  security: "open" | "wpa-psk" | "wpa2" | "wpa3" | "unknown";
  createdAt: string;
  updatedAt: string;
}

interface StoredCredential extends CredentialProfile {
  ciphertext: string;
  iv: string;
  tag: string;
}

const key = () => {
  const secret = process.env.CREDENTIAL_STORE_KEY;
  if (!secret) throw new Error("CREDENTIAL_STORE_KEY is not configured");
  return createHash("sha256").update(secret).digest();
};

const storePath = () => path.resolve(process.env.CREDENTIAL_STORE_PATH || "./data/credentials.json");

async function load(): Promise<StoredCredential[]> {
  try {
    return JSON.parse(await readFile(storePath(), "utf8")) as StoredCredential[];
  } catch {
    return [];
  }
}

async function save(items: StoredCredential[]) {
  const target = storePath();
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(items, null, 2), { mode: 0o600 });
}

export async function listCredentialProfiles(): Promise<CredentialProfile[]> {
  return (await load()).map(({ ciphertext: _c, iv: _i, tag: _t, ...profile }) => profile);
}

export async function upsertCredentialProfile(input: {
  id?: string;
  ssid: string;
  security: CredentialProfile["security"];
  password: string;
}): Promise<CredentialProfile> {
  if (!input.ssid || !input.password) throw new Error("SSID and password are required");
  const items = await load();
  const id = input.id || "cred_" + randomBytes(8).toString("hex");
  const now = new Date().toISOString();
  const existing = items.find((x) => x.id === id);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(input.password, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const profile: StoredCredential = {
    id, ssid: input.ssid, security: input.security,
    createdAt: existing?.createdAt || now, updatedAt: now,
    ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64"),
  };
  const next = existing ? items.map((x) => x.id === id ? profile : x) : [...items, profile];
  await save(next);
  return { id: profile.id, ssid: profile.ssid, security: profile.security, createdAt: profile.createdAt, updatedAt: profile.updatedAt };
}

export async function removeCredentialProfile(id: string): Promise<boolean> {
  const items = await load();
  const next = items.filter((x) => x.id !== id);
  if (next.length === items.length) return false;
  await save(next);
  return true;
}

export function isCredentialStoreConfigured(): boolean {
  return Boolean(process.env.CREDENTIAL_STORE_KEY);
}


export async function getCredentialSecret(id: string): Promise<{ ssid: string; security: CredentialProfile["security"]; password: string } | null> {
  if (!process.env.CREDENTIAL_STORE_KEY) return null;
  const item = (await load()).find((x) => x.id === id);
  if (!item) return null;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(item.iv, "base64"));
  decipher.setAuthTag(Buffer.from(item.tag, "base64"));
  const password = Buffer.concat([
    decipher.update(Buffer.from(item.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return { ssid: item.ssid, security: item.security, password };
}
