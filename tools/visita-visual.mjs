// Visita visual do Caderno EF: percorre todos os ecrãs e abre as janelas e os documentos seguros,
// no computador e no telemóvel, em modo claro e escuro. Regista erros de JavaScript e ecrãs mais largos do que o telemóvel.
// Uso: node tools/visita-visual.mjs [pasta-das-capturas]
//   (precisa do servidor: node tests/serve.mjs  →  http://localhost:8770)
// Sai com código 1 se houver erros de JavaScript. Escreve relatorio.json na pasta das capturas.
import {chromium, devices} from '@playwright/test';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
const OUT = process.argv[2] || 'test-results/visita-visual';
mkdirSync(OUT, {recursive: true});
const exe = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const URL = process.env.CADERNO_URL || 'http://localhost:8770/';
// ações que só abrem janelas ou documentos (nunca apagam, enviam ou gravam)
const ABRE = /(open|-new$|novo|-edit$|^doc-|^tools$|^proj$|^pesq$|^plano-edit$|^aula-new$|^ini-pers$|^modo-aluno$|^auto-first$|^rel-one$|^rel-esc$|^cons-open$|^med-open$|^obs-auto$|^ma-obs$|^ma-edit$|^cal-dia$|^aula-edit$|^aluno-edit$|^turma-edit$|^af-open$|^ai-|^rb-usar$|^rb-lib$|^rb-ver$|^ag-novo$)/;
const NUNCA = /(del|rm$|reset|arquiv|apagar|-go$|save|sair|exit|sync|od-|imp$|cifra|pin|lock|demo|wipe|limpar|repor|arrumar|tirar)/;
const out = {ecras: 0, aberturas: 0, erros: [], largos: []};
const b = await chromium.launch(exe ? {executablePath: exe} : {});
for (const [nome, opt] of [['pc', {viewport: {width: 1280, height: 900}}], ['tel', {...devices['Pixel 7']}], ['tel-escuro', {...devices['Pixel 7'], colorScheme: 'dark'}], ['pc-escuro', {viewport: {width: 1280, height: 900}, colorScheme: 'dark'}]]) {
  const c = await b.newContext(opt), p = await c.newPage(); let onde = '';
  p.on('pageerror', e => out.erros.push(`${nome} | ${onde} | ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load resource/.test(m.text())) out.erros.push(`${nome} | ${onde} | consola: ${m.text()}`); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(URL); await p.waitForFunction(() => typeof CFG !== 'undefined' && CFG);
  for (const tab of ['inicio', 'turma', 'avaliar', 'relatorios', 'defs']) { onde = 'vazio:' + tab; await p.evaluate(t => { UI.tab = t; render(); }, tab); }
  await p.evaluate(() => { makeDemo(); makeDemo(); const ts = Object.values(S.turmas); ts[1].nome = 'Exemplo 8.º Y'; ts[1].ano = 8;
    ts.forEach(t => { t.horario = [{d:1, h:'08:30'}, {d:3, h:'10:15'}]; t.plano = {1:[{m:'Voleibol', n:8}, {m:'Ginástica de Solo', n:8}]}; Store.save('turmas', t); });
    const t0 = {id:uid(), nome:'Turma vazia 9.º Z', ciclo:'3', ano:9, escala:'1-5', alunos:[]}; S.turmas[t0.id] = t0; Store.save('turmas', t0);
    CFG.agenda = [{id:'a1', tipo:'reuniao', tit:'Reunião', data:today(), hora:'18:00'}]; UI.turma = ts[0].id; });
  await p.waitForTimeout(300);
  const telas = [{tab:'inicio'}];
  for (const tsub of ['aulas', 'alunos', 'planear']) telas.push({tab:'turma', tsub});
  telas.push({tab:'turma', tsub:'aulas', tvista:'cal'});
  for (const glay of ['tabela', 'coluna', 'cartoes', 'mapa', 'rub', 'aluno']) telas.push({tab:'avaliar', glay});
  for (const pview of ['pauta', 'graf', 'rel', 'fecho']) telas.push({tab:'relatorios', pview});
  for (const dsec of ['turmas', 'ano', 'escola', 'fit', 'sync', 'priv', 'diag', 'grupo', 'lemb', 'dados', 'ver']) telas.push({tab:'defs', dsec});
  for (const atab of ['resumo', 'comp', 'evol', 'fit', 'ass', 'hist']) telas.push({tab:'turma', tsub:'alunos', aluno:1, atab});
  for (const mstep of ['antes', 'durante', 'depois']) telas.push({tab:'turma', tsub:'aula', maula:4, mstep});
  telas.push({tab:'avaliar', vazia:1}, {tab:'turma', tsub:'alunos', vazia:1}, {tab:'relatorios', pview:'graf', vazia:1});
  for (const T of telas) {
    const abrir = () => p.evaluate(T => { const ts = Object.values(S.turmas).sort(byNome); UI.turma = (T.vazia ? ts.find(t => !t.alunos.length) : ts[0]).id; UI.tab = T.tab;
      if (T.tsub) UI.tsub = T.tsub; UI.tvista = T.tvista || null; if (T.glay) { UI.avMode = 'grelha'; UI.glay = T.glay; } if (T.pview) UI.pview = T.pview; if (T.dsec) UI.dsec = T.dsec;
      UI.aluno = T.aluno ? turma().alunos[T.aluno].id : null; if (T.atab) UI.atab = T.atab; if (T.maula) { UI.maula = aulasOf(turma().id)[T.maula].id; UI.mstep = T.mstep; } render(); window.scrollTo(0, 0); }, T);
    onde = JSON.stringify(T); try { await abrir(); } catch (e) { out.erros.push(`${nome} | ${onde} | ${e.message}`); continue; } out.ecras++;
    if (nome.startsWith('tel')) { const largo = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1); if (largo) out.largos.push(`${nome} | ${onde}`); }
    if (nome === 'pc' || nome === 'tel') await p.screenshot({path: `${OUT}/${nome}-${out.ecras}.png`});
    const acoes = await p.evaluate(() => [...new Set([...document.querySelectorAll('#main [data-a], #top [data-a]')].filter(e => e.offsetParent !== null).map(e => e.dataset.a))]);
    for (const a of acoes.filter(a => ABRE.test(a) && !NUNCA.test(a))) {
      onde = JSON.stringify(T) + ' → ' + a; out.aberturas++;
      try { await p.locator(`#main [data-a="${a}"], #top [data-a="${a}"]`).first().click({timeout: 1500}); await p.waitForTimeout(120); }
      catch (e) { if (!/Timeout|not visible|intercept/.test(e.message)) out.erros.push(`${nome} | ${onde} | clique: ${e.message.split('\n')[0]}`); }
      await p.evaluate(() => { try { closeSheet(); } catch (e) {} try { A['print-close'] && A['print-close'](); } catch (e) {} try { A['pj-sair'] && A['pj-sair'](); } catch (e) {}
        const k = document.querySelector('#kiosk'); if (k) { k.remove(); document.body.classList.remove('locked'); } try { if (CONS) consultaSair(); } catch (e) {} });
      await abrir().catch(() => {});
    }
  }
  await c.close();
}
await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify(out, null, 1));
console.log(`Ecrãs: ${out.ecras} · aberturas: ${out.aberturas} · erros de JavaScript: ${out.erros.length} · ecrãs largos no telemóvel: ${out.largos.length}`);
out.erros.slice(0, 20).forEach(e => console.log('  ERRO ' + e)); out.largos.forEach(e => console.log('  LARGO ' + e));
console.log(`Capturas e relatorio.json em ${OUT}`);
process.exit(out.erros.length ? 1 : 0);
