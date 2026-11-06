const fs = require('fs');
const path = require('path');

// Preserve .next/cache for ultra-fast incremental server builds.
// Only delete .next if CLEAN_BUILD=1 is explicitly passed.
if (process.env.CLEAN_BUILD === '1') {
  const nextDir = path.resolve(__dirname, '../.next');
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('[prebuild] Cleaned .next directory for full cold build.');
    } catch (err) {
      // Ignore cleanup error if already removed
    }
  }
}

// Automatically optimize any oversized server-stored uploads during build
try {
  const { run: runImageOptimizer } = require('./optimize-server-images');
  runImageOptimizer()
    .then(() => {
      console.log('[prebuild] Server images check complete.');
    })
    .catch((err) => {
      console.warn('[prebuild] Non-fatal image optimizer warning:', err.message);
    });
} catch (err) {
  // Graceful fallback if sharp or optimizer is unavailable
}

