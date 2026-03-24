#!/bin/bash
# Simple build script - minifies JS and CSS for production
mkdir -p dist
cp index.html dist/
cp manifest.json dist/
cp sw.js dist/

# Minify JS files
for f in app.js db.js perf.js lofi.js sounds.js; do
  if [ -f "$f" ]; then
    npx terser "$f" --compress --mangle -o "dist/$f"
    echo "Minified $f: $(wc -c < "$f") → $(wc -c < "dist/$f") bytes"
  fi
done

# Minify CSS
npx terser --help > /dev/null 2>&1  # just checking terser works
cp style.css dist/style.css  # CSS minification needs csso
echo "Build complete → dist/"
