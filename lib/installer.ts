import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { randomBytes } from 'crypto';
import path from 'path';
import mongoose from 'mongoose';

const uriPattern = /^mongodb(?:\+srv)?:\/\//i;

export function parseMongoUri(value: unknown, databaseName?: unknown) {
  if (typeof value !== 'string' || value.length > 2048 || !uriPattern.test(value)) {
    throw new Error('Enter a valid mongodb:// or mongodb+srv:// connection URI.');
  }
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('Enter a valid MongoDB connection URI.'); }
  if (!parsed.hostname || parsed.port && !/^\d{1,5}$/.test(parsed.port)) throw new Error('The MongoDB host or port is invalid.');
  const fromUri = decodeURIComponent(parsed.pathname).replace(/^\//, '');
  const requested = typeof databaseName === 'string' && databaseName.trim() ? databaseName.trim() : '';
  if (requested && fromUri && requested !== fromUri) throw new Error('The database name must match the database in the connection URI.');
  const database = requested || fromUri;
  if (!database || !/^[A-Za-z0-9_.-]{1,64}$/.test(database)) throw new Error('Provide a valid database name.');
  return { uri: value.trim(), database };
}

export async function verifyMongoConnection(uri: string, database: string) {
  const connection = await mongoose.createConnection(uri, { dbName: database, serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 }).asPromise();
  try {
    await connection.db.admin().command({ ping: 1 });
  } finally {
    await connection.close();
  }
}

export function safeMongoError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/auth|authentication|not authorized/i.test(message)) return 'MongoDB authentication or database permission was rejected.';
  if (/ENOTFOUND|querySrv|DNS|SRV/i.test(message)) return 'MongoDB host or SRV DNS could not be resolved.';
  if (/timed out|ECONNREFUSED|network/i.test(message)) return 'MongoDB could not be reached. Check network access and firewall rules.';
  if (/TLS|certificate/i.test(message)) return 'MongoDB TLS certificate validation failed.';
  return 'MongoDB could not be verified. Review the URI and database permissions, then try again.';
}

export async function persistMongoUri(uri: string) {
  // Self-hosted Next.js reads .env.local on the next start; runtime override keeps this process aligned now.
  const envPath = path.join(process.cwd(), '.env.local');
  let original = '';
  try { original = await readFile(envPath, 'utf8'); } catch (error: any) { if (error?.code !== 'ENOENT') throw new Error('The deployment configuration is not writable. Set MONGODB_URI in your host environment and restart.'); }
  const line = `MONGODB_URI=${JSON.stringify(uri)}`;
  let next = /^MONGODB_URI=.*$/m.test(original) ? original.replace(/^MONGODB_URI=.*$/m, line) : `${original}${original && !original.endsWith('\n') ? '\n' : ''}${line}\n`;
  if (!/^AUTH_SECRET=.+$/m.test(next) && !process.env.AUTH_SECRET) next += `AUTH_SECRET=${randomBytes(32).toString('base64url')}\n`;
  const temp = `${envPath}.${process.pid}.tmp`;
  await mkdir(path.dirname(envPath), { recursive: true });
  await writeFile(temp, next, { encoding: 'utf8', mode: 0o600 });
  await rename(temp, envPath);
}

export function validImageDataUrl(value: unknown) {
  return typeof value === 'string' && value.length <= 700_000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}

export async function buildEnvironmentDownload(metadata: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env.local');
  let content = '';
  try { content = await readFile(envPath, 'utf8'); } catch { /* Managed hosts may not have a writable env file. */ }
  const entries = Object.entries(metadata).map(([key, value]) => `${key}=${JSON.stringify(value)}`);
  return `${content.trimEnd()}${content.trim() ? '\n\n' : ''}# Installation record — these values are also stored in MongoDB.\n${entries.join('\n')}\n`;
}
