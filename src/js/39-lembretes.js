/* ---------- lembretes e notificações ---------- */
// Com a app aberta (ou em segundo plano), verifica a cada meio minuto: aulas de hoje pelo horário, fim do período com
// alunos por avaliar e o prazo da avaliação inicial. Cada lembrete sai uma só vez (chave guardada neste aparelho).
const lembCfg = () => CFG.lemb || (CFG.lemb = {on:false, min:10, per:true, ai:true});
const LEMB_SENT = new Set();
function lembSent(k) { try { if (localStorage.getItem('ef-lemb:' + k)) return true; } catch (e) {} return LEMB_SENT.has(k); }
function lembMark(k) { LEMB_SENT.add(k); try { localStorage.setItem('ef-lemb:' + k, '1'); } catch (e) {} }
const notifOk = () => typeof Notification !== 'undefined' && Notification.permission === 'granted';
async function notify(title, body, tag) {
  if (notifOk()) {
    try {
      const reg = navigator.serviceWorker && await Promise.race([navigator.serviceWorker.getRegistration(), sleep(800)]);
      if (reg && reg.showNotification) { await reg.showNotification(title, {body, tag, icon:'icons/icon-192.png', badge:'icons/icon-192.png'}); return; }
      new Notification(title, {body, tag, icon:'icons/icon-192.png'}); return;
    } catch (e) {}
  }
  toast(title + (body ? ' · ' + body : ''));
}
// Lembretes devidos agora (e os próximos de hoje, para a lista nas Definições).
function lembList() {
  const L = lembCfg(), out = [], now = new Date(), hm = now.getHours() * 60 + now.getMinutes(), d = today();
  hojeSlots().forEach(({t, h}) => {
    const [hh, mm] = h.split(':').map(Number), at = hh * 60 + mm, es = espOf(t, d), ud = udAtual(t, periodOf(d)), feita = aulasOf(t.id).some(a => a.data === d);
    out.push({k:'aula:' + d + ':' + t.id + ':' + h, when:at - L.min, due:!feita && at - L.min <= hm && hm <= at + 5, title:`Hoje às ${h}, ${t.nome}`, body:[es, ud && 'UD ' + ud].filter(Boolean).join(' · ') || 'Aula de Educação Física'});
  });
  Object.values(S.turmas).forEach(t => {
    const p = periodOf(d), fim = (CFG.per[p - 1] || {}).fim; if (!fim || !alunosOf(t).length) return;
    const dias = diasAte(fim);
    if (L.per && dias >= 0 && dias <= 10) { const n = alunosOf(t).filter(al => calc(t, p, al).EST === 'Incompleto').length;
      if (n) out.push({k:'per:' + d + ':' + t.id, when:8 * 60, due:hm >= 8 * 60, title:`Faltam ${dias} dias para o fim do ${perLabel(p, true)}`, body:`${t.nome}: ${n} ${n === 1 ? 'aluno está' : 'alunos estão'} por avaliar.`}); }
    if (L.ai && p === 1 && t.ciclo !== '1') { const da = diasAte(aiPrazo()), pr = aiProg(t);
      if (da >= 0 && da <= 14 && (!pr.tot || pr.done < pr.tot)) out.push({k:'ai:' + d + ':' + t.id, when:8 * 60, due:hm >= 8 * 60, title:`Avaliação inicial: faltam ${da} dias`, body:`${t.nome}: ${pr.tot ? pr.done + ' de ' + pr.tot + ' registos' : 'por começar'}.`}); }
  });
  return out.sort((a, b) => a.when - b.when);
}
function lembTick() {
  if (!CFG || !lembCfg().on) return;
  lembList().filter(x => x.due && !lembSent(x.k)).forEach(x => { lembMark(x.k); notify(x.title, x.body, x.k); });
}
setInterval(lembTick, 30000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(lembTick, 1500); });
setTimeout(lembTick, 4000);

function vLembretes() {
  const L = lembCfg(), sup = typeof Notification !== 'undefined', perm = sup ? Notification.permission : 'unsupported', ls = lembList();
  const mh = m => pad(Math.floor(Math.max(0, m) / 60)) + ':' + pad(Math.max(0, m) % 60);
  return `<div class="sec-h"><h2>Lembretes</h2></div><div class="card form">
    <label class="cli"><input type="checkbox" data-in="lemb" data-k="on"${L.on ? ' checked' : ''}> <span><b>Ativar lembretes</b><br><span class="hint">Notificações no telemóvel ou no computador: aulas do dia, fim do período e avaliação inicial.</span></span></label>
    <div class="field"><label for="lemb-min">Avisar antes da aula</label><select id="lemb-min" data-in="lemb" data-k="min">${[5, 10, 15, 30, 60].map(n => `<option value="${n}"${L.min === n ? ' selected' : ''}>${n} minutos</option>`).join('')}</select></div>
    <label class="cli"><input type="checkbox" data-in="lemb" data-k="per"${L.per ? ' checked' : ''}> <span>Fim do período com alunos por avaliar (nos últimos 10 dias)</span></label>
    <label class="cli"><input type="checkbox" data-in="lemb" data-k="ai"${L.ai ? ' checked' : ''}> <span>Prazo da avaliação inicial (nas duas semanas antes)</span></label>
    <p class="note ${perm === 'granted' ? 'ok' : 'warn'}">${perm === 'granted' ? 'Notificações autorizadas neste aparelho.' : perm === 'denied' ? 'As notificações estão bloqueadas neste navegador. Autorize-as nas definições do site; até lá, os lembretes aparecem dentro da app.' : perm === 'unsupported' ? 'Este navegador não mostra notificações: os lembretes aparecem dentro da app.' : 'Ao ativar, o navegador pede autorização para mostrar notificações.'}</p>
    <p class="hint">Os lembretes saem enquanto o caderno estiver aberto ou em segundo plano. No telemóvel, instale a app no ecrã principal e deixe-a aberta em segundo plano durante o dia. O horário de cada turma define as aulas.</p>
    <button class="btn" data-a="lemb-test">Enviar um lembrete de teste</button></div>
    <div class="sec-h"><h2>Hoje</h2></div>${ls.length ? `<div class="card">${ls.map(x => `<div class="li lemb"><span class="num-t lemb-h">${mh(x.when)}</span><span class="who"><b>${esc(x.title)}</b><span class="small muted">${esc(x.body)}</span></span>${lembSent(x.k) ? '<span class="pill ok">enviado</span>' : ''}</div>`).join('')}</div>` : '<p class="hint">Sem lembretes para hoje. Defina o horário de cada turma para receber os avisos das aulas.</p>'}`;
}
Object.assign(A, {
  'lemb-test': () => { const L = lembCfg(), go = () => notify('Caderno EF', 'Assim chegam os lembretes: hoje às 10:15, 7.º B · Pavilhão.', 'teste');
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().then(() => { go(); render(); }); else go(); }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset || el.dataset.in !== 'lemb') return;
  const L = lembCfg(), k = el.dataset.k; L[k] = el.type === 'checkbox' ? el.checked : +el.value; Store.save('cfg', CFG);
  if (k === 'on' && el.checked && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().then(() => render()); else render();
});
