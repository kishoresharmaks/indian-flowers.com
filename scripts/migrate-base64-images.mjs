/**
 * Base64 to Disk File Migration Utility
 * Scans MongoDB Product, Category, and Banner collections for any base64 encoded images.
 * Decodes the image, writes it to public/uploads/[collection]/[id].[ext], and updates MongoDB with the clean path.
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';

// Ensure DNS uses standard public resolvers to resolve SRV records properly on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEnv() {
  for (const envFile of ['.env.local', '.env']) {
    try {
      const envPath = path.join(__dirname, '..', envFile);
      const content = await fs.readFile(envPath, 'utf-8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

function parseBase64(dataString) {
  if (typeof dataString !== 'string') return null;
  const matches = dataString.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  let ext = matches[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'svg+xml') ext = 'svg';
  return {
    ext,
    buffer: Buffer.from(matches[2], 'base64'),
  };
}

async function run() {
  await loadEnv();
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;

  // 1. Process Products
  const productsColl = db.collection('products');
  const base64Products = await productsColl.find({ image: { $regex: /^data:image/ } }).toArray();
  console.log(`Found ${base64Products.length} products with Base64 images.`);

  const productsDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
  await fs.mkdir(productsDir, { recursive: true });

  for (const prod of base64Products) {
    const parsed = parseBase64(prod.image);
    if (parsed) {
      const filename = `${prod._id}.${parsed.ext}`;
      const filePath = path.join(productsDir, filename);
      await fs.writeFile(filePath, parsed.buffer);
      const cleanPath = `/uploads/products/${filename}`;
      await productsColl.updateOne({ _id: prod._id }, { $set: { image: cleanPath } });
      console.log(`  Migrated product [${prod.name || prod._id}] -> ${cleanPath}`);
    }
  }

  // 2. Process Categories
  const categoriesColl = db.collection('categories');
  const base64Categories = await categoriesColl.find({ image: { $regex: /^data:image/ } }).toArray();
  console.log(`Found ${base64Categories.length} categories with Base64 images.`);

  const categoriesDir = path.join(__dirname, '..', 'public', 'uploads', 'categories');
  await fs.mkdir(categoriesDir, { recursive: true });

  for (const cat of base64Categories) {
    const parsed = parseBase64(cat.image);
    if (parsed) {
      const filename = `${cat._id}.${parsed.ext}`;
      const filePath = path.join(categoriesDir, filename);
      await fs.writeFile(filePath, parsed.buffer);
      const cleanPath = `/uploads/categories/${filename}`;
      await categoriesColl.updateOne({ _id: cat._id }, { $set: { image: cleanPath } });
      console.log(`  Migrated category [${cat.name || cat._id}] -> ${cleanPath}`);
    }
  }

  // 3. Process Banners
  const bannersColl = db.collection('banners');
  const base64Banners = await bannersColl.find({ image: { $regex: /^data:image/ } }).toArray();
  console.log(`Found ${base64Banners.length} banners with Base64 images.`);

  const bannersDir = path.join(__dirname, '..', 'public', 'uploads', 'banners');
  await fs.mkdir(bannersDir, { recursive: true });

  for (const banner of base64Banners) {
    const parsed = parseBase64(banner.image);
    if (parsed) {
      const filename = `${banner._id}.${parsed.ext}`;
      const filePath = path.join(bannersDir, filename);
      await fs.writeFile(filePath, parsed.buffer);
      const cleanPath = `/uploads/banners/${filename}`;
      await bannersColl.updateOne({ _id: banner._id }, { $set: { image: cleanPath } });
      console.log(`  Migrated banner [${banner.title || banner._id}] -> ${cleanPath}`);
    }
  }

  console.log('🎉 Base64 migration completed successfully!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
