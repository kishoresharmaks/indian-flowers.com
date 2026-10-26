/**
 * Standalone Headless CLI Importer for WordPress / WooCommerce
 * Usage: node scripts/import-woocommerce.mjs [--start-page=1] [--max-pages=20] [--per-page=100] [--no-images]
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const WP_API_BASE = 'https://indian-flowers.com/wp-json/wc/store/v1';

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

async function downloadMediaLocally(url) {
  try {
    const urlObj = new URL(url);
    const relativePath = urlObj.pathname;
    if (!relativePath.startsWith('/wp-content/uploads/')) return url;

    const localFilePath = path.join(__dirname, '..', 'public', relativePath.replace(/^\//, ''));
    const dir = path.dirname(localFilePath);

    try {
      await fs.access(localFilePath);
      return relativePath; // Already downloaded
    } catch {}

    await fs.mkdir(dir, { recursive: true });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Antigravity-CLI-Importer/1.0' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(localFilePath, buffer);
      return relativePath;
    }
    return relativePath;
  } catch (err) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
}

function stripHtmlTags(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#036;/g, '$')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  await loadEnv();
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  let startPage = 1;
  let maxPages = 20;
  let perPage = 100;
  let downloadImages = true;

  args.forEach((arg) => {
    if (arg.startsWith('--start-page=')) startPage = parseInt(arg.split('=')[1], 10);
    if (arg.startsWith('--max-pages=')) maxPages = parseInt(arg.split('=')[1], 10);
    if (arg.startsWith('--per-page=')) perPage = parseInt(arg.split('=')[1], 10);
    if (arg === '--no-images') downloadImages = false;
  });

  console.log(`🌿 Connecting to MongoDB Atlas...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB.`);

  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const categoriesColl = db.collection('categories');

  console.log(`🚀 Starting import from WooCommerce: startPage=${startPage}, maxPages=${maxPages}, perPage=${perPage}`);

  let totalImported = 0;
  let totalCreated = 0;
  let totalUpdated = 0;

  for (let page = startPage; page <= maxPages; page++) {
    console.log(`\n⏳ Fetching Page ${page} of ${maxPages}...`);
    try {
      const res = await fetch(`${WP_API_BASE}/products?per_page=${perPage}&page=${page}`, {
        headers: { 'User-Agent': 'Antigravity-CLI-Importer/1.0' },
      });

      if (!res.ok) {
        console.error(`  ❌ HTTP ${res.status}: ${res.statusText}`);
        break;
      }

      const totalWp = res.headers.get('x-wp-total');
      const totalWpPages = res.headers.get('x-wp-totalpages');
      const items = await res.json();

      if (!Array.isArray(items) || items.length === 0) {
        console.log(`  End of products reached.`);
        break;
      }

      console.log(`  Fetched ${items.length} items (Total WP items: ${totalWp}, Total WP pages: ${totalWpPages})`);

      for (const item of items) {
        const wpId = item.id;
        const name = (item.name || '').trim();
        const slug = (item.slug || '').toLowerCase().trim();
        if (!name || !slug) continue;

        const priceNum = Number(item.prices?.price || 0) / 100;
        const mrpNum = Number(item.prices?.regular_price || item.prices?.price || 0) / 100;
        const discount = mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

        let mainImagePath = '/images/banners/hero-wedding-1920x650.jpg';
        const imageGalleryPaths = [];

        if (Array.isArray(item.images) && item.images.length > 0) {
          for (let i = 0; i < item.images.length; i++) {
            const src = item.images[i]?.src;
            if (src) {
              const processed = downloadImages
                ? await downloadMediaLocally(src)
                : new URL(src).pathname;
              if (i === 0) mainImagePath = processed;
              imageGalleryPaths.push(processed);
            }
          }
        }

        const categoriesList = Array.isArray(item.categories)
          ? item.categories.map((c) => ({
              id: c.id,
              name: c.name,
              slug: (c.slug || '').toLowerCase().trim(),
            }))
          : [];

        const primaryCat = categoriesList[0]?.name || 'Fresh Indian Flowers';
        const primaryCatSlug = categoriesList[0]?.slug || 'fresh-indian-flowers';

        if (categoriesList.length > 0) {
          await categoriesColl.updateOne(
            { slug: primaryCatSlug },
            {
              $setOnInsert: {
                name: primaryCat,
                slug: primaryCatSlug,
                image: mainImagePath,
                order: 0,
                subcategories: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
        }

        const tags = Array.isArray(item.tags) ? item.tags.map((t) => t.name) : [];

        const attributes = Array.isArray(item.attributes)
          ? item.attributes.map((a) => ({
              name: a.name,
              terms: Array.isArray(a.terms) ? a.terms.map((t) => t.name) : [],
            }))
          : [];

        const variants = [];
        if (Array.isArray(item.attributes)) {
          const sizeAttr = item.attributes.find((a) =>
            a.name?.toLowerCase().includes('size') || a.name?.toLowerCase().includes('length')
          );
          if (sizeAttr && Array.isArray(sizeAttr.terms)) {
            sizeAttr.terms.forEach((t) => {
              let vPrice = priceNum;
              const match = t.name.match(/\+\$(\d+(\.\d+)?)/);
              if (match) vPrice += parseFloat(match[1]);
              variants.push({
                name: t.name,
                mrp: vPrice,
                price: vPrice,
                quantity: 10,
                discount: 0,
              });
            });
          }
        }

        const rawDescription = item.description || item.short_description || name;
        const plainSummary = stripHtmlTags(item.short_description || item.description || name).slice(0, 260);

        const updateDoc = {
          $set: {
            name,
            slug,
            wpId,
            description: rawDescription,
            descriptionHtml: rawDescription,
            shortDescription: plainSummary,
            image: mainImagePath,
            images: imageGalleryPaths,
            price: priceNum,
            mrp: mrpNum,
            discount,
            quantity: item.is_in_stock ? 15 : 0,
            isTaxable: true,
            category: primaryCat,
            categorySlug: primaryCatSlug,
            categories: categoriesList,
            tags,
            variants,
            attributes,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        };

        const result = await productsColl.updateOne(
          { $or: [{ wpId }, { slug }] },
          updateDoc,
          { upsert: true }
        );

        if (result.upsertedCount > 0) totalCreated++;
        else totalUpdated++;

        totalImported++;
      }

      console.log(`  Page ${page} finished (+${totalCreated} created, ${totalUpdated} updated)`);
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error(`  ❌ Error processing page ${page}:`, err.message);
    }
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`   Total Processed: ${totalImported}`);
  console.log(`   New Products Created: ${totalCreated}`);
  console.log(`   Existing Products Updated: ${totalUpdated}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
