import mongoose from 'mongoose';
import dns from 'dns';

// Configure DNS defaults for Node.js (Windows DNS SRV bug workaround)
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  }
} catch (err) {
  // Ignore DNS config errors
}

let runtimeMongoUri: string | undefined;

export function setRuntimeMongoUri(uri: string) {
  runtimeMongoUri = uri;
  cached.conn = null;
  cached.promise = null;
}

export function getConfiguredMongoUri() {
  const uri = runtimeMongoUri || process.env.MONGODB_URI;
  if (!uri) throw new Error('Database has not been configured. Open /setup to continue installation.');
  return uri;
}

/**
 * Resolves mongodb+srv:// URIs using DNS-over-HTTPS (DoH) if Windows local DNS blocks SRV queries.
 */
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/?([^?]*)\??(.*)$/);
  if (!match) return uri;

  const [, username, password, hostname, dbName, queryParams] = match;

  // 1. Try standard Node DNS SRV lookup first
  try {
    const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
    if (srvRecords && srvRecords.length > 0) {
      return uri;
    }
  } catch (dnsErr: any) {
    console.log(`Standard DNS SRV lookup failed (${dnsErr.code || dnsErr.message}). Using HTTPS DNS resolver...`);
  }

  // 2. Fallback to DoH (Google Public DNS over HTTPS)
  try {
    const dohUrl = `https://dns.google/resolve?name=_mongodb._tcp.${hostname}&type=SRV`;
    const res = await fetch(dohUrl);
    const json = await res.json();

    if (json && json.Answer && json.Answer.length > 0) {
      const targetHosts = json.Answer.map((record: any) => {
        const parts = record.data.trim().split(/\s+/);
        const port = parts[2] || '27017';
        const targetHost = parts[3] ? parts[3].replace(/\.$/, '') : '';
        return `${targetHost}:${port}`;
      }).filter((h: string) => h.includes('.mongodb.net'));

      if (targetHosts.length > 0) {
        const searchParams = new URLSearchParams(queryParams || 'retryWrites=true&w=majority');
        if (!searchParams.has('ssl')) searchParams.set('ssl', 'true');
        if (!searchParams.has('authSource')) searchParams.set('authSource', 'admin');

        // Fetch TXT record to retrieve replicaSet and authSource configurations
        try {
          const dohTxtUrl = `https://dns.google/resolve?name=${hostname}&type=TXT`;
          const txtRes = await fetch(dohTxtUrl);
          const txtJson = await txtRes.json();
          if (txtJson && txtJson.Answer && txtJson.Answer.length > 0) {
            for (const ans of txtJson.Answer) {
              if (ans.data) {
                const cleanData = ans.data.replace(/"/g, '');
                const txtParams = new URLSearchParams(cleanData);
                txtParams.forEach((val, key) => {
                  if (!searchParams.has(key)) {
                    searchParams.set(key, val);
                  }
                });
              }
            }
          }
        } catch (txtErr: any) {
          console.error('DoH TXT lookup error:', txtErr.message);
        }

        const unescapedUser = decodeURIComponent(username);
        const unescapedPass = decodeURIComponent(password);
        const targetDb = dbName || 'test';
        const directUri = `mongodb://${encodeURIComponent(unescapedUser)}:${encodeURIComponent(unescapedPass)}@${targetHosts.join(',')}/${targetDb}?${searchParams.toString()}`;
        console.log('Successfully resolved direct MongoDB Atlas cluster endpoints via DoH!');
        return directUri;
      }
    }
  } catch (dohErr: any) {
    console.error('HTTPS DNS resolution error:', dohErr.message);
  }

  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = (async () => {
      // Safely disconnect any pending or failed connection state first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const configuredUri = getConfiguredMongoUri();
      const targetUri = await resolveMongoUri(configuredUri);

      try {
        const conn = await mongoose.connect(targetUri, opts);
        return conn;
      } catch (atlasErr: any) {
        throw atlasErr;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
