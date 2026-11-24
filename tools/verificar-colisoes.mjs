// Verifica conflitos de nomes entre os módulos de src/ (os erros que mais vezes partiram a app):
//  1. funções globais declaradas com const e depois reatribuídas noutro módulo ("Assignment to constant variable");
//  2. o mesmo valor de data-in tratado em mais do que um ficheiro;
//  3. a mesma classe CSS definida como regra de topo em mais do que um ficheiro (só aviso: pode ser intencional);
//  4. ações A['x'] definidas em mais do que um ficheiro (só aviso: substituir de propósito é permitido).
// Uso: node tools/verificar-colisoes.mjs   (sai com código 1 se houver erros dos tipos 1 ou 2)
import {readFileSync, readdirSync} from 'node:fs';
const dir = d => readdirSync(new URL(`../src/${d}/`, import.meta.url)).filter(f => /\.(js|css)$/.test(f)).sort().map(f => ({f, s:readFileSync(new URL(`../src/${d}/${f}`, import.meta.url), 'utf8')}));
const js = dir('js'), css = dir('css');
const erros = [], avisos = [];

// 1. const reatribuída
const consts = new Map();
js.forEach(({f, s}) => { for (const m of s.matchAll(/^const ([A-Za-z_$][\w$]*)\s*=/gm)) consts.set(m[1], f); });
js.forEach(({f, s}) => { for (const m of s.matchAll(/^([A-Za-z_$][\w$]*)\s*=\s*(?:function|\(|async)/gm)) if (consts.has(m[1])) erros.push(`${m[1]}: declarada com const em ${consts.get(m[1])} e reatribuída em ${f} (use function ou let na original)`); });

// 2. data-in tratado em mais de um sítio
const usados = new Set(); js.forEach(({s}) => { for (const m of s.matchAll(/data-in="([\w-]+)"/g)) usados.add(m[1]); });
for (const v of usados) {
  // conta só ficheiros que leem data-in (o "k" desses ficheiros é el.dataset.in); "r.k" ou "col.k" não contam
  const re = new RegExp(`(?:(?<![.\\w])k|dataset\\.in) === '${v}'`), fs = js.filter(({s}) => /dataset\.in|dataset && el\.dataset\.in/.test(s) && re.test(s)).map(x => x.f);
  if (fs.length > 1) erros.push(`data-in="${v}" é tratado em ${fs.join(', ')} (escolha um nome único)`);
}

// 3. classes CSS de topo repetidas em ficheiros diferentes
const cls = new Map();
css.forEach(({f, s}) => { for (const m of s.matchAll(/^\.([\w-]+)\s*[{,]/gm)) { const l = cls.get(m[1]) || new Set(); l.add(f); cls.set(m[1], l); } });
for (const [c, fs] of cls) if (fs.size > 1) avisos.push(`.${c} definida em ${[...fs].join(', ')}`);

// 4. ações repetidas
const acoes = new Map();
js.forEach(({f, s}) => { for (const m of s.matchAll(/^\s+'([a-z0-9-]+)':\s/gm)) { const l = acoes.get(m[1]) || []; l.push(f); acoes.set(m[1], l); } });
for (const [a, fs] of acoes) if (new Set(fs).size > 1) avisos.push(`ação '${a}' definida em ${[...new Set(fs)].join(', ')} (a última substitui as anteriores)`);

if (avisos.length) console.log('Avisos (podem ser intencionais):\n  ' + avisos.join('\n  '));
if (erros.length) { console.log('ERROS:\n  ' + erros.join('\n  ')); process.exit(1); }
console.log(`Sem conflitos de nomes (${js.length} módulos JS, ${css.length} ficheiros CSS).`);
