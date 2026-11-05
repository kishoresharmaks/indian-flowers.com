/**
 * Standalone Script: convert-local-images-to-webp.mjs
 * 
 * Scans local image directories on disk (public/uploads, public/images, public/wp-content/uploads),
 * converts all .jpg, .jpeg, and .png images to highly optimized .webp format using Sharp,
 * and optionally updates MongoDB Product, Category, and Banner records to use .webp URLs.
 * 
 * Usage:
 *   node scripts/convert-local-images-to-webp.mjs              (Converts disk images to .webp)
 *   node scripts/convert-local-images-to-webp.mjs --update-db  (Converts disk images AND updates MongoDB)
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

let totalScanned = 0;
let totalConverted = 0;
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
        
        try {
          await fs.access(webpPath);
          totalSkipped++;
          continue;
        } catch {
          // .webp doesn't exist yet -> proceed with conversion
        }

        try {
          const buffer = await fs.readFile(fullPath);
          const webpBuffer = await sharp(buffer)
            .webp({ quality: 85, effort: 4 })
            .toBuffer();
          await fs.writeFile(webpPath, webpBuffer);
          totalConverted++;
          const relWebp = path.relative(rootDir, webpPath).replace(/\\/g, '/');
          console.log(`✅ [Converted] ${relWebp} (${Math.round(webpBuffer.length / 1024)} KB)`);
        } catch (err) {
          totalFailed++;
          console.warn(`⚠️  Failed converting ${entry.name}:`, err.message);
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

  console.log('\n🔄 Connecting to MongoDB to update image paths to .webp...');
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // 1. Update Products
    const productsColl = db.collection('products');
    const productsWithLegacyImages = await productsColl.find({
      $or: [
        { image: /\.(jpg|jpeg|png)$/i },
        { images: { $elemMatch: { $regex: /\.(jpg|jpeg|png)$/i } } }
      ]
    }).toArray();

    let updatedProducts = 0;
    for (const prod of productsWithLegacyImages) {
      let modified = false;
      let newImage = prod.image;
      if (typeof newImage === 'string' && /\.(jpg|jpeg|png)$/i.test(newImage)) {
        newImage = newImage.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        modified = true;
      }

      let newImages = prod.images;
      if (Array.isArray(prod.images)) {
        newImages = prod.images.map((img) =>
          typeof img === 'string' && /\.(jpg|jpeg|png)$/i.test(img)
            ? img.replace(/\.(jpg|jpeg|png)$/i, '.webp')
            : img
        );
        modified = true;
      }

      if (modified) {
        await productsColl.updateOne(
          { _id: prod._id },
          { $set: { image: newImage, images: newImages, updatedAt: new Date() } }
        );
        updatedProducts++;
      }
    }
    console.log(`✅ Synchronized ${updatedProducts} product(s) in MongoDB to .webp.`);

    // 2. Update Categories
    const categoriesColl = db.collection('categories');
    const categoriesWithLegacyImages = await categoriesColl.find({
      image: /\.(jpg|jpeg|png)$/i
    }).toArray();

    let updatedCategories = 0;
    for (const cat of categoriesWithLegacyImages) {
      if (typeof cat.image === 'string' && /\.(jpg|jpeg|png)$/i.test(cat.image)) {
        const newCatImage = cat.image.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        await categoriesColl.updateOne(
          { _id: cat._id },
          { $set: { image: newCatImage, updatedAt: new Date() } }
        );
        updatedCategories++;
      }
    }
    console.log(`✅ Synchronized ${updatedCategories} category(ies) in MongoDB to .webp.`);

    // 3. Update Banners
    const bannersColl = db.collection('banners');
    const bannersWithLegacyImages = await bannersColl.find({
      $or: [
        { image: /\.(jpg|jpeg|png)$/i },
        { mobileImage: /\.(jpg|jpeg|png)$/i }
      ]
    }).toArray();

    let updatedBanners = 0;
    for (const banner of bannersWithLegacyImages) {
      const updateDoc = {};
      if (typeof banner.image === 'string' && /\.(jpg|jpeg|png)$/i.test(banner.image)) {
        updateDoc.image = banner.image.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }
      if (typeof banner.mobileImage === 'string' && /\.(jpg|jpeg|png)$/i.test(banner.mobileImage)) {
        updateDoc.mobileImage = banner.mobileImage.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }
      if (Object.keys(updateDoc).length > 0) {
        updateDoc.updatedAt = new Date();
        await bannersColl.updateOne({ _id: banner._id }, { $set: updateDoc });
        updatedBanners++;
      }
    }
    console.log(`✅ Synchronized ${updatedBanners} banner(s) in MongoDB to .webp.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error during MongoDB image path update:', err.message);
  }
}

async function run() {
  console.log('=====================================================');
  console.log('🌸 The Indian Flowers: WebP Asset Converter');
  console.log('=====================================================\n');

  console.log('📁 1. Scanning public/uploads/...');
  await convertDir('public/uploads');

  console.log('\n📁 2. Scanning public/wp-content/uploads/...');
  await convertDir('public/wp-content/uploads');

  console.log('\n📁 3. Scanning public/images/...');
  await convertDir('public/images');

  console.log('\n-----------------------------------------------------');
  console.log(`📊 Summary of Disk Processing:`);
  console.log(`   Total Scanned   : ${totalScanned}`);
  console.log(`   Newly Converted : ${totalConverted}`);
  console.log(`   Already .webp   : ${totalSkipped}`);
  console.log(`   Failed          : ${totalFailed}`);
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
