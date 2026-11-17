/* ---------- melhorias visuais ---------- */
// 1) modo pavilhão; 2) mapa de calor das competências; 3) linha do tempo do aluno; 4) progresso das unidades;
// 5) distintivos no passaporte; 6) relatório do aluno visual; 7) QR nos cartões; 8) ícones por matéria;
// 9) Início personalizável; 10) animações discretas; 11) modo apresentação (projetar).

/* 1. modo pavilhão: contraste alto, letra e botões grandes, para usar ao sol e com pressa */
const _applyLook = applyLook;
applyLook = function () { _applyLook(); document.body.classList.toggle('pav', !!UI.pav); if (UI.pav) document.documentElement.dataset.contrast = 'high'; };
const _vAparencia = vAparencia;
vAparencia = function () {
  return `<div class="sec-h"><h2>Modo pavilhão</h2></div><div class="card form"><label class="cli"><input type="checkbox" data-in="pav"${UI.pav ? ' checked' : ''}> <span><b>Ativar o modo pavilhão</b><br><span class="hint">Contraste alto, letra maior e botões grandes, para usar ao sol, com luvas ou com pressa. Também se liga no modo aula.</span></span></label></div>` + _vAparencia();
};
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'pav') { UI.pav = el.checked; render(); } });

/* 8. ícones por matéria (traço simples, cor do subdomínio) */
const MATI = {
  'Voleibol':'<circle cx="12" cy="12" r="9"/><path d="M12 3c-1 4 0 8 4 10M3.5 9c4 0 7.5 1.5 8.5 3M7 19.5c1-4 3-6 5-7.5M20.5 10c-3 2-5.5 3-8.5 2"/>',
  'Basquetebol':'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>',
  'Andebol':'<circle cx="12" cy="12" r="9"/><path d="M12 3l3 5-3 4-3-4zM12 12l4 3-1 5M12 12l-4 3 1 5M15 8l5 1M9 8l-5 1"/>',
  'Futebol':'<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5zM12 7.5V3.5M16 10.5l4-1.5M14.5 15l2.5 3.5M9.5 15L7 18.5M8 10.5 4 9"/>',
  'Ginástica de Solo':'<circle cx="7" cy="6" r="2"/><path d="M7 8.5 11 13l5-2 4 3M11 13l-2 6M3 20h18"/>',
  'Ginástica de Aparelhos (Trampolins)':'<circle cx="12" cy="4.5" r="2"/><path d="M12 7v5l-3 3M12 12l3 3M4 19c3-2 13-2 16 0M6 19l-1 2M18 19l1 2"/>',
  'Ginástica Acrobática':'<circle cx="12" cy="3.5" r="1.8"/><circle cx="12" cy="11" r="1.8"/><path d="M9 6.5h6M12 5.5v3M12 13v4l-3 4M12 17l3 4M8 14h8"/>',
  'Ginástica Rítmica':'<circle cx="9" cy="5" r="2"/><path d="M9 7.5V13l-3 7M9 13l3 6M9 9l5-2M14 7c4 1 6 5 3 8s-7 3-6 6"/>',
  'Atletismo':'<circle cx="15" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M7 11l3-3 4 1 2 4h3M11 15l-1-4"/>',
  'Badminton':'<path d="M14 10l6-6M20 4l-2 6-6 2 2-6z"/><circle cx="7" cy="17" r="3"/><path d="M9 15l3-3"/>',
  'Ténis de Mesa':'<circle cx="9" cy="9" r="6"/><path d="M13.5 13.5 20 20"/><circle cx="18" cy="6" r="1.6"/>',
  'Natação':'<circle cx="16" cy="6" r="2"/><path d="M4 12l5-3 4 2 3-2M2 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M2 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
  'Orientação':'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
  'Luta':'<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M7 7.5v5l-2 7M17 7.5v5l2 7M7 10h10M7 12.5l5 3 5-3"/>',
  'Judo':'<path d="M6 4l6 4 6-4M6 4v16h12V4M12 8v12"/><path d="M6 13h12M10 13l-2 6M14 13l2 6"/>',
  'Softbol':'<circle cx="17" cy="7" r="3"/><path d="M3 21 13 11M11 13l2 2"/>', 'Beisebol':'<circle cx="17" cy="7" r="3"/><path d="M3 21 13 11M11 13l2 2"/>',
  'Corfebol':'<path d="M12 21V8M8 4h8l-1 4H9z"/><circle cx="18" cy="15" r="2.5"/>',
  'Ultimate Frisbee':'<ellipse cx="12" cy="12" rx="9" ry="4"/><path d="M5 11c3 1.5 11 1.5 14 0"/>',
  'Rugby T1':'<ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-35 12 12)"/><path d="M9 15l6-6M10 11l3 3M12 9l3 3"/>',
  'Hóquei em Campo':'<path d="M7 3l4 14c.5 2 3 3 5 2l2-1"/><circle cx="17" cy="20.5" r="1.4"/>', 'Hóquei em Patins':'<path d="M7 3l4 14c.5 2 3 3 5 2l2-1"/><circle cx="17" cy="20.5" r="1.4"/>',
  'Dança':'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  'Danças Sociais':'<circle cx="8" cy="4.5" r="2"/><circle cx="16" cy="4.5" r="2"/><path d="M8 7v6l-2 7M16 7v6l2 7M8 10h8"/>',
  'Danças Tradicionais':'<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M7 10l5-2 5 2M12 13l-5 7h10z"/>',
  'Patinagem':'<path d="M5 15h11a3 3 0 0 0 3-3V5h-5v4H8a3 3 0 0 0-3 3z"/><circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/>'
};
['Futsal'].forEach(m => MATI[m] = MATI['Futebol']); ['Patinagem Artística', 'Corrida de Patins'].forEach(m => MATI[m] = MATI['Patinagem']); ['Karaté', 'Jogo do Pau Português'].forEach(m => MATI[m] = MATI['Luta']);
const _subIcon = subIcon;
subIcon = function (m, ano) { const p = MATI[m]; if (!p) return _subIcon(m, ano); const s = subOf(m, ano || 7, true);
  return `<svg class="si" style="color:var(--v${SUBC[s] || 7})" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><title>${esc(m)}</title>${p}</svg>`; };

