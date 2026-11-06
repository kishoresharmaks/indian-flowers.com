import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = ((formData.get('folder') as string) || 'products').replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (!validTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid image type: ${file.type}. Allowed: JPG, PNG, WEBP, GIF, SVG.` },
        { status: 400 }
      );
    }

    // Limit individual image upload size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowable limit of 15MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseName = file.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]/g, '_');

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });

    let finalBuffer = buffer;
    let finalFilename: string;

    const isRasterImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());

    // Auto-compress and convert raster images to optimized WebP
    if (isRasterImage) {
      finalFilename = `${Date.now()}-${baseName}.webp`;
      try {
        const isMobileBanner = folder === 'banners' && (baseName.includes('mobile') || baseName.includes('750'));
        const maxWidth = isMobileBanner ? 750 : (folder === 'banners' ? 1400 : 1200);
        const maxHeight = isMobileBanner ? 950 : 1400;
        const quality = isMobileBanner ? 78 : 80;

        finalBuffer = await sharp(buffer)
          .rotate() // Auto-orient based on smartphone EXIF
          .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
          .webp({ quality, effort: 4 })
          .toBuffer();
      } catch (sharpErr) {
        console.warn('[Upload] Sharp compression fallback:', sharpErr);
        finalFilename = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_')}`;
        finalBuffer = buffer;
      }
    } else {
      // SVGs, GIFs, and other vector/animated assets
      finalFilename = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_')}`;
    }

    await writeFile(path.join(uploadDir, finalFilename), finalBuffer);

    const publicUrl = `/uploads/${folder}/${finalFilename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed.' },
      { status: 500 }
    );
  }
}
