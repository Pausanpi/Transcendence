const fs = require('fs');
const path = require('path');

console.log('Copying static assets to dist/...');

// Files to copy
const files = ['index.html', 'styles.css', 'decode.html', 'default-avatar.png', 'icon.png'];

// Copy individual files
files.forEach(file => {
  try {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`✓ Copied ${file}`);
  } catch (err) {
    console.error(`✗ Failed to copy ${file}:`, err.message);
  }
});

// Copy avatars directory recursively
try {
  const destDir = path.join('dist', 'avatars');
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.cpSync('avatars', destDir, { recursive: true });
  console.log('✓ Copied avatars/');
} catch (err) {
  console.error('✗ Failed to copy avatars:', err.message);
}

console.log('Build complete!');
