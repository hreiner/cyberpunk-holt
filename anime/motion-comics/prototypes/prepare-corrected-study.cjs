/* Preserve the first motion study and make a corrected v2 on selected comic v5. */
const fs = require('node:fs');
const path = require('node:path');
const previous = path.join(__dirname, 'motion-design-v1'), target = path.join(__dirname, 'motion-design-v2');
fs.mkdirSync(target);
for (const name of ['motion.js', 'study.js']) fs.copyFileSync(path.join(previous, name), path.join(target, name), fs.constants.COPYFILE_EXCL);
for (const name of ['serve.cjs', 'review.cjs', 'index.html']) {
  let text = fs.readFileSync(path.join(previous, name), 'utf8').replaceAll('blue-purple-pages01-08-v4.json', 'blue-purple-pages01-08-v5.json').replaceAll('motion-design-v1', 'motion-design-v2');
  if (name === 'index.html') text = text.replace('Prototype séparé · sans audio', 'Étude corrigée · sans audio');
  if (name === 'serve.cjs') text = text.replace("const pathname = new URL(request.url, 'http://localhost').pathname;", "const pathname = new URL(request.url, 'http://localhost').pathname;\n    if (pathname.startsWith('/anime/motion-comics/prototypes/motion-design-v1/')) {\n      response.writeHead(307, { Location: pathname.replace('motion-design-v1', 'motion-design-v2'), 'Cache-Control': 'no-store' }); response.end(); return;\n    }");
  fs.writeFileSync(path.join(target, name), text, { flag: 'wx' });
}
const plan = JSON.parse(fs.readFileSync(path.join(previous, 'plan.json'), 'utf8'));
plan.version = 2; plan.correction = 'John recoil arm corrected from selected comic v5; study motion and anchors unchanged.';
fs.writeFileSync(path.join(target, 'plan.json'), JSON.stringify(plan, null, 2), { flag: 'wx' });
console.info(target);
