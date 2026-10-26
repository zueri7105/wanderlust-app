/**
 * Post-build: fold the emitted JS + CSS into index.html as inline
 * <script>/<style> blocks, so the app is a single self-contained file.
 * The preview platform reliably serves index.html but drops linked
 * /assets/*.css requests on some clients — inlining removes that failure
 * mode entirely.
 *
 * Handles three layouts the bundler may produce:
 *   1. <link href="/assets/x.css"> + <script src="/assets/x.js">  (external files)
 *   2. JS inlined as data: URI by assetsInlineLimit
 *   3. CSS emitted directly as dist/style-*.css (no assets/ dir)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, '..');
const dist = path.join(appRoot, 'dist');
const htmlPath = path.join(dist, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('inline-build: dist/index.html not found at', dist);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// ── Locate the CSS ──
// Case 1: external link in the HTML.
let cssMatch = html.match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/);
let css = null;
let cssTag = null;
if (cssMatch) {
  cssTag = cssMatch[0];
  const cssPath = path.join(dist, cssMatch[1].replace(/^\//, ''));
  if (fs.existsSync(cssPath)) css = fs.readFileSync(cssPath, 'utf8');
}
// Case 2: emitted directly in dist/ (rolldown may skip assets/ for css).
if (!css) {
  const cssFile = fs.readdirSync(dist).find((f) => f.endsWith('.css'));
  if (cssFile) {
    css = fs.readFileSync(path.join(dist, cssFile), 'utf8');
    cssMatch = html.match(/<link rel="stylesheet"[^>]*>/);
    cssTag = cssMatch ? cssMatch[0] : null;
  }
}

// ── Locate the JS ──
// Case 1: external script src.
let jsMatch = html.match(/<script type="module"[^>]*src="([^"]+\.js)"[^>]*><\/script>/);
let js = null;
let jsTag = null;
if (jsMatch) {
  jsTag = jsMatch[0];
  const jsPath = path.join(dist, jsMatch[1].replace(/^\//, ''));
  if (fs.existsSync(jsPath)) js = fs.readFileSync(jsPath, 'utf8');
}
// Case 2: data-URI src.
if (!js) {
  jsMatch = html.match(/<script type="module"[^>]*src="data:[^"]*"[^>]*><\/script>/);
  if (jsMatch) {
    jsTag = jsMatch[0];
    const uri = jsMatch[0].match(/src="data:application\/javascript;base64,([^"]+)"/);
    if (uri) js = Buffer.from(uri[1], 'base64').toString('utf8');
  }
}

// ── Apply the inlines ──
if (css && cssTag) {
  html = html.replace(cssTag, () => `<style>\n${css}\n</style>`);
  console.log(`inline-build: inlined CSS (${(css.length / 1024).toFixed(1)} KB)`);
} else {
  console.warn('inline-build: could not locate CSS to inline');
}

if (js && jsTag) {
  html = html.replace(jsTag, () => `<script type="module">\n${js}\n</script>`);
  console.log(`inline-build: inlined JS (${(js.length / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.warn('inline-build: could not locate JS to inline');
}

fs.writeFileSync(htmlPath, html);
const { size } = fs.statSync(htmlPath);
console.log(`inline-build: index.html is now ${(size / 1024 / 1024).toFixed(2)} MB, self-contained`);
