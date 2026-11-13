// Junta src/index.html + src/css/*.css + src/js/*.js (por ordem do nome) num único app/index.html.
// Gera também artifact/index.html: a mesma app para publicar como página na conta Claude (sem <html>/<head>/<body>,
// sem manifesto nem service worker, que essa página não usa).
import {readFileSync, writeFileSync, readdirSync, mkdirSync} from 'node:fs';
const u = p => new URL(p, import.meta.url);
const dir = d => readdirSync(u('./src/' + d)).filter(f => /\.(css|js)$/.test(f)).sort().map(f => readFileSync(u(`./src/${d}/${f}`), 'utf8').replace(/\n$/, '')).join('\n');
const tpl = readFileSync(u('./src/index.html'), 'utf8');
const html = tpl.replace('<!-- @CSS -->', () => dir('css')).replace('<!-- @JS -->', () => dir('js'));
writeFileSync(u('./app/index.html'), html);
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>')), body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
const art = '<meta name="claude:viewport-fit-sides" content="cover">\n' + head
  .replace(/<meta (charset|name="(viewport|theme-color|apple-mobile-web-app-[^"]*|mobile-web-app-capable)")[^>]*>\n?/g, '')
  .replace(/<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?/g, '')
  + '\n<style>body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:25;background:var(--surface)}</style>\n'
  + body.replace(/<script>if \('serviceWorker'[^\n]*<\/script>\n?/, '');
mkdirSync(u('./artifact/'), {recursive: true});
writeFileSync(u('./artifact/index.html'), art);
console.log('app/index.html e artifact/index.html construídos');
