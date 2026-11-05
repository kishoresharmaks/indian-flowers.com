/**
 * Standalone Script: convert-local-images-to-webp.mjs
 * 
 * Scans local image directories on disk (public/uploads, public/images, public/wp-content/uploads),
 * auto-orients, resizes to ecommerce dimensions (max 1400px), and converts .jpg, .jpeg, and .png
 * to highly-optimized .webp format using Sharp.
 * Also scans existing .webp files and compresses any oversized (>350KB or >1400px) images.
 * 
 * When --update-db is passed, it synchronizes all Products, Categories, Banners, and Orders
 * in MongoDB Atlas to point to the clean relative .webp URLs, while stripping hardcoded IP prefixes.
 * 
 * Usage:
 *   node scripts/convert-local-images-to-webp.mjs              (Converts & optimizes disk images)
 *   node scripts/convert-local-images-to-webp.mjs --update-db  (Converts disk images AND updates MongoDB)
 *   node scripts/convert-local-images-to-webp.mjs --force      (Force re-compresses all existing webp files)
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import mongoose from 'mongoose';
import dns from 'dns';

// Ensure DNS works smoothly for MongoDB SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const shouldUpdateDb = process.argv.includes('--update-db');
const forceRecompress = process.argv.includes('--force');

let totalScanned = 0;
let totalConverted = 0;
let totalRecompressed = 0;
let totalSkipped = 0;
let totalFailed = 0;

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

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let cleaned = url.trim();
  if (cleaned.startsWith('data:')) return cleaned;

  // 1. Strip absolute host/IP prefix
  if (cleaned.includes('/uploads/')) {
    cleaned = '/uploads/' + cleaned.split('/uploads/')[1];
  } else if (cleaned.includes('/wp-content/')) {
    cleaned = '/wp-content/' + cleaned.split('/wp-content/')[1];
  } else if (cleaned.includes('/images/')) {
    cleaned = '/images/' + cleaned.split('/images/')[1];
  }

  // 2. Convert extension to .webp
  if (/\.(jpg|jpeg|png)$/i.test(cleaned)) {
    cleaned = cleaned.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  return cleaned;
}

async function convertDir(dirPath) {
  const absoluteDir = path.resolve(rootDir, dirPath);
  if (!fsSync.existsSync(absoluteDir)) {
    console.log(`ℹ️  Directory not found (skipping): ${dirPath}`);
    return;
  }

  try {
    const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) {
        await convertDir(path.join(dirPath, entry.name));
      } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
        totalScanned++;
        const webpPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        if (!forceRecompress) {
          try {
            await fs.access(webpPath);
            totalSkipped++;
            continue;
          } catch {
            // .webp does not exist yet -> proceed with conversion
          }
        }

        try {
          const buffer = await fs.readFile(fullPath);
          const webpBuffer = await sharp(buffer)
            .rotate()
            .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
          await fs.writeFile(webpPath, webpBuffer);
          totalConverted++;
          const relWebp = path.relative(rootDir, webpPath).replace(/\\/g, '/');
          console.log(`✅ [Converted -> WebP] ${relWebp} (${Math.round(webpBuffer.length / 1024)} KB)`);
        } catch (err) {
          totalFailed++;
          console.warn(`⚠️  Failed converting ${entry.name}:`, err.message);
        }
      } else if (/\.webp$/i.test(entry.name)) {
        totalScanned++;
        // Check if existing webp is oversized (>350KB) or if --force was specified
        try {
          const stats = await fs.stat(fullPath);
          if (forceRecompress || stats.size > 350 * 1024) {
            const buffer = await fs.readFile(fullPath);
            const metadata = await sharp(buffer).metadata();
            if (
              forceRecompress ||
              (metadata.width && metadata.width > 1400) ||
              (metadata.height && metadata.height > 1400) ||
              stats.size > 350 * 1024
            ) {
              const optimized = await sharp(buffer)
                .rotate()
                .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 82, effort: 4 })
                .toBuffer();

              if (optimized.length < stats.size) {
                await fs.writeFile(fullPath, optimized);
                totalRecompressed++;
                const relWebp = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                console.log(`⚡ [Optimized WebP] ${relWebp} (${Math.round(stats.size / 1024)} KB -> ${Math.round(optimized.length / 1024)} KB)`);
              }
            }
          }
        } catch (err) {
          // ignore stat/sharp errors
        }
      }
    }
  } catch (err) {
    console.error(`❌ Error scanning directory ${dirPath}:`, err.message);
  }
}

async function updateMongoDbImagePaths() {
  await loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('\n⚠️  MONGODB_URI not configured in .env / .env.production. Skipping database path updates.');
    return;
  }

  console.log('\n🔄 Connecting to MongoDB to synchronize image paths to clean .webp...');
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // 1. Update Products
    const productsColl = db.collection('products');
    const productsWithLegacyImages = await productsColl.find({
      $or: [
        { image: { $regex: /(\.(jpg|jpeg|png)$|^http)/i } },
        { images: { $elemMatch: { $regex: /(\.(jpg|jpeg|png)$|^http)/i } } }
      ]
    }).toArray();

    let updatedProducts = 0;
    for (const prod of productsWithLegacyImages) {
      let modified = false;
      let newImage = prod.image;
      if (typeof newImage === 'string') {
        const cleaned = normalizeImageUrl(newImage);
        if (cleaned !== newImage) {
          newImage = cleaned;
          modified = true;
        }
      }

      let newImages = prod.images;
      if (Array.isArray(prod.images)) {
        newImages = prod.images.map((img) => {
          if (typeof img === 'string') {
            const cleaned = normalizeImageUrl(img);
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
    console.log(`✅ Synchronized ${updatedProducts} product(s) in MongoDB.`);

    // 2. Update Categories
    const categoriesColl = db.collection('categories');
    const categoriesWithLegacyImages = await categoriesColl.find({
      image: { $regex: /(\.(jpg|jpeg|png)$|^http)/i }
    }).toArray();

    let updatedCategories = 0;
    for (const cat of categoriesWithLegacyImages) {
      if (typeof cat.image === 'string') {
        const cleaned = normalizeImageUrl(cat.image);
        if (cleaned !== cat.image) {
          await categoriesColl.updateOne(
            { _id: cat._id },
            { $set: { image: cleaned, updatedAt: new Date() } }
          );
          updatedCategories++;
        }
      }
    }
    console.log(`✅ Synchronized ${updatedCategories} category(ies) in MongoDB.`);

    // 3. Update Banners
    const bannersColl = db.collection('banners');
    const bannersWithLegacyImages = await bannersColl.find({
      $or: [
        { image: { $regex: /(\.(jpg|jpeg|png)$|^http)/i } },
        { mobileImage: { $regex: /(\.(jpg|jpeg|png)$|^http)/i } }
      ]
    }).toArray();

    let updatedBanners = 0;
    for (const banner of bannersWithLegacyImages) {
      const updateDoc = {};
      if (typeof banner.image === 'string') {
        const cleaned = normalizeImageUrl(banner.image);
        if (cleaned !== banner.image) updateDoc.image = cleaned;
      }
      if (typeof banner.mobileImage === 'string') {
        const cleaned = normalizeImageUrl(banner.mobileImage);
        if (cleaned !== banner.mobileImage) updateDoc.mobileImage = cleaned;
      }
      if (Object.keys(updateDoc).length > 0) {
        updateDoc.updatedAt = new Date();
        await bannersColl.updateOne({ _id: banner._id }, { $set: updateDoc });
        updatedBanners++;
      }
    }
    console.log(`✅ Synchronized ${updatedBanners} banner(s) in MongoDB.`);

    // 4. Update Orders
    const ordersColl = db.collection('orders');
    const ordersWithLegacyImages = await ordersColl.find({
      'items.image': { $regex: /(\.(jpg|jpeg|png)$|^http)/i }
    }).toArray();

    let updatedOrders = 0;
    for (const order of ordersWithLegacyImages) {
      let modified = false;
      const newItems = (order.items || []).map((it) => {
        if (it && typeof it.image === 'string') {
          const cleaned = normalizeImageUrl(it.image);
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
    console.log(`✅ Synchronized ${updatedOrders} order(s) in MongoDB.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error during MongoDB image path update:', err.message);
  }
}

async function run() {
  console.log('=====================================================');
  console.log('🌸 The Indian Flowers: WebP Asset Optimizer');
  console.log('=====================================================\n');

  console.log('📁 1. Scanning public/uploads/...');
  await convertDir('public/uploads');

  console.log('\n📁 2. Scanning public/wp-content/uploads/...');
  await convertDir('public/wp-content/uploads');

  console.log('\n📁 3. Scanning public/images/...');
  await convertDir('public/images');

  console.log('\n-----------------------------------------------------');
  console.log(`📊 Summary of Disk Processing:`);
  console.log(`   Total Scanned     : ${totalScanned}`);
  console.log(`   Newly Converted   : ${totalConverted}`);
  console.log(`   WebP Recompressed : ${totalRecompressed}`);
  console.log(`   Already .webp     : ${totalSkipped}`);
  console.log(`   Failed            : ${totalFailed}`);
  console.log('-----------------------------------------------------');

  if (shouldUpdateDb) {
    await updateMongoDbImagePaths();
  } else {
    console.log('\n💡 Tip: To automatically update database image paths to .webp as well, run:');
    console.log('   node scripts/convert-local-images-to-webp.mjs --update-db');
  }

  console.log('\n✨ Finished successfully!\n');
}

run().catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
