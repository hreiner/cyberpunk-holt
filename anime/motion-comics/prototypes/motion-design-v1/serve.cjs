/* Closed local server for the isolated study; production reader remains untouched. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const core = require('../../core.js');
const { ROOT, inside } = require('../../project.cjs');
const { readDocument } = require('../../sequence.cjs');
const project = readDocument(path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-08-v4.json'));
const urlPath = file => '/' + path.relative(ROOT, file).split(path.sep).map(encodeURIComponent).join('/');
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan.json'), 'utf8'));
const pages = Object.fromEntries([5, 8].map(number => {
  const page = project.pages[number - 1];
  return [number, { data: core.rebaseAssets(page.data, relative => path.relative(__dirname,
    path.resolve(path.dirname(page.manifestFile), relative)).split(path.sep).join('/')) }];
}));
const staticFiles = ['index.html', 'study.js', 'motion.js', 'plan.json'].map(file => path.join(__dirname, file));
const runtime = ['layers.js', 'effects.js', 'assets/holt-display.woff2', 'assets/holt-text.woff2'].map(file => path.resolve(__dirname, '../..', file));
const allowed = new Set([...staticFiles, ...runtime, ...project.files]);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/motion-study.json') {
      response.writeHead(200, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? '' : JSON.stringify({ plan, pages })); return;
    }
    const file = path.resolve(ROOT, '.' + decodeURIComponent(pathname));
    if (!inside(ROOT, file) || !allowed.has(file)) { response.writeHead(403); response.end(); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(404); response.end(); }
}).listen(Number(process.argv[2] ?? 50920), '127.0.0.1', function () {
  console.info(`http://127.0.0.1:${this.address().port}${urlPath(path.join(__dirname, 'index.html'))}`);
});
