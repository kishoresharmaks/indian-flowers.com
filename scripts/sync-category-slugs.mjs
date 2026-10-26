/**
 * Category Slug & Subcategory Normalization Script
 * Reconciles categorySlug and subcategory references across all MongoDB product documents.
 * Ensures that parent categories (e.g. STRINGS & LEAVES) and their subcategories
 * have 100% reliable matching without missing products.
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch {
      // Continue to next env file
    }
  }
}

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  await loadEnv();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully.');

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');
  const categoriesCol = db.collection('categories');

  const categories = await categoriesCol.find({}).toArray();
  console.log(`Loaded ${categories.length} main categories from DB:`);
  categories.forEach((c) => {
    console.log(` - ${c.name} (${c.slug}) with ${c.subcategories?.length || 0} subcategories`);
  });

  // Build a lookup map of subcategories to parent category slugs
  const subcatToParentMap = new Map();
  categories.forEach((cat) => {
    const parentSlug = cat.slug || slugify(cat.name);
    if (cat.subcategories && Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach((sub) => {
        if (sub.slug) subcatToParentMap.set(sub.slug.toLowerCase(), { parentSlug, subName: sub.name });
        if (sub.name) subcatToParentMap.set(slugify(sub.name), { parentSlug, subName: sub.name });
      });
    }
  });

  // Manual known mappings from WooCommerce imported categorySlugs to parent + subcategory
  const manualMappings = {
    'jasmine-flower': { parentSlug: 'strings-and-leaves', subName: 'Strings / Jasmine Strings' },
    'green-leafs': { parentSlug: 'strings-and-leaves', subName: 'Pooja Leaves' },
    'green-leaf': { parentSlug: 'strings-and-leaves', subName: 'Pooja Leaves' },
    'pooja-leaves': { parentSlug: 'strings-and-leaves', subName: 'Pooja Leaves' },
    'pooja-flowers': { parentSlug: 'strings-and-leaves', subName: 'Pooja Flowers' },
    'pooja-flowers-pooja-flowers': { parentSlug: 'strings-and-leaves', subName: 'Pooja Flowers' },
    'banana-leaves': { parentSlug: 'strings-and-leaves', subName: 'Banana Leaves' },
    'coconut': { parentSlug: 'strings-and-leaves', subName: 'Coconut' },
    'decor-items': { parentSlug: 'strings-and-leaves', subName: 'Decor Items' },

    'wedding-garlands': { parentSlug: 'wedding-garlands', subName: 'Wedding Garlands' },
    'rose-petal-garlands': { parentSlug: 'wedding-garlands', subName: 'Rose Petal Garlands' },
    'button-rose-garlands': { parentSlug: 'wedding-garlands', subName: 'Button Rose Garlands' },
    'lilly-garlands': { parentSlug: 'wedding-garlands', subName: 'Lilly Garlands' },
    'tube-rose-garlands': { parentSlug: 'wedding-garlands', subName: 'Lilly Garlands' },
    'carnation-garlands': { parentSlug: 'wedding-garlands', subName: 'Carnation Garlands' },
    'exchange-garlands': { parentSlug: 'wedding-garlands', subName: 'Exchange Garlands' },
    'north-indian-garlands': { parentSlug: 'wedding-garlands', subName: 'North Indian Garlands' },
    'indian-wedding-garlands': { parentSlug: 'wedding-garlands', subName: 'Indian Wedding Garlands' },
    'indian-wedding-garlands-in-bay-area': { parentSlug: 'wedding-garlands', subName: 'Wedding Garlands' },
    'veni': { parentSlug: 'wedding-garlands', subName: 'Veni, Jadai' },

    'house-warming-garlands': { parentSlug: 'house-warming-garlands', subName: 'Door Garlands' },
    'button-rose-door-garlands': { parentSlug: 'house-warming-garlands', subName: 'Button Rose Door Garlands' },
    'coconut-thoranam': { parentSlug: 'house-warming-garlands', subName: 'Coconut Thoranam' },
    'mango-leaves-thoranam': { parentSlug: 'house-warming-garlands', subName: 'Mango Leaves Thoranam' },
    'button-rose-string': { parentSlug: 'house-warming-garlands', subName: 'Button Rose String' },

    'temple-and-pooja-garlands': { parentSlug: 'temple-garlands', subName: 'Temple and Pooja Garlands' },
    'temple-garlands': { parentSlug: 'temple-garlands', subName: 'Temple and Pooja Garlands' },
    'button-rose-pooja-garlands': { parentSlug: 'temple-garlands', subName: 'Button Rose Pooja Garlands' },
    'lilly-temple-garlands': { parentSlug: 'temple-garlands', subName: 'Lilly Garlands' },
    'nanthiyavattam-garlands': { parentSlug: 'temple-garlands', subName: 'Nanthiyavattam Garlands' },
    'vilvam-garlands': { parentSlug: 'temple-garlands', subName: 'Vilvam Garlands' },
    'vadamalli-garlands': { parentSlug: 'temple-garlands', subName: 'Vadamalli Garlands' },
  };

  Object.entries(manualMappings).forEach(([key, val]) => {
    subcatToParentMap.set(key, val);
  });

  // Reconcile products
  const cursor = productsCol.find({});
  let totalScanned = 0;
  let updatedCount = 0;

  const bulkOps = [];

  while (await cursor.hasNext()) {
    const prod = await cursor.next();
    totalScanned++;

    let needsUpdate = false;
    const updateFields = {};

    // 1. If category is "STRINGS & LEAVES" but categorySlug is missing or not 'strings-and-leaves'
    if (prod.category && prod.category.toUpperCase().includes('STRINGS')) {
      if (prod.categorySlug !== 'strings-and-leaves') {
        updateFields.categorySlug = 'strings-and-leaves';
        needsUpdate = true;
      }
    }

    // 2. If categorySlug is missing, generate it from category
    if (!prod.categorySlug && prod.category) {
      updateFields.categorySlug = slugify(prod.category);
      needsUpdate = true;
    }

    // 3. Check if current categorySlug or subcategory maps to a known parent category
    const currentSlug = updateFields.categorySlug || prod.categorySlug;
    if (currentSlug && subcatToParentMap.has(currentSlug)) {
      const mapping = subcatToParentMap.get(currentSlug);
      if (!prod.subcategory && mapping.subName) {
        updateFields.subcategory = mapping.subName;
        needsUpdate = true;
      }
      // If product has parentCategorySlug or belongs to parent
      if (prod.parentCategorySlug !== mapping.parentSlug) {
        updateFields.parentCategorySlug = mapping.parentSlug;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: prod._id },
          update: { $set: updateFields },
        },
      });
      updatedCount++;
    }

    if (bulkOps.length >= 500) {
      await productsCol.bulkWrite(bulkOps);
      bulkOps.length = 0;
      console.log(`Updated ${updatedCount} products so far...`);
    }
  }

  if (bulkOps.length > 0) {
    await productsCol.bulkWrite(bulkOps);
  }

  console.log(`\nReconciliation Complete!`);
  console.log(`Total Products Scanned: ${totalScanned}`);
  console.log(`Total Products Updated: ${updatedCount}`);

  // Create Compound Indexes
  console.log('\nCreating compound indexes in MongoDB Atlas...');
  await productsCol.createIndex({ categorySlug: 1, createdAt: -1, _id: -1 });
  await productsCol.createIndex({ categorySlug: 1, price: 1, _id: 1 });
  await productsCol.createIndex({ categorySlug: 1, price: -1, _id: -1 });
  await productsCol.createIndex({ categorySlug: 1, name: 1, _id: 1 });
  await productsCol.createIndex({ parentCategorySlug: 1, createdAt: -1, _id: -1 });
  await productsCol.createIndex({ parentCategorySlug: 1, subcategory: 1, createdAt: -1 });
  await productsCol.createIndex({ 'categories.slug': 1, createdAt: -1, _id: -1 });
  await productsCol.createIndex({ subcategory: 1, createdAt: -1, _id: -1 });
  console.log('Indexes created successfully.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
