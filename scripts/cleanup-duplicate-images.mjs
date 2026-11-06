import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Safely removes legacy .png, .jpg, and .jpeg files from public/uploads
 * if an identical, optimized .webp version exists alongside it.
 */
function cleanDirectory(dir) {
  let count = 0;
  let bytesReclaimed = 0;

  if (!fs.existsSync(dir)) return { count, bytesReclaimed };

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const sub = cleanDirectory(fullPath);
      count += sub.count;
      bytesReclaimed += sub.bytesReclaimed;
    } else if (entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name)) {
      // Never delete critical brand assets or logos
      if (entry.name.toLowerCase().includes('logo') || entry.name.toLowerCase().includes('brand')) {
        continue;
      }

      const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');

      if (fs.existsSync(webpPath)) {
        try {
          const webpStats = fs.statSync(webpPath);
          const origStats = fs.statSync(fullPath);

          // Only delete if the webp file is valid and non-empty
          if (webpStats.size > 0) {
            fs.unlinkSync(fullPath);
            count++;
            bytesReclaimed += origStats.size;
            console.log(`🗑️ Removed duplicate: ${entry.name} (Freed ${(origStats.size / 1024).toFixed(1)} KB)`);
          }
        } catch (err) {
          console.warn(`⚠️ Skipped ${entry.name}: ${err.message}`);
        }
      }
    }
  }

  return { count, bytesReclaimed };
}

console.log('🔍 Scanning public/uploads for duplicate PNG/JPEG files with existing WebP...');
const uploadsDir = path.join(rootDir, 'public', 'uploads');
const result = cleanDirectory(uploadsDir);

console.log('====================================================');
console.log(`✅ Cleanup Complete: Deleted ${result.count} duplicate files.`);
console.log(`💾 Disk Space Reclaimed: ${(result.bytesReclaimed / (1024 * 1024)).toFixed(2)} MB`);
console.log('====================================================');
