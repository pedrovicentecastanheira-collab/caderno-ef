/* ---------- rotação dos espaços ---------- */
// Os espaços da escola e as matérias possíveis em cada um ficam em CFG.esp; cada turma tem a sua rotação
// (t.esp = {seq:[espaços pela ordem], sem:semanas em cada espaço, ini:segunda-feira de início, ov:{segunda: espaço}}).
const ESP0 = ['Pavilhão', 'Ginásio', 'Exterior'];
const ESPM0 = {
  'Pavilhão':['Voleibol', 'Basquetebol', 'Andebol', 'Futsal', 'Badminton', 'Ginástica de Solo', 'Ginástica de Aparelhos (Trampolins)', 'Ginástica Acrobática', 'Ginástica Rítmica', 'Dança', 'Danças Sociais', 'Danças Tradicionais', 'Patinagem', 'Patinagem Artística', 'Hóquei em Patins', 'Corfebol', 'Kin-Ball', 'Pickleball', 'Ténis de Mesa', 'Aeróbica'],
  'Ginásio':['Ginástica de Solo', 'Ginástica de Aparelhos (Trampolins)', 'Ginástica Acrobática', 'Ginástica Rítmica', 'Dança', 'Danças Sociais', 'Danças Tradicionais', 'Aeróbica', 'Luta', 'Judo', 'Karaté', 'Jogo do Pau Português', 'Ténis de Mesa'],
  'Exterior':['Futebol', 'Andebol', 'Basquetebol', 'Voleibol', 'Atletismo', 'Orientação', 'Softbol', 'Beisebol', 'Rugby T1', 'Ultimate Frisbee', 'Hóquei em Campo', 'Patinagem', 'Corrida de Patins', 'Skateboarding', 'Ténis', 'Padel', 'Golfe', 'Tiro com Arco', 'Jogos Tradicionais Populares']
};
function espCfg() { if (!CFG.esp) CFG.esp = {lista:ESP0.slice(), mats:clone(ESPM0)}; return CFG.esp; }
const segunda = d => { const x = new Date(d + 'T12:00:00'), w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return x.toISOString().slice(0, 10); };
const somaDias = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
function espOf(t, d) {
  const e = t.esp; if (!e) return null; const mon = segunda(d);
  if (e.ov && e.ov[mon]) return e.ov[mon];
  const seq = (e.seq || []).filter(Boolean); if (!seq.length) return null;
  const w = Math.floor((new Date(mon + 'T12:00:00') - new Date(segunda(e.ini || CFG.per[0].ini || today()) + 'T12:00:00')) / (7 * 864e5));
  const i = Math.floor(w / Math.max(1, e.sem || 1)); return seq[((i % seq.length) + seq.length) % seq.length];
}
const espPode = (esp, m) => !esp || ((espCfg().mats[esp] || []).includes(m));
// Semanas de um período, com o espaço e a unidade didática prevista em cada uma (pelas aulas por semana do horário).
function semanasDe(t, p) {
  const P = CFG.per[p - 1] || {}; if (!P.ini || !P.fim) return [];
  const out = [], pw = Math.max(1, (t.horario || []).filter(h => h.h).length || 2), pl = planOf(t, p);
  let acc = 0;
  for (let mon = segunda(P.ini); mon <= P.fim; mon = somaDias(mon, 7)) {
    let k = acc, ud = null; for (const u of pl) { if (k < u.n) { ud = u.m; break; } k -= u.n; }
    out.push({mon, esp:espOf(t, mon), ud, ov:!!(t.esp && t.esp.ov && t.esp.ov[mon])}); acc += pw;
  }
  return out;
}
function vEspacos(t) {
  const E = espCfg(), e = t.esp || {seq:[], sem:2, ini:segunda(CFG.per[0].ini || today())}, sem = semanasDe(t, UI.p), mon0 = segunda(today());
  let h = `<div class="card"><b>Rotação da turma</b><p class="hint" style="margin:4px 0 10px">Ordem dos espaços e semanas seguidas em cada um. Toque numa semana abaixo para trocar só essa semana.</p>
    <div class="esp-seq">${E.lista.map((_, i) => `<div class="field"><label for="esp-s${i}">${i + 1}.º espaço</label><select id="esp-s${i}" data-in="esp-seq" data-i="${i}"><option value="">—</option>${E.lista.map(x => `<option${(e.seq || [])[i] === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>`).join('')}
    <div class="field"><label for="esp-sem">Semanas em cada</label><input id="esp-sem" type="number" min="1" max="12" inputmode="numeric" data-in="esp-sem" value="${e.sem || 2}"></div>
    <div class="field"><label for="esp-ini">Início</label><input id="esp-ini" type="date" data-in="esp-ini" value="${esc(e.ini || '')}"></div></div></div>`;
  if (sem.length) {
    const bad = sem.filter(s => s.esp && s.ud && !espPode(s.esp, s.ud)).length;
    h += `<div class="sec-h"><h2>Semanas · ${perLabel(UI.p, true)}</h2><span class="small ${bad ? 'bad-t' : 'muted'}">${bad ? bad + (bad === 1 ? ' semana com a unidade fora do espaço' : ' semanas com a unidade fora do espaço') : 'Plano compatível com os espaços'}</span></div><div class="card esp-wk">`;
    h += sem.map(s => { const ms = (MATS[t.ciclo] || GR).filter(m => s.esp && espPode(s.esp, m)), okUd = !s.ud || espPode(s.esp, s.ud);
      return `<div class="esp-r${s.mon === mon0 ? ' cur' : ''}"><span class="esp-d num-t">${fmtDate(s.mon, {day:'numeric', month:'short'})}</span><button class="esp-p e${Math.max(0, E.lista.indexOf(s.esp)) % 6}${s.ov ? ' ov' : ''}" data-a="esp-wk" data-d="${s.mon}" title="Trocar o espaço desta semana">${esc(s.esp || 'Sem espaço')}</button>
        <span class="esp-u">${s.ud ? `<span class="${okUd ? '' : 'bad-t'}">${okUd ? '' : '⚠ '}UD ${esc(s.ud)}</span>` : '<span class="muted">sem UD prevista</span>'}<span class="esp-ms small muted">${s.esp ? ms.length + ' matérias possíveis: ' + esc(ms.slice(0, 6).join(', ')) + (ms.length > 6 ? '…' : '') : 'Defina a rotação.'}</span></span></div>`; }).join('');
    h += `</div>`;
  } else h += `<p class="note warn">Indique as datas do ${perLabel(UI.p, true)} em Definições › Ano letivo para ver as semanas.</p>`;
  // ocupação de todas as turmas
  const ts = Object.values(S.turmas).filter(x => x.esp && (x.esp.seq || []).some(Boolean));
  if (ts.length && sem.length) h += `<div class="sec-h"><h2>Ocupação dos espaços</h2><span class="small muted">todas as turmas</span></div><div class="tbl-wrap"><table class="esp-oc"><thead><tr><th class="l">Semana</th>${E.lista.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${sem.map(s => `<tr${s.mon === mon0 ? ' class="esp-now"' : ''}><td class="l num-t">${fmtDate(s.mon, {day:'numeric', month:'short'})}</td>${E.lista.map(x => `<td>${ts.filter(o => espOf(o, s.mon) === x).map(o => `<span class="tchip" style="--tc:var(${tcorVar(o)})">${esc(o.nome)}</span>`).join(' ')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  // espaços e matérias da escola
  h += `<details class="desc"><summary>Espaços da escola e matérias possíveis</summary><p class="hint">Partilhado por todas as turmas e incluído no pacote do grupo de EF.</p>
    ${E.lista.map((x, i) => `<div class="field" style="margin-bottom:12px"><div class="esp-nm"><b>${esc(x)}</b><button class="link" data-a="esp-del" data-i="${i}">Remover</button></div>${matChips(t, m => `<button class="chip ${(E.mats[x] || []).includes(m) ? 'on' : ''}" data-a="esp-mat" data-e="${esc(x)}" data-m="${esc(m)}">${esc(m)}</button>`, E.mats[x])}</div>`).join('')}
    <div style="display:flex;gap:8px;margin-bottom:12px"><input type="text" id="esp-new" placeholder="Novo espaço (ex.: Polidesportivo)" aria-label="Novo espaço"><button class="btn" data-a="esp-add">Adicionar</button></div></details>`;
  return h;
}
const tcorVar = t => '--v' + tcor(t);
function espSave(t) { Store.save('turmas', t); }
Object.assign(A, {
  'esp-wk': el => { const t = turma(), E = espCfg(); t.esp = t.esp || {seq:[], sem:2, ini:segunda(CFG.per[0].ini || today())}; t.esp.ov = t.esp.ov || {};
    const d = el.dataset.d; delete t.esp.ov[d]; const base = espOf(t, d), opts = [...E.lista, null], cur = el.textContent === 'Sem espaço' ? null : el.textContent, nx = opts[(opts.indexOf(cur) + 1) % opts.length];
    if (nx !== base && nx) t.esp.ov[d] = nx; espSave(t); render(); },
  'esp-mat': el => { const E = espCfg(), x = el.dataset.e, m = el.dataset.m, l = E.mats[x] = E.mats[x] || [], i = l.indexOf(m); i >= 0 ? l.splice(i, 1) : l.push(m); el.classList.toggle('on', i < 0); Store.save('cfg', CFG); },
  'esp-add': () => { const v = ($('#esp-new').value || '').trim(), E = espCfg(); if (!v || E.lista.includes(v)) return; E.lista.push(v); E.mats[v] = []; Store.save('cfg', CFG); render(); },
  'esp-del': el => { if (!armed(el, 'Confirmar')) return; const E = espCfg(), x = E.lista.splice(+el.dataset.i, 1)[0]; delete E.mats[x]; Store.save('cfg', CFG); render(); }
});
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset && el.dataset.in; if (!k || !k.startsWith('esp-')) return;
  const t = turma(); t.esp = t.esp || {seq:[], sem:2, ini:segunda(CFG.per[0].ini || today())};
  if (k === 'esp-seq') { t.esp.seq[+el.dataset.i] = el.value; t.esp.seq = Array.from(t.esp.seq, x => x || ''); }
  else if (k === 'esp-sem') t.esp.sem = Math.max(1, Math.min(12, parseInt(el.value, 10) || 1));
  else if (k === 'esp-ini') t.esp.ini = el.value ? segunda(el.value) : '';
  espSave(t); render();
});
