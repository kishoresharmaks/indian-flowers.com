import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

function parseBase64(dataString: string) {
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

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let totalMigrated = 0;

    // 1. Products
    const productsColl = db.collection('products');
    const base64Products = await productsColl.find({ image: { $regex: /^data:image/ } }).toArray();
    const productsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await fs.mkdir(productsDir, { recursive: true });

    for (const prod of base64Products) {
      const parsed = parseBase64(prod.image);
      if (parsed) {
        const filename = `${prod._id}.${parsed.ext}`;
        await fs.writeFile(path.join(productsDir, filename), parsed.buffer);
        const cleanPath = `/uploads/products/${filename}`;
        await productsColl.updateOne({ _id: prod._id }, { $set: { image: cleanPath } });
        totalMigrated++;
      }
    }

    // 2. Categories
    const categoriesColl = db.collection('categories');
    const base64Categories = await categoriesColl.find({ image: { $regex: /^data:image/ } }).toArray();
    const categoriesDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
    await fs.mkdir(categoriesDir, { recursive: true });

    for (const cat of base64Categories) {
      const parsed = parseBase64(cat.image);
      if (parsed) {
        const filename = `${cat._id}.${parsed.ext}`;
        await fs.writeFile(path.join(categoriesDir, filename), parsed.buffer);
        const cleanPath = `/uploads/categories/${filename}`;
        await categoriesColl.updateOne({ _id: cat._id }, { $set: { image: cleanPath } });
        totalMigrated++;
      }
    }

    // 3. Banners
    const bannersColl = db.collection('banners');
    const base64Banners = await bannersColl.find({ image: { $regex: /^data:image/ } }).toArray();
    const bannersDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
    await fs.mkdir(bannersDir, { recursive: true });

    for (const b of base64Banners) {
      const parsed = parseBase64(b.image);
      if (parsed) {
        const filename = `${b._id}.${parsed.ext}`;
        await fs.writeFile(path.join(bannersDir, filename), parsed.buffer);
        const cleanPath = `/uploads/banners/${filename}`;
        await bannersColl.updateOne({ _id: b._id }, { $set: { image: cleanPath } });
        totalMigrated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned and migrated ${totalMigrated} Base64 images to pure disk paths.`,
      migratedCount: totalMigrated,
    });
  } catch (error: any) {
    console.error('Clean Base64 error:', error);
    return NextResponse.json({ error: error.message || 'Migration failed' }, { status: 500 });
  }
}
