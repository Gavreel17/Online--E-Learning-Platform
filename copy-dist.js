const fs = require('fs');
const path = require('path');

// List of potential source locations where Vite creates the build
const candidates = [
  path.resolve(__dirname, 'Online-E-Learning-Platform/artifacts/online-learning-platform/dist/public'),
  path.resolve(__dirname, 'artifacts/online-learning-platform/dist/public'),
  path.resolve(__dirname, '../artifacts/online-learning-platform/dist/public'),
  path.resolve(process.cwd(), 'Online-E-Learning-Platform/artifacts/online-learning-platform/dist/public'),
  path.resolve(process.cwd(), 'artifacts/online-learning-platform/dist/public'),
  path.resolve(__dirname, 'dist/public'),
  path.resolve(process.cwd(), 'dist/public'),
];

let srcDir = null;
for (const cand of candidates) {
  if (fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))) {
    srcDir = cand;
    break;
  }
}

if (!srcDir) {
  console.log('[copy-dist] No build output index.html found in source paths.');
  process.exit(0);
}

console.log('[copy-dist] Found built files in:', srcDir);

// Destinations where hosting platforms (Render, Vercel, Netlify) might expect the publish directory
const targetDirs = [
  path.resolve(__dirname, 'artifacts/online-learning-platform/dist/public'),
  path.resolve(__dirname, 'Online-E-Learning-Platform/artifacts/online-learning-platform/dist/public'),
  path.resolve(process.cwd(), 'artifacts/online-learning-platform/dist/public'),
  path.resolve(process.cwd(), 'Online-E-Learning-Platform/artifacts/online-learning-platform/dist/public'),
  path.resolve(__dirname, 'dist/public'),
  path.resolve(process.cwd(), 'dist/public'),
];

const uniqueTargets = Array.from(new Set(targetDirs.map(t => path.resolve(t))));

for (const target of uniqueTargets) {
  if (target !== path.resolve(srcDir)) {
    try {
      fs.mkdirSync(target, { recursive: true });
      fs.cpSync(srcDir, target, { recursive: true });
      console.log('[copy-dist] Successfully copied build output to:', target);
    } catch (err) {
      console.warn('[copy-dist] Note: Failed copying to', target, err.message);
    }
  }
}
