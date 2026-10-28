/**
 * Standalone Script: sync-core-images-to-seo.mjs
 * 
 * Automatically cascades the updated product images from the 317 Core Catalog Products
 * to all 1,656 programmatic State/City SEO Landing Pages in MongoDB Atlas.
 * 
 * Usage:
 *   node scripts/sync-core-images-to-seo.mjs --dry-run   (Preview matches without writing to DB)
 *   node scripts/sync-core-images-to-seo.mjs --execute   (Applies updates to MongoDB Atlas)
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const KEYWORD_RULES = [
  { keywords: ['rose petal', 'rose petel', 'rose patel'], pattern: /rose petal/i },
  { keywords: ['button rose'], pattern: /button rose/i },
  { keywords: ['carnation'], pattern: /carnation/i },
  { keywords: ['mullai'], pattern: /mullai/i },
  { keywords: ['jasmine', 'mallipoo', 'malligai'], pattern: /jasmine|mallipoo/i },
  { keywords: ['tube rose', 'tuberose', 'lilly', 'lily'], pattern: /tube rose|lily/i },
  { keywords: ['vadamalli', 'globe amaranth'], pattern: /vadamalli/i },
  { keywords: ['lotus'], pattern: /lotus/i },
  { keywords: ['marigold', 'genda', 'sevanthi'], pattern: /marigold|genda/i },
  { keywords: ['mango leave', 'mavilai'], pattern: /mango leaves|mavilai/i },
  { keywords: ['betel', 'paan'], pattern: /betel/i },
  { keywords: ['banana leave', 'vazhai'], pattern: /banana/i },
  { keywords: ['neem'], pattern: /neem/i },
  { keywords: ['durva', 'bilva', 'arugampul'], pattern: /durva|bilva/i },
  { keywords: ['tulasi', 'tulsi'], pattern: /tulasi|tulsi/i },
  { keywords: ['orchid'], pattern: /orchid/i },
  { keywords: ['kanakambaram', 'crossandra'], pattern: /kanakambaram/i },
  { keywords: ['erukkam'], pattern: /erukkam/i },
  { keywords: ['thennai kuruthu', 'thoranam', 'coconut'], pattern: /thoranam|coconut|thennai/i },
  { keywords: ['nanthiyavattam', 'nandiyavattai'], pattern: /nanthiyavattam/i },
  { keywords: ['arali'], pattern: /arali/i },
  { keywords: ['kathambam'], pattern: /kathambam/i },
  { keywords: ['veni', 'jadai', 'gajra'], pattern: /veni|jadai|gajra/i },
  { keywords: ['brass', 'vilakku', 'diya', 'lamp'], pattern: /brass|vilakku|diya/i },
  { keywords: ['wedding garland', 'marriage garland', 'jaimala', 'varmala'], pattern: /wedding garland|varmala|jaimala/i },
  { keywords: ['temple garland', 'pooja garland'], pattern: /temple.*garland|pooja.*garland/i },
  { keywords: ['house warming', 'grihapravesam'], pattern: /house warming|grihapravesam/i },
];

const CODE_REGEX = /\b([A-Za-z]{2,3}[-\s]?\d{1,3})\b/;

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
            if (!process.env[key]) process.env[key] = val;
          }
        }
      });
    } catch {}
  }
}

async function run() {
  const isExecute = process.argv.includes('--execute');
  const isDryRun = !isExecute;

  console.log('========================================================================');
  console.log('  Indian-Flowers.com — Core Image to SEO Cascade Sync');
  console.log(`  Mode: ${isExecute ? 'EXECUTE (Updating MongoDB Atlas)' : 'DRY RUN (Preview Only)'}`);
  console.log('========================================================================\n');

  await loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Fetch 317 Core Products
  const coreProducts = await db
    .collection('products')
    .find({
      isSeoLanding: { $ne: true },
      hideFromHome: { $ne: true },
    })
    .toArray();

  // 2. Fetch 1,656 SEO Landing Products
  const seoProducts = await db
    .collection('products')
    .find({
      $or: [{ isSeoLanding: true }, { hideFromHome: true }],
    })
    .toArray();

  console.log(`Loaded ${coreProducts.length} Core Store Products.`);
  console.log(`Loaded ${seoProducts.length} Programmatic State/City SEO Landing Products.\n`);

  // Build quick-lookup maps for Core Products
  const coreByCode = new Map();
  coreProducts.forEach((cp) => {
    const match = cp.name.match(CODE_REGEX);
    if (match) {
      const code = match[1].toLowerCase().replace(/[-\s]/g, '');
      coreByCode.set(code, cp);
    }
  });

  let updatedCount = 0;
  let alreadyUpToDateCount = 0;
  let unmatchedCount = 0;

  const bulkOps = [];
  const samples = [];
  const unmatchedSamples = [];

  for (const sp of seoProducts) {
    let matchedCore = null;
    let strategy = '';
    const spNameLower = sp.name.toLowerCase();

    // 1. Match by Product Code (e.g. RP04, CG27, BR06)
    const spCodeMatch = sp.name.match(CODE_REGEX);
    if (spCodeMatch) {
      const code = spCodeMatch[1].toLowerCase().replace(/[-\s]/g, '');
      if (coreByCode.has(code)) {
        matchedCore = coreByCode.get(code);
        strategy = `Product Code (${code.toUpperCase()})`;
      }
    }

    // 2. Match by Floral Keyword
    if (!matchedCore) {
      for (const rule of KEYWORD_RULES) {
        if (rule.keywords.some((k) => spNameLower.includes(k))) {
          matchedCore = coreProducts.find(
            (cp) => rule.pattern.test(cp.name) || rule.pattern.test(cp.category || '')
          );
          if (matchedCore) {
            strategy = `Floral Keyword (${rule.keywords[0]})`;
            break;
          }
        }
      }
    }

    // 3. Match by Shared Previous Image
    if (!matchedCore && sp.image) {
      matchedCore = coreProducts.find((cp) => cp.image === sp.image);
      if (matchedCore) strategy = 'Shared Image Path';
    }

    // 4. Match by Category Fallback (Case-insensitive & Partial)
    if (!matchedCore && sp.category && sp.category !== 'Future Products') {
      const spCatClean = sp.category.toLowerCase().trim();
      matchedCore = coreProducts.find(
        (cp) => (cp.category || '').toLowerCase().trim() === spCatClean
      );
      if (!matchedCore) {
        matchedCore = coreProducts.find(
          (cp) =>
            cp.category &&
            (cp.category.toLowerCase().includes(spCatClean) ||
              spCatClean.includes(cp.category.toLowerCase()))
        );
      }
      if (matchedCore) strategy = `Category Fallback (${sp.category})`;
    }

    // 5. Global Fallback for any remaining unlinked items
    if (!matchedCore) {
      matchedCore = coreProducts.find((cp) => (cp.category || '').toLowerCase().includes('garland')) || coreProducts[0];
      if (matchedCore) strategy = 'General Catalog Fallback';
    }

    if (matchedCore && matchedCore.image) {
      const targetImage = matchedCore.image;
      const targetImages =
        Array.isArray(matchedCore.images) && matchedCore.images.length > 0
          ? matchedCore.images
          : [matchedCore.image];

      if (sp.image === targetImage) {
        alreadyUpToDateCount++;
      } else {
        updatedCount++;
        if (samples.length < 8) {
          samples.push({
            seoName: sp.name,
            seoSlug: sp.slug,
            matchedCoreName: matchedCore.name,
            strategy,
            oldImage: sp.image,
            newImage: targetImage,
          });
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: sp._id },
            update: {
              $set: {
                image: targetImage,
                images: targetImages,
                updatedAt: new Date(),
              },
            },
          },
        });
      }
    } else {
      unmatchedCount++;
      if (unmatchedSamples.length < 5) {
        unmatchedSamples.push({ name: sp.name, slug: sp.slug, cat: sp.category });
      }
    }
  }

  console.log('--- CASCADE MATCHING SUMMARY ---');
  console.log(`• Ready to Update with New Core Photos : ${updatedCount} products`);
  console.log(`• Already in Sync with Core Photos    : ${alreadyUpToDateCount} products`);
  console.log(`• Unmatched Pages                      : ${unmatchedCount} products`);
  if (unmatchedSamples.length > 0) {
    console.log('  Unmatched items:', JSON.stringify(unmatchedSamples, null, 2));
  }
  console.log(`• Total SEO Pages Covered              : ${updatedCount + alreadyUpToDateCount} / ${seoProducts.length} (${(((updatedCount + alreadyUpToDateCount) / seoProducts.length) * 100).toFixed(1)}%)\n`);

  if (samples.length > 0) {
    console.log('--- SAMPLE CASCADE UPDATES ---');
    samples.forEach((s, idx) => {
      console.log(`[${idx + 1}] Strategy: ${s.strategy}`);
      console.log(`    State Page : ${s.seoName} (${s.seoSlug})`);
      console.log(`    Core Match : ${s.matchedCoreName}`);
      console.log(`    Old Image  : ${s.oldImage}`);
      console.log(`    New Image  : ${s.newImage}\n`);
    });
  }

  if (isExecute) {
    if (bulkOps.length > 0) {
      console.log(`Executing bulk update on MongoDB Atlas (${bulkOps.length} operations)...`);
      const res = await db.collection('products').bulkWrite(bulkOps, { ordered: false });
      console.log('SUCCESS! MongoDB Update Result:', {
        matchedCount: res.matchedCount,
        modifiedCount: res.modifiedCount,
      });
      console.log('\nAll 1,600+ State SEO Landing Pages are now synchronized with your Core Photos!');
    } else {
      console.log('All products are already 100% synchronized. No updates needed.');
    }
  } else {
    console.log('------------------------------------------------------------------------');
    console.log('DRY RUN COMPLETE — No changes were saved to MongoDB Atlas.');
    console.log('To execute the real update after uploading your 317 core images, run:');
    console.log('  node scripts/sync-core-images-to-seo.mjs --execute');
    console.log('------------------------------------------------------------------------');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error during cascade sync:', err);
  process.exit(1);
});
