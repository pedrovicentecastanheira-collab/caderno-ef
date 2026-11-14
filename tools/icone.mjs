// Gera os ícones da app (app/icons) a partir do desenho em SVG: node tools/icone.mjs
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
// arte: caderno com competências assinaladas e uma bola; s = escala do conteúdo (1 normal, 0.78 para o ícone "maskable")
const arte = (s, rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
 <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B7BF0"/><stop offset=".55" stop-color="#1C55CF"/><stop offset="1" stop-color="#0F2F86"/></linearGradient>
 <radialGradient id="bola" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFB560"/><stop offset=".6" stop-color="#F7781F"/><stop offset="1" stop-color="#D2520C"/></radialGradient>
 <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#06163F" flood-opacity=".35"/></filter>
</defs>
<rect width="512" height="512" rx="${rx}" fill="url(#fundo)"/>
<g opacity=".10" fill="none" stroke="#fff" stroke-width="10"><circle cx="256" cy="256" r="150"/><path d="M0 256H512"/></g>
<g transform="translate(256 256) scale(${s}) translate(-256 -256)">
 <g filter="url(#sombra)" transform="rotate(-6 244 250)">
  <rect x="120" y="96" width="248" height="316" rx="30" fill="#fff"/>
  <rect x="120" y="96" width="44" height="316" rx="22" fill="#E3ECFD"/>
  ${[140, 196, 252, 308, 364].map(y => `<circle cx="142" cy="${y}" r="9" fill="#1C55CF"/>`).join('')}
  ${[[170, true], [236, true], [302, false]].map(([y, ok]) => `<rect x="188" y="${y - 20}" width="40" height="40" rx="10" fill="${ok ? '#18A86B' : '#fff'}" stroke="${ok ? '#18A86B' : '#B9CCF5'}" stroke-width="6"/>
  ${ok ? `<path d="M197 ${y} l9 9 l16 -18" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
  <rect x="244" y="${y - 9}" width="${ok ? 92 : 70}" height="18" rx="9" fill="${ok ? '#CFDDFB' : '#E3ECFD'}"/>`).join('')}
 </g>
 <g filter="url(#sombra)">
  <circle cx="356" cy="364" r="82" fill="url(#bola)"/>
  <g fill="none" stroke="#8C3305" stroke-width="7" stroke-linecap="round" opacity=".55">
   <path d="M356 282 V446"/><path d="M274 364 H438"/>
   <path d="M298 306 C330 336 330 392 298 422"/><path d="M414 306 C382 336 382 392 414 422"/>
  </g>
 </g>
</g></svg>`;
const b = await chromium.launch(), p = await b.newPage();
async function png(svg, size, file) {
  await p.setViewportSize({width:size, height:size});
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  writeFileSync(file, await p.screenshot({omitBackground:true, clip:{x:0, y:0, width:size, height:size}}));
}
const d = new URL('../app/icons/', import.meta.url).pathname;
await png(arte(1, 112), 512, d + 'icon-512-v2.png');
await png(arte(1, 112), 192, d + 'icon-192-v2.png');
await png(arte(.8, 0), 512, d + 'icon-maskable-512-v2.png');
await png(arte(.86, 0), 180, d + 'apple-touch-icon-v2.png');
writeFileSync(new URL('../src/icone.svg', import.meta.url), arte(1, 112));
await b.close(); console.log('ícones gerados');
