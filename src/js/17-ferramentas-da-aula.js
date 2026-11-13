/* ---------- ferramentas da aula ---------- */
let TOOL = null;
function audio() { try { TOOL.ac = TOOL.ac || new (window.AudioContext || window.webkitAudioContext)(); TOOL.ac.resume && TOOL.ac.resume(); } catch (e) {} }
function beep(n = 1, f = 880) {
  const ac = TOOL && TOOL.ac; if (!ac) return;
  for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * .2; o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.6, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + .15); o.start(t0); o.stop(t0 + .17); }
}
async function wake(on) { try { if (on && navigator.wakeLock) TOOL.wl = await navigator.wakeLock.request('screen'); else if (TOOL && TOOL.wl) { TOOL.wl.release(); TOOL.wl = null; } } catch (e) {} }
function stopTool() { if (!TOOL) return; clearInterval(TOOL.iv); wake(false); try { TOOL.ac && TOOL.ac.close(); } catch (e) {} TOOL = null; }
function sheetTools() {
  openSheet('Ferramentas da aula', `<div class="list">${[
    ['tool-vai', 'Vaivém (FITescola)', 'Sinais sonoros por percurso e por nível; toque no aluno quando para e o resultado entra na avaliação.'],
    ['tool-cron', 'Cronómetro', 'Velocidade 40 m e agilidade 4×10 m: um aluno atrás do outro, os tempos entram na avaliação.'],
    ['tool-cad', 'Cadência', 'Ritmo de 1 repetição a cada 3 segundos para abdominais e flexões, com contagem.'],
    ['tool-eq', 'Equipas', 'Aleatórias ou equilibradas pelo nível, misturando rapazes e raparigas.']
  ].map(([a, n, d]) => `<button class="li" data-a="${a}"><span class="who"><div class="nm">${n}</div><div class="meta" style="white-space:normal">${d}</div></span><span class="end muted">›</span></button>`).join('')}</div>`);
}
// Vaivém 20 m: nível 1 a 8,0 km/h, nível 2 a 9,0 km/h e +0,5 km/h por nível; cerca de 1 minuto por nível.
function pacer(n) { const kmh = n === 1 ? 8 : 8 + .5 * n, lap = 20 / (kmh / 3.6); return {kmh, lap, laps:Math.ceil(60 / lap)}; }
function pacerAt(ms) {
  let s = ms / 1000, lvl = 1, total = 0;
  for (;;) { const P = pacer(lvl), d = P.lap * P.laps; if (s < d) { const k = Math.floor(s / P.lap); return {lvl, lap:k + 1, total:total + k, P, frac:(s - k * P.lap) / P.lap}; } s -= d; total += P.laps; lvl++; if (lvl > 21) return {lvl:21, lap:1, total, P, frac:0, end:true}; }
}
function sheetVai() {
  const t = turma(); stopTool(); TOOL = {kind:'vai', el:0, run:false, res:{}, last:0, lastLvl:1};
  const als = alunosOf(t).filter(al => (REG[regAt(al)] || REG.Normal).apf > 0);
  openSheet('Vaivém', `<div class="tool"><div class="tbig"><span id="tv-l">Nível 1</span><b id="tv-t">0</b><span id="tv-p">percurso 1 · 8,0 km/h</span><div class="tprog"><i id="tv-b"></i></div></div>
    <div class="btn-row"><button class="btn primary" data-a="tv-go" id="tv-go">Iniciar</button><button class="btn" data-a="tv-reset">Recomeçar</button></div>
    <p class="hint">Um sinal a cada percurso, três sinais ao mudar de nível. Toque no aluno quando ele parar (à segunda falha): fica com os percursos completos até esse momento. Toque de novo para anular. Protocolo aproximado ao da FITescola: confirme com o áudio oficial quando puder.</p>
    <div class="tgrid">${als.map(al => `<button class="tst" data-a="tv-st" data-aid="${esc(al.id)}">${avatar(al, 'sm')}<span class="nm">${esc(al.nome.split(' ')[0])} ${esc(al.nome.split(' ').slice(-1)[0] !== al.nome.split(' ')[0] ? al.nome.split(' ').slice(-1)[0][0] + '.' : '')}</span><b id="tvs-${esc(al.id)}"></b></button>`).join('')}</div></div>`,
    `<button class="btn primary" data-a="tv-save" id="tv-save">Guardar resultados</button>`);
}
function tvTick() {
  const T = TOOL; if (!T || T.kind !== 'vai') return;
  const ms = T.el + (T.run ? performance.now() - T.t0 : 0), s = pacerAt(ms);
  if (T.run && s.total > T.last) { beep(s.lvl > T.lastLvl ? 3 : 1, s.lvl > T.lastLvl ? 1046 : 880); T.last = s.total; T.lastLvl = s.lvl; }
  const q = id => document.getElementById(id); if (!q('tv-t')) return;
  q('tv-l').textContent = 'Nível ' + s.lvl; q('tv-t').textContent = s.total; q('tv-p').textContent = `percurso ${s.lap} de ${s.P.laps} · ${s.P.kmh.toLocaleString('pt-PT', {minimumFractionDigits:1})} km/h`; q('tv-b').style.width = Math.round(s.frac * 100) + '%';
}
function sheetCron() {
  const t = turma(); stopTool(); TOOL = {kind:'cron', test:'vel', i:0, run:false, res:{}};
  TOOL.q = alunosOf(t).filter(al => (REG[regAt(al)] || REG.Normal).apf > 0).map(al => al.id);
  cronRender(true);
}
function cronRender(open) {
  const T = TOOL, t = turma(), al = id => (t.alunos || []).find(x => x.id === id), cur = al(T.q[T.i]);
  const body = `<div class="tool"><div class="seg block">${[['vel', 'Velocidade 40 m'], ['agil', 'Agilidade 4×10 m']].map(([k, n]) => `<button data-a="tc-test" data-k="${k}" class="${T.test === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="tbig"><span>${cur ? esc(cur.num + ' · ' + cur.nome) : 'Todos os alunos têm tempo'}</span><b id="tc-t">0,00</b><span>segundos</span></div>
    <div class="btn-row"><button class="btn primary" data-a="tc-go" id="tc-go"${cur ? '' : ' disabled'}>${T.run ? 'Chegada' : 'Partida'}</button><button class="btn" data-a="tc-skip">Saltar aluno</button></div>
    <div class="list">${T.q.map((id, i) => { const a = al(id); return a ? `<button class="li${i === T.i ? ' on' : ''}" data-a="tc-sel" data-i="${i}">${avatar(a, 'sm')}<span class="who"><div class="nm">${esc(a.num + ' · ' + a.nome)}</div></span><span class="end"><b>${T.res[id] != null ? nf2(T.res[id]) + ' s' : ''}</b></span></button>` : ''; }).join('')}</div></div>`;
  const foot = `<button class="btn primary" data-a="tc-save">Guardar ${Object.keys(T.res).length} tempos</button>`;
  if (open) openSheet('Cronómetro', body, foot); else updSheet(body, foot);
}
const nf2 = v => v.toLocaleString('pt-PT', {minimumFractionDigits:2, maximumFractionDigits:2});
function sheetCad() {
  stopTool(); TOOL = {kind:'cad', n:0, run:false, per:3000};
  openSheet('Cadência', `<div class="tool"><div class="tbig"><span>Repetições</span><b id="cd-n">0</b><span id="cd-s">1 repetição a cada 3 segundos</span><div class="tprog"><i id="cd-b"></i></div></div>
    <div class="btn-row"><button class="btn primary" data-a="cd-go" id="cd-go">Iniciar</button><button class="btn" data-a="cd-reset">Recomeçar</button></div>
    <p class="hint">Sinal grave para descer, agudo para subir. Abdominais: máximo de 75 repetições. Flexões de braços: até o aluno não conseguir manter o ritmo.</p></div>`);
}

