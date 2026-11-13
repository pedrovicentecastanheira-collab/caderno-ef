// Junta src/index.html + src/css/*.css + src/js/*.js (por ordem do nome) num único app/index.html.
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
const dir = d => readdirSync(new URL('./src/' + d, import.meta.url)).filter(f => /\.(css|js)$/.test(f)).sort().map(f => readFileSync(new URL(`./src/${d}/${f}`, import.meta.url), 'utf8').replace(/\n$/, '')).join('\n');
const tpl = readFileSync(new URL('./src/index.html', import.meta.url), 'utf8');
writeFileSync(new URL('./app/index.html', import.meta.url), tpl.replace('<!-- @CSS -->', () => dir('css')).replace('<!-- @JS -->', () => dir('js')));
console.log('app/index.html construído');
