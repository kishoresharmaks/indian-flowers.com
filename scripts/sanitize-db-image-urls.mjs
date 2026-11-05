/**
 * Standalone Script: sanitize-db-image-urls.mjs
 * 
 * Scans MongoDB collections (orders, products, categories, banners) and converts
 * any hardcoded absolute IP/HTTP URLs (e.g., http://75.119.146.87/uploads/...)
 * into clean, protocol-relative paths (/uploads/...).
 * 
 * This eliminates Mixed Content warnings across both the customer storefront
 * and the Admin Dashboard.
 * 
 * Usage:
 *   node scripts/sanitize-db-image-urls.mjs
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function loadEnv() {
  for (const envFile of ['.env.production', '.env.local', '.env']) {
    try {
      const envPath = path.join(rootDir, envFile);
      if (fsSync.existsSync(envPath)) {
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
      }
    } catch {}
  }
}

function cleanUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return trimmed;

  if (trimmed.includes('/uploads/')) {
    return '/uploads/' + trimmed.split('/uploads/')[1];
  }
  if (trimmed.includes('/wp-content/')) {
    return '/wp-content/' + trimmed.split('/wp-content/')[1];
  }
  if (trimmed.includes('/images/')) {
    return '/images/' + trimmed.split('/images/')[1];
  }

  // If http: on domain or external, convert to https:
  if (trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }

  return trimmed;
}

async function run() {
  await loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env files.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB to sanitize image URLs...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Sanitize Orders
  const ordersColl = db.collection('orders');
  const allOrders = await ordersColl.find({ 'items.image': { $regex: /http/i } }).toArray();
  let updatedOrders = 0;

  for (const order of allOrders) {
    let modified = false;
    const newItems = (order.items || []).map((it) => {
      if (it.image && typeof it.image === 'string' && it.image.startsWith('http')) {
        const cleaned = cleanUrl(it.image);
        if (cleaned !== it.image) {
          modified = true;
          return { ...it, image: cleaned };
        }
      }
      return it;
    });

    if (modified) {
      await ordersColl.updateOne(
        { _id: order._id },
        { $set: { items: newItems, updatedAt: new Date() } }
      );
      updatedOrders++;
    }
  }
  console.log(`✅ Sanitized ${updatedOrders} order(s) in MongoDB (stripped absolute IP URLs).`);

  // 2. Sanitize Products
  const productsColl = db.collection('products');
  const allProducts = await productsColl.find({
    $or: [
      { image: { $regex: /http/i } },
      { images: { $elemMatch: { $regex: /http/i } } },
    ],
  }).toArray();
  let updatedProducts = 0;

  for (const prod of allProducts) {
    let modified = false;
    let newImage = prod.image;
    if (typeof newImage === 'string' && newImage.startsWith('http')) {
      const cleaned = cleanUrl(newImage);
      if (cleaned !== newImage) {
        newImage = cleaned;
        modified = true;
      }
    }

    let newImages = prod.images;
    if (Array.isArray(prod.images)) {
      newImages = prod.images.map((img) => {
        if (typeof img === 'string' && img.startsWith('http')) {
          const cleaned = cleanUrl(img);
          if (cleaned !== img) {
            modified = true;
            return cleaned;
          }
        }
        return img;
      });
    }

    if (modified) {
      await productsColl.updateOne(
        { _id: prod._id },
        { $set: { image: newImage, images: newImages, updatedAt: new Date() } }
      );
      updatedProducts++;
    }
  }
  console.log(`✅ Sanitized ${updatedProducts} product(s) in MongoDB.`);

  // 3. Sanitize Categories
  const categoriesColl = db.collection('categories');
  const allCategories = await categoriesColl.find({ image: { $regex: /http/i } }).toArray();
  let updatedCategories = 0;

  for (const cat of allCategories) {
    if (typeof cat.image === 'string' && cat.image.startsWith('http')) {
      const cleaned = cleanUrl(cat.image);
      if (cleaned !== cat.image) {
        await categoriesColl.updateOne(
          { _id: cat._id },
          { $set: { image: cleaned, updatedAt: new Date() } }
        );
        updatedCategories++;
      }
    }
  }
  console.log(`✅ Sanitized ${updatedCategories} category(ies) in MongoDB.`);

  // 4. Sanitize Banners
  const bannersColl = db.collection('banners');
  const allBanners = await bannersColl.find({
    $or: [
      { image: { $regex: /http/i } },
      { mobileImage: { $regex: /http/i } },
    ],
  }).toArray();
  let updatedBanners = 0;

  for (const b of allBanners) {
    let modified = false;
    let newImg = b.image;
    let newMob = b.mobileImage;
    if (typeof newImg === 'string' && newImg.startsWith('http')) {
      const cleaned = cleanUrl(newImg);
      if (cleaned !== newImg) {
        newImg = cleaned;
        modified = true;
      }
    }
    if (typeof newMob === 'string' && newMob.startsWith('http')) {
      const cleaned = cleanUrl(newMob);
      if (cleaned !== newMob) {
        newMob = cleaned;
        modified = true;
      }
    }
    if (modified) {
      await bannersColl.updateOne(
        { _id: b._id },
        { $set: { image: newImg, mobileImage: newMob, updatedAt: new Date() } }
      );
      updatedBanners++;
    }
  }
  console.log(`✅ Sanitized ${updatedBanners} banner(s) in MongoDB.`);

  console.log('\n✨ Database image URL sanitization complete!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