/* 2. mapa de calor: alunos × competências da matéria */
GICO.mapa = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" opacity=".35"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>';
const _gToolbar = gToolbar;
gToolbar = function (doms) { return _gToolbar(doms).replace(`<button data-a="g-lay" data-k="dominio"`, `<button data-a="g-lay" data-k="mapa" class="${gLayout() === 'mapa' ? 'on' : ''}" title="Mapa" aria-label="Mapa">${GICO.mapa}<span>Mapa</span></button><button data-a="g-lay" data-k="dominio"`); };
function estadoComp(v, aid, m, c) { if ((tksOf(v, aid, m) || {})[c.id]) return 'dom'; return evState(evMap(v, aid, m)[c.id]); }
function vMapa(c, als) {
  const t = c.t, v = c.v, ms = matsOf(t, c.p).filter(m => compsOf(t.ciclo, m).length);
  if (!ms.length) return `<div class="card empty"><h3>Sem matérias com competências</h3><p>Junte matérias ao período para ver o mapa.</p></div>`;
  if (!ms.includes(UI.mapaM)) UI.mapaM = ms[0]; const m = UI.mapaM, cs = compsOf(t.ciclo, m).filter(contaNivel);
  const grupos = ['I', 'E', 'A'].map(k => ({k, xs:cs.filter(x => x.k === k)})).filter(g => g.xs.length), lista = als.filter(al => (REG[regAt(al, c.p)] || REG.Normal).af > 0);
  const pct = x => { const n = lista.filter(al => estadoComp(v, al.id, m, x) === 'dom').length; return lista.length ? Math.round(n / lista.length * 100) : 0; };
  return `<div class="chips">${ms.map(x => `<button class="chip ${x === m ? 'on' : ''}" data-a="mapa-m" data-m="${esc(x)}">${subIcon(x, anoOf(t))}${esc(x)}</button>`).join('')}</div>
    <div class="legend"><span><i class="sw" style="background:var(--ok)"></i>domina</span><span><i class="sw" style="background:var(--warn)"></i>em progresso</span><span><i class="sw" style="background:var(--bad)"></i>ainda não</span><span><i class="sw" style="background:var(--surface-2);border:1px solid var(--line)"></i>sem registo</span></div>
    <div class="tbl-wrap mapa-w"><table class="mapa"><thead><tr><th class="l">Aluno</th>${grupos.map(g => `<th colspan="${g.xs.length}" class="mg">${LVN[g.k]}</th>`).join('')}</tr>
      <tr><th class="l"></th>${grupos.flatMap(g => g.xs).map(x => `<th class="mc" title="${esc(x.id + ' · ' + x.txt)}">${esc(x.n)}</th>`).join('')}</tr></thead><tbody>
      ${lista.map(al => { const l = (lvOf(v, al.id, m) || {}).l; return `<tr><td class="l"><button class="link" data-a="mapa-al" data-id="${esc(al.id)}">${esc(nome2(al.nome))}</button>${l ? ` <span class="lvpill ${GLV[l]}">${l}</span>` : ''}</td>${grupos.flatMap(g => g.xs).map(x => { const s = estadoComp(v, al.id, m, x); return `<td class="hm ${s ? 's-' + s : ''}" data-a="mapa-al" data-id="${esc(al.id)}" title="${esc(nome2(al.nome) + ' · ' + x.id + ': ' + (s ? EVN[s] : 'sem registo'))}"></td>`; }).join('')}</tr>`; }).join('')}
      <tr class="hm-tot"><td class="l small">Turma domina</td>${grupos.flatMap(g => g.xs).map(x => { const p = pct(x); return `<td class="small num-t" style="--p:${p}%">${p}</td>`; }).join('')}</tr></tbody></table></div>
    <p class="hint">Toque num aluno ou numa célula para abrir as competências desse aluno. As colunas mais vermelhas são as que a turma precisa de trabalhar.</p>`;
}
const _vGrelha = vGrelha;
vGrelha = function (t) { if (gLayout() !== 'mapa') return _vGrelha(t); const c = gCtx(t); return gToolbar(!FOCUS) + vMapa(c, gOrder(c, gCols(t, c.v), alunosOf(t))); };

