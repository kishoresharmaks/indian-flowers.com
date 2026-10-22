const fs = require('fs');
const path = require('path');

// Clean previous build outputs but PRESERVE .next/cache for fast incremental builds
const dirsToClean = [
  path.resolve(__dirname, '../.next/server'),
  path.resolve(__dirname, '../.next/static'),
  path.resolve(__dirname, '../.next/standalone'),
];

dirsToClean.forEach((dir) => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup error if already removed
    }
  }
});
