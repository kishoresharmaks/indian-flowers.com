const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Server-Side Image Optimizer
 * 
 * Automatically inspects and compresses oversized uploaded images on the VPS
 * to resolve Google PageSpeed Insights "Improve image delivery" findings.
 */
async function optimizeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const validExts = ['.webp', '.jpg', '.jpeg', '.png'];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await optimizeDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!validExts.includes(ext)) continue;

      // Safeguard official brand assets and logos from resizing
      if (entry.name.toLowerCase().includes('logo') || entry.name.toLowerCase().includes('brand')) {
        continue;
      }

      // Skip duplicate PNG/JPEG files if a corresponding WebP already exists
      if (ext !== '.webp') {
        const correspondingWebp = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
        if (fs.existsSync(correspondingWebp)) {
          continue;
        }
      }

      try {
        const stats = fs.statSync(fullPath);
        const isBannerDir = dirPath.includes('banners');
        const isCategoryDir = dirPath.includes('categories');
        const isMobile = entry.name.toLowerCase().includes('mobile') || entry.name.toLowerCase().includes('750');
        const minSizeThreshold = isCategoryDir ? 10 * 1024 : isBannerDir ? 15 * 1024 : 25 * 1024;
        if (stats.size < minSizeThreshold) continue;

        const buffer = fs.readFileSync(fullPath);
        const meta = await sharp(buffer).metadata();
        if (!meta.width || !meta.height) continue;

        const maxAllowedWidth = isMobile ? 750 : isCategoryDir ? 480 : isBannerDir ? 1400 : 800;
        const quality = isMobile ? 70 : isCategoryDir ? 68 : isBannerDir ? 72 : 75;

        // If dimensions or file size exceed recommended targets
        if (meta.width > maxAllowedWidth || stats.size > minSizeThreshold) {
          const targetWidth = Math.min(meta.width, maxAllowedWidth);

          let pipeline = sharp(buffer).rotate().resize({
            width: targetWidth,
            fit: 'inside',
            withoutEnlargement: true,
          });

          if (ext === '.webp') {
            pipeline = pipeline.webp({ quality, effort: 6 });
          } else if (ext === '.png') {
            pipeline = pipeline.webp({ quality, effort: 6 });
          } else {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
          }

          const optimizedBuffer = await pipeline.toBuffer();

          if (optimizedBuffer.length < stats.size) {
            const tempPath = `${fullPath}.tmp`;
            fs.writeFileSync(tempPath, optimizedBuffer);
            fs.renameSync(tempPath, fullPath);
            const savedKb = ((stats.size - optimizedBuffer.length) / 1024).toFixed(1);
            console.log(
              `[Image Optimizer] ${entry.name}: ${(stats.size / 1024).toFixed(1)} KB -> ${(
                optimizedBuffer.length / 1024
              ).toFixed(1)} KB (Saved ${savedKb} KB)`
            );
          }
        }
      } catch (err) {
        console.warn(`[Image Optimizer] Skipped ${entry.name}:`, err.message);
      }
    }
  }
}

async function run() {
  const uploadsDir = path.resolve(__dirname, '../public/uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('[Image Optimizer] Scanning server upload directories:', uploadsDir);
    await optimizeDirectory(uploadsDir);
  }
}

if (require.main === module) {
  run().then(() => {
    console.log('[Image Optimizer] Done.');
  });
}

module.exports = { optimizeDirectory, run };