/* 4. progresso de cada unidade: aulas dadas e domínio das competências do nível da turma */
function dominioUD(t, p, m) {
  const v = avalOf(t.id, p), nv = nivelTurma(t, m), cs = compsOf(t.ciclo, m).filter(c => c.k === nv && contaNivel(c)), als = alunosOf(t).filter(al => (REG[regAt(al, p)] || REG.Normal).af > 0);
  if (!cs.length || !als.length) return null; let n = 0; als.forEach(al => cs.forEach(c => { if (estadoComp(v, al.id, m, c) === 'dom') n++; }));
  return {pct:Math.round(n / (cs.length * als.length) * 100), nv};
}
const _vPlano = vPlano;
vPlano = function (t) {
  let h = _vPlano(t);
  planOf(t, UI.p).forEach(u => { const d = dominioUD(t, UI.p, u.m); if (!d) return;
    h = h.replace(new RegExp('(<span class="pl-n">[^]*?' + esc(u.m).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')'), `$1<span class="pl-dom" title="${d.pct}% das competências do nível ${esc(LVN[d.nv])} dominadas"><i style="width:${d.pct}%"></i><em>${d.pct}%</em></span>`); });
  return h;
};

/* 5. distintivos no passaporte */
function selo(k, ok) { const cor = {I:'#C27C3A', E:'#8E9AAB', A:'#D4A017'}[k];
  return `<svg class="selo${ok ? ' ok' : ''}" viewBox="0 0 48 56" aria-label="${LVN[k]}${ok ? ': conseguido' : ''}"><path d="M14 34 8 54l8-4 6 6 4-18M34 34l6 20-8-4-6 6-4-18" fill="${ok ? cor : 'none'}" stroke="${ok ? cor : 'currentColor'}" stroke-width="2" opacity="${ok ? .85 : .35}"/><circle cx="24" cy="22" r="18" fill="${ok ? cor : 'none'}" stroke="${ok ? cor : 'currentColor'}" stroke-width="3" opacity="${ok ? 1 : .35}"/><text x="24" y="29" text-anchor="middle" font-size="20" font-weight="800" fill="${ok ? '#fff' : 'currentColor'}" opacity="${ok ? 1 : .4}" font-family="Barlow Condensed, Arial Narrow, sans-serif">${k}</text></svg>`; }
const _passHtml = passHtml;
passHtml = function (t, p, al, m, ecra) {
  const h = _passHtml(t, p, al, m, ecra); if (!h) return h; const v = avalOf(t.id, p), cs = compsOf(t.ciclo, m);
  const ks = ['I', 'E', 'A'].filter(k => cs.some(c => c.k === k)).map(k => ({k, ok:compsNivel(cs, k).every(c => domina(v, al.id, m, c))}));
  return h.replace('<div class="pass-bar">', `<div class="selos">${ks.map(x => selo(x.k, x.ok)).join('')}</div><div class="pass-bar">`);
};

/* 6. relatório do aluno: radar das matérias e semáforo da aptidão física */
const _relAluno = relAlunoHtml;
relAlunoHtml = function (t, p, al) {
  let h = _relAluno(t, p, al); const r = calc(t, p, al), ms = Object.keys(r.lv); if (!ms.length) return h;
  const media = m => { const ls = alunosOf(t).map(a => calc(t, p, a).lv[m]).filter(l => l in LVP); return ls.length ? ls.reduce((s, l) => s + LVP[l], 0) / ls.length : null; };
  const keep = CHW; CHW = 300; const radar = ms.length >= 3 ? chRadar(ms.map(m => ({label:m.length > 14 ? m.slice(0, 13) + '…' : m, v:LVP[r.lv[m]], m:media(m)})), {w:300}) : ''; CHW = keep;
  const sem = r.apfOn ? FIT.filter(f => r.zones[f.k] != null).map(f => `<span class="sem z${r.zones[f.k]}"><i></i>${esc(f.n)}</span>`).join('') : '';
  const bloco = `<div class="ra-vis">${radar ? `<div><span class="ra-k">As tuas matérias (linha a cheio) e a média da turma</span>${radar}</div>` : ''}${sem ? `<div><span class="ra-k">Aptidão física</span><div class="sems">${sem}</div><p class="rel-s">Verde: Zona Saudável ou Atlética. Vermelho: a melhorar.</p></div>` : ''}</div>`;
  return h.replace(/(<div class="rel-id">[^]*?<\/div><\/div><\/div>)/, '$1' + bloco);
};

/* 7. QR nos cartões de desafio: abre o vídeo ou a explicação do exercício (biblioteca carregada quando é precisa) */
let QRLIB = null;
function qrCarregar() {
  if (QRLIB) return QRLIB;
  return QRLIB = new Promise(res => { if (window.qrcode) return res(true); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = () => res(!!window.qrcode); s.onerror = () => res(false); document.head.appendChild(s); setTimeout(() => res(!!window.qrcode), 6000); });
}
function qrSvg(txt, px) { try { const q = window.qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(txt))); q.make(); const n = q.getModuleCount(); let d = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return `<svg class="qr" width="${px}" height="${px}" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; } catch (e) { return ''; } }
const exLink = (ex, m) => ex && ex.link ? ex.link : 'https://www.youtube.com/results?search_query=' + encodeURIComponent((ex ? ex.nome : '') + ' ' + m + ' educação física');
const _docDes = A['doc-des'];
A['doc-des'] = async () => { const ok = await qrCarregar(); UI.qrOk = ok; _docDes(); if (!ok) toast('Sem ligação à biblioteca dos códigos QR: os cartões mostram o endereço por extenso.'); };
const _cartoes = cartoesHtml;
cartoesHtml = function (t, p) {
  let h = _cartoes(t, p); if (!UI.qrOk && !window.qrcode) return h;
  // um QR por cartão: o exercício do primeiro desafio com exercício
  alunosOf(t).forEach(al => { const x = matsOf(t, p).map(m => ({m, d:desafioPlus(t, p, al, m)})).find(y => y.d && y.d.ex); if (!x) return;
    const q = qrSvg(exLink(x.d.ex, x.m), 72); if (q) h = h.replace(`<div class="cdes"><b>${esc(al.nome)}</b>`, `<div class="cdes"><div class="cdes-q">${q}<span>Aponta a câmara: ${esc(x.d.ex.nome)}</span></div><b>${esc(al.nome)}</b>`); });
  return h;
};

/* 3. linha do tempo do aluno */
ATABS.splice(2, 0, ['evol', 'Evolução']);
function vEvolucao(t, al) {
  const H = ((S.hist[t.id] || {}).ev || []).filter(e => e.aid === al.id && e.f === 'af' && e.para && e.para in LVP), ini = (CFG.per[0] || {}).ini || today(), fim = fimPer(t, CFG.nper) || today();
  const ms = [...new Set([...H.map(e => e.k), ...[1, 2, 3].flatMap(p => Object.keys(((avalOf(t.id, p).af || {})[al.id]) || {}))])];
  if (!ms.length) return emptyCard('Ainda sem níveis', 'A evolução aparece à medida que os níveis são lançados ao longo do ano.');
  const W = 640, row = 46, L = 120, xt = d => L + (new Date(d) - new Date(ini)) / Math.max(1, new Date(fim) - new Date(ini)) * (W - L - 16), Ht = ms.length * row + 34;
  let svg = `<svg class="evol" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="Evolução dos níveis de ${esc(al.nome)}">`;
  CFG.per.slice(0, CFG.nper).forEach((P, i) => { if (!P.ini) return; const x = xt(P.ini); svg += `<line x1="${x}" x2="${x}" y1="0" y2="${Ht - 20}" stroke="var(--line)"/><text x="${x + 4}" y="${Ht - 6}" font-size="11" fill="var(--muted)">${perLabel(i + 1)}</text>`; });
  const marcos = [];
  ms.forEach((m, i) => {
    const y0 = 10 + i * row, yl = l => y0 + row - 14 - LV.indexOf(l) / (LV.length - 1) * (row - 18), s = subOf(m, anoOf(t), true), cor = `var(--v${SUBC[s] || 7})`;
    let pts = H.filter(e => e.k === m).sort((a, b) => a.ts - b.ts).map(e => ({d:new Date(e.ts).toISOString().slice(0, 10), l:e.para}));
    if (!pts.length) pts = [1, 2, 3].map(p => ({d:fimPer(t, p) && fimPer(t, p) < today() ? fimPer(t, p) : today(), l:(((avalOf(t.id, p).af || {})[al.id]) || {})[m]})).filter(x => x.l);
    svg += `<text x="4" y="${y0 + row / 2}" font-size="12.5" font-weight="600" fill="var(--text)">${esc(m.length > 16 ? m.slice(0, 15) + '…' : m)}</text><line x1="${L}" x2="${W - 16}" y1="${y0 + row - 14}" y2="${y0 + row - 14}" stroke="var(--line)" stroke-dasharray="2 3"/>`;
    if (pts.length) { let d = '', prev = null; pts.forEach((q, j) => { const x = xt(q.d), y = yl(q.l); d += (j ? `H${x}V${y}` : `M${x} ${y}`); if (prev && ['I', 'E', 'A'].includes(q.l) && LV.indexOf(q.l) > LV.indexOf(prev)) marcos.push({d:q.d, txt:`passou a ${LVN[q.l]} em ${m}`}); prev = q.l; });
      d += `H${xt(today() < fim ? today() : fim)}`; svg += `<path d="${d}" fill="none" stroke="${cor}" stroke-width="3" stroke-linejoin="round"/>`;
      pts.forEach(q => { svg += `<circle cx="${xt(q.d)}" cy="${yl(q.l)}" r="4" fill="${cor}"/>`; }); const u = pts[pts.length - 1]; svg += `<text x="${Math.min(W - 30, xt(u.d) + 8)}" y="${yl(u.l) - 6}" font-size="11" font-weight="700" fill="${cor}">${u.l}</text>`; }
    // evidências (pontos pequenos)
    [1, 2, 3].forEach(p => Object.values(evMap(avalOf(t.id, p), al.id, m)).flat().forEach(([d, ok]) => { svg += `<circle cx="${xt(d)}" cy="${y0 + row - 6}" r="2.2" fill="${ok ? 'var(--ok)' : 'var(--bad)'}" opacity=".7"/>`; }));
  });
  svg += '</svg>';
  const pp = aulasOf(t.id).filter(a => (a.papeis || []).some(([x]) => x === al.id));
  return `<div class="card">${svg}<p class="hint" style="margin:6px 0 0">Linha: nível ao longo do ano (NI em baixo, A em cima). Pontos: observações nas aulas (verde conseguiu, vermelho ainda não).</p></div>
    ${marcos.length || pp.length ? `<div class="card"><b>Marcos</b><ul class="marcos">${marcos.map(x => `<li><span class="num-t">${esc(fmtDate(x.d, {day:'numeric', month:'short'}))}</span> ${esc(x.txt.charAt(0).toUpperCase() + x.txt.slice(1))}</li>`).join('')}${pp.map(a => `<li><span class="num-t">${esc(fmtDate(a.data, {day:'numeric', month:'short'}))}</span> ${esc(a.papeis.filter(([x]) => x === al.id).map(([, p]) => p).join(', '))}</li>`).join('')}</ul></div>` : ''}`;
}
const _vAlunoPage = vAlunoPage;
vAlunoPage = function (t, al, split) {
  if (UI.atab !== 'evol') return _vAlunoPage(t, al, split);
  UI.atab = 'hist'; let h = _vAlunoPage(t, al, split); UI.atab = 'evol';
  h = h.replace(/(<button role="tab" data-a="ap-tab" data-k=")(\w+)(" class=")on(")/g, '$1$2$3$4').replace('data-k="evol" class="', 'data-k="evol" class="on');
  const i = h.lastIndexOf('<div class="card">'); return h.slice(0, i) + vEvolucao(t, al) + '</div>';
};

/* 9. Início personalizável */
const INI_SEC = [['agora', 'Aula de agora e a seguir'], ['turmas', 'Turmas'], ['alertas', 'Atenção'], ['dispensas', 'Dispensas em curso'], ['ultimas', 'Últimas aulas']];
const _vInicio = vInicio;
vInicio = function () {
  const h = _vInicio(), partes = h.split(/<!--S:(\w+)-->/); if (partes.length < 3) return h;
  const cabeca = partes[0], sec = {}; for (let i = 1; i < partes.length; i += 2) sec[partes[i]] = partes[i + 1];
  let fimTxt = ''; const last = INI_SEC.map(x => x[0]).filter(k => sec[k] != null).pop(); if (last && sec[last].endsWith('</div>')) { sec[last] = sec[last].slice(0, -6); fimTxt = '</div>'; }
  const ord = (UI.iniOrd || []).filter(k => sec[k] != null).concat(INI_SEC.map(x => x[0]).filter(k => sec[k] != null && !(UI.iniOrd || []).includes(k))), off = new Set(UI.iniOff || []);
  return cabeca + ord.filter(k => !off.has(k)).map(k => sec[k]).join('') + `<button class="link ini-pers" data-a="ini-pers">Personalizar o Início</button>` + fimTxt;
};
function sheetIniPers() {
  const ord = (UI.iniOrd || []).concat(INI_SEC.map(x => x[0]).filter(k => !(UI.iniOrd || []).includes(k))), off = new Set(UI.iniOff || []), nome = Object.fromEntries(INI_SEC);
  const body = `<div class="form"><p class="hint" style="margin:0">Escolha o que aparece no Início e por que ordem.</p><div class="list">${ord.map((k, i) => `<div class="li"><label class="cli" style="flex:1"><input type="checkbox" data-in="ini-on" data-k="${k}"${off.has(k) ? '' : ' checked'}> <span>${esc(nome[k])}</span></label><button class="icon-btn" data-a="ini-mv" data-k="${k}" data-d="-1" aria-label="Subir"${i ? '' : ' disabled'}>↑</button><button class="icon-btn" data-a="ini-mv" data-k="${k}" data-d="1" aria-label="Descer"${i < ord.length - 1 ? '' : ' disabled'}>↓</button></div>`).join('')}</div></div>`;
  if ($('#sheet').hidden) openSheet('Personalizar o Início', body, `<button class="btn primary" data-a="sh-close">Feito</button>`); else updSheet(body, `<button class="btn primary" data-a="sh-close">Feito</button>`);
}

/* 10. animações discretas: subida de nível e "guardado" */
const _tickSet = tickSet;
tickSet = function (t, p, aid, m, match, on) {
  const antes = ((((avalOf(t.id, p).af || {})[aid]) || {})[m]); _tickSet(t, p, aid, m, match, on); const depois = ((((avalOf(t.id, p).af || {})[aid]) || {})[m]);
  if (on && depois && ['I', 'E', 'A'].includes(depois) && (!antes || LV.indexOf(depois) > LV.indexOf(antes))) { const al = alunosOf(t).find(x => x.id === aid); celebrar(`${nome2(al ? al.nome : '')} passou a ${LVN[depois]} em ${m}`); }
};
function celebrar(txt) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { toast('⬆ ' + txt); return; }
  let el = $('#celeb'); if (!el) { el = document.createElement('div'); el.id = 'celeb'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.innerHTML = `<span class="cb-i">⬆</span><span>${esc(txt)}</span>`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
}
const _write = Store._write.bind(Store);
Store._write = function (k, id, get) { const p = _write(k, id, get); p.then(() => { const el = $('#guardado'); if (el) { el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); } }).catch(() => {}); return p; };
(function marca() { if (!document.body) return setTimeout(marca, 100); if (!$('#guardado')) { const g = document.createElement('div'); g.id = 'guardado'; g.setAttribute('aria-hidden', 'true'); g.textContent = '✓ Guardado'; document.body.appendChild(g); } })();

/* 11. modo apresentação: cronómetro, estações e equipas em grande, para projetar */
const PROJ = {sec:'crono', dur:120, rest:120, run:false, t0:0, tm:null};
function projAbrir(sec) { PROJ.sec = sec || PROJ.sec; let el = $('#proj'); if (!el) { el = document.createElement('div'); el.id = 'proj'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); } el.hidden = false; document.body.classList.add('locked'); projRender(); }
function projRestante() { return PROJ.run ? Math.max(0, PROJ.rest - (Date.now() - PROJ.t0) / 1000) : PROJ.rest; }
function projRender() {
  const el = $('#proj'), t = turma(), a = t && aulasOf(t.id).filter(x => x.data === today()).pop(); if (!el) return;
  let corpo = '';
  if (PROJ.sec === 'crono') { const r = projRestante(), mm = Math.floor(Math.ceil(r) / 60), ss = Math.ceil(r) % 60;
    corpo = `<div class="pj-crono${r === 0 ? ' fim' : ''}"><div class="pj-num num-t" id="pj-num">${mm}:${String(ss).padStart(2, '0')}</div>
      <div class="pj-bar"><i style="width:${PROJ.dur ? (1 - r / PROJ.dur) * 100 : 0}%"></i></div>
      <div class="btn-row pj-ctl">${[30, 60, 120, 300, 600].map(s => `<button class="btn" data-a="pj-dur" data-s="${s}">${s < 60 ? s + ' s' : s / 60 + ' min'}</button>`).join('')}</div>
      <div class="btn-row pj-ctl"><button class="btn primary big" data-a="pj-go">${PROJ.run ? 'Pausa' : 'Começar'}</button><button class="btn big" data-a="pj-reset">Recomeçar</button></div></div>`; }
  else if (PROJ.sec === 'est') { const P = a && a.plano;
    if (P && P.dif && P.dif.m) { const {g} = difGrupos(t, a, P.dif.m); corpo = `<div class="pj-est">${['I', 'E', 'A'].filter(k => g[k].length).map(k => { const ex = exById((P.dif.g || {})[k]); return `<div class="pj-g ${AIG[k]}"><h2>${esc(ex ? ex.nome : DGN[k])}</h2><p>${esc(ex ? ex.crit || ex.desc || '' : '')}</p><div class="pj-n">${g[k].map(al => `<span>${esc(al.nome.split(' ')[0])}</span>`).join('')}</div></div>`; }).join('')}</div>`; }
    else if (P && (P.pf || []).length) corpo = `<div class="pj-est">${P.pf.map((x, i) => `<div class="pj-g"><h2>${i + 1}. ${esc(x.nome)}</h2><p>${esc(x.crit || '')}</p><p class="pj-min">${x.min} min</p></div>`).join('')}</div>`;
    else corpo = `<p class="pj-vazio">A aula de hoje ainda não tem plano. Prepare-o em Turma › Aulas.</p>`; }
  else { const E = UI.eq || {}, als = t ? alunosOf(t) : [];
    corpo = E.res && E.res.length ? `<div class="pj-est">${E.res.map((ids, i) => `<div class="pj-g e${i % 6}"><h2>Equipa ${i + 1}</h2><div class="pj-n">${ids.map(id => { const al = als.find(x => x.id === id); return al ? `<span>${esc(al.nome.split(' ')[0])}</span>` : ''; }).join('')}</div></div>`).join('')}</div>` : `<p class="pj-vazio">Ainda não há equipas. Faça-as em Ferramentas › Equipas.</p><div class="btn-row" style="justify-content:center"><button class="btn primary big" data-a="pj-eq">Fazer equipas agora</button></div>`; }
  el.innerHTML = `<header class="pj-h"><div class="seg">${[['crono', 'Cronómetro'], ['est', 'Estações'], ['eq', 'Equipas']].map(([k, n]) => `<button data-a="pj-sec" data-k="${k}" class="${PROJ.sec === k ? 'on' : ''}">${n}</button>`).join('')}</div><span class="sp"></span><button class="btn" data-a="pj-full">Ecrã inteiro</button><button class="btn" data-a="pj-sair">Sair</button></header><div class="pj-b">${corpo}</div>`;
}
function projTick() {
  clearInterval(PROJ.tm); if (!PROJ.run) return;
  PROJ.tm = setInterval(() => { const r = projRestante(), n = $('#pj-num'); if (!$('#proj') || $('#proj').hidden) { clearInterval(PROJ.tm); return; }
    if (n) { n.textContent = Math.floor(Math.ceil(r) / 60) + ':' + String(Math.ceil(r) % 60).padStart(2, '0'); const b = $('#proj .pj-bar i'); if (b) b.style.width = (1 - r / PROJ.dur) * 100 + '%'; }
    if (r <= 0) { PROJ.run = false; PROJ.rest = 0; clearInterval(PROJ.tm); apito(); projRender(); } }, 200);
}
function apito() { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(d => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 1760; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.25, ac.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d + .28); o.start(ac.currentTime + d); o.stop(ac.currentTime + d + .3); }); } catch (e) {} }

Object.assign(A, {
  'mapa-m': el => { UI.mapaM = el.dataset.m; render(); },
  'mapa-al': el => { sheetObs(today(), [UI.mapaM]); UI.obs.modo = 'aluno'; UI.obs.aid = el.dataset.id; obsRender(); },
  'ini-pers': () => sheetIniPers(),
  'ini-mv': el => { const ord = (UI.iniOrd || []).concat(INI_SEC.map(x => x[0]).filter(k => !(UI.iniOrd || []).includes(k))), i = ord.indexOf(el.dataset.k), j = i + +el.dataset.d; if (j < 0 || j >= ord.length) return; [ord[i], ord[j]] = [ord[j], ord[i]]; UI.iniOrd = ord; saveUI(); sheetIniPers(); render(); },
  'proj': () => projAbrir(),
  'pj-sec': el => { PROJ.sec = el.dataset.k; projRender(); },
  'pj-dur': el => { PROJ.dur = PROJ.rest = +el.dataset.s; PROJ.run = false; clearInterval(PROJ.tm); projRender(); },
  'pj-go': () => { if (PROJ.run) { PROJ.rest = projRestante(); PROJ.run = false; } else { if (PROJ.rest <= 0) PROJ.rest = PROJ.dur; PROJ.t0 = Date.now(); PROJ.run = true; } projRender(); projTick(); },
  'pj-reset': () => { PROJ.run = false; PROJ.rest = PROJ.dur; clearInterval(PROJ.tm); projRender(); },
  'pj-full': () => { const el = $('#proj'); try { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen(); } catch (e) {} },
  'pj-eq': () => { UI.eq = Object.assign({n:2, crit:'rand', mix:true, pres:true}, UI.eq || {}); try { eqMake(); } catch (e) { toast('Não foi possível fazer as equipas.', 'bad'); } projRender(); },
  'pj-sair': () => { PROJ.run = false; clearInterval(PROJ.tm); const el = $('#proj'); if (el) { el.hidden = true; el.innerHTML = ''; } document.body.classList.remove('locked'); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} }
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.in === 'ini-on') { const off = new Set(UI.iniOff || []); el.checked ? off.delete(el.dataset.k) : off.add(el.dataset.k); UI.iniOff = [...off]; saveUI(); render(); } });
