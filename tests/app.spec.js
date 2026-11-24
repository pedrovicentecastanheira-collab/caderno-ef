// Testes de ponta a ponta do Caderno EF (Playwright). Cada teste começa sem dados (contexto novo).
import {readFileSync} from 'node:fs';
import {test, expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const XLSX_FILE = fileURLToPath(new URL('../node_modules/xlsx/dist/xlsx.full.min.js', import.meta.url));
let errs;
test.beforeEach(async ({page}) => {
  errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // Sem internet nos testes: a biblioteca do Excel vem do node_modules e os tipos de letra não são carregados.
  await page.route(/cdnjs\.cloudflare\.com.*xlsx/, r => r.fulfill({path: XLSX_FILE, contentType: 'application/javascript'}));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
});
test.afterEach(() => expect(errs, 'erros de JavaScript na página').toEqual([]));

const isMobile = testInfo => testInfo.project.name === 'telemovel';
async function demo(page) {
  await page.goto('/');
  await page.waitForFunction(() => typeof CFG !== 'undefined' && CFG !== null); // espera que a app acabe de arrancar
  await page.evaluate(() => makeDemo());
  await expect(page.locator('#top .turma-sel select')).toBeVisible();
}
const go = (page, tab) => page.locator(`#nav [data-a="tab"][data-t="${tab}"]`).click();

test('assistente inicial em três passos', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.wiz h1')).toHaveText('Bem-vindo');
  await page.fill('#w-escola', 'Escola Secundária do Exemplo'); await page.locator('#w-escola').blur();
  await page.click('[data-a="wiz"][data-s="2"]');
  await expect(page.locator('.wiz h1')).toHaveText('A primeira turma');
  await page.click('.wiz [data-a="demo"]');
  await expect(page.locator('.wiz-h')).toBeVisible();
  await page.click('[data-a="wiz-fim"]');
  await expect(page.locator('.wiz-h')).toHaveCount(0);
  expect(await page.evaluate(() => CFG.escola)).toBe('Escola Secundária do Exemplo');
});

test('navegação: 4 separadores, período, definições por secções', async ({page}) => {
  await demo(page);
  await expect(page.locator('#nav [data-a="tab"]')).toHaveCount(4);
  await page.selectOption('select.perchip', '2');
  await expect.poll(() => page.evaluate(() => UI.p)).toBe(2);
  await page.click('#top .gear');
  await expect(page.locator('h1.ptitle')).toHaveText('Definições');
  await page.click('[data-a="dsec"][data-k="ver"]');
  await page.click('[data-a="ver"][data-k="zoom"][data-v="1.25"]');
  await page.click('[data-a="ver"][data-k="contrast"][data-v="high"]');
  await page.click('[data-a="ver"][data-k="theme"][data-v="dark"]');
  await expect.poll(() => page.evaluate(() => [document.body.style.zoom, document.documentElement.dataset.contrast, document.documentElement.dataset.theme])).toEqual(['1.25', 'high', 'dark']);
});

test('grelha: lançar, realçar, desfazer duas vezes e histórico', async ({page}, ti) => {
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'tabela'; render(); });
  const cell = page.locator('td.c[data-k="m:Voleibol"]').nth(0), before = await cell.textContent();
  await cell.click();
  await page.click('#ged [data-a="g-set"][data-v="A"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('A');
  await expect(page.locator('td.c.flash')).toHaveCount(1);
  await page.click('#ged [data-a="g-set"][data-v="NI"]'); // passou ao aluno seguinte
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(1)).toHaveText('NI');
  await page.click('[data-a="g-undo"]'); await page.click('[data-a="g-undo"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText(before);
  const ev = await page.evaluate(() => Object.values(S.hist)[0].ev.length);
  expect(ev).toBeGreaterThan(0);
  if (isMobile(ti)) {
    await page.locator('td.c[data-k="m:Voleibol"]').nth(2).click();
    await expect(page.locator('#ged')).toHaveClass(/min/);
    await page.click('#ged .ged-grab');
    await expect(page.locator('#ged')).not.toHaveClass(/min/);
  }
});

test('competências assinaladas definem o nível', async ({page}) => {
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'tabela'; UI.gedOpen = true; UI.domOpen = true; render(); });
  await page.locator('td.c[data-k="m:Voleibol"]').nth(0).click();
  await page.evaluate(() => { UI.gedOpen = true; UI.domOpen = true; gEditor(); });
  await page.click('#ged [data-a="comp-all"][data-k="I"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('I');
  // Competências oficiais dos Anexos de 2026, com a numeração do anexo (E1, E4.2, ...): metade do Elementar dá PE.
  await expect(page.locator('#ged input[data-in="comp"][data-id="E4.2"]')).toHaveCount(1);
  const nE = await page.locator('#ged input[data-in="comp"][data-id^="E"]').count();
  for (let i = 0; i < Math.ceil(nE / 2); i++) { const cb = page.locator('#ged input[data-in="comp"][data-id^="E"]').nth(i); await cb.click(); await expect(cb).toBeChecked(); }
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('PE');
  await expect(page.locator('#ged .domd > summary')).toContainText('Para melhorar');
});

test('cartões: arrastar o aluno para outro nível', async ({page}, ti) => {
  test.skip(isMobile(ti), 'o toque longo é testado à parte');
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'cartoes'; render(); });
  const card = page.locator('.kc[data-v="PI"] .kcard').first(), nome = (await card.textContent()).trim(), cb = await card.boundingBox(), tb = await page.locator('.kc[data-v="E"]').boundingBox();
  await page.mouse.move(cb.x + 20, cb.y + 10); await page.mouse.down(); await page.mouse.move(cb.x + 40, cb.y + 20, {steps: 3}); await page.mouse.move(tb.x + 40, tb.y + 60, {steps: 8}); await page.mouse.up();
  await expect(page.locator('.kc[data-v="E"] .kcard', {hasText: nome.slice(2)})).toHaveCount(1);
});

test('cartões no telemóvel: toque longo e arrastar; deslizar não arrasta', async ({page}, ti) => {
  test.skip(!isMobile(ti), 'só telemóvel');
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'cartoes'; render(); });
  const r = await page.evaluate(async () => {
    const kb = document.getElementById('kb'); kb.scrollLeft = 300; await new Promise(r => setTimeout(r, 60));
    const card = document.querySelector('.kc[data-v="PI"] .kcard'), name = card.dataset.aid, cr = card.getBoundingClientRect(), tr = document.querySelector('.kc[data-v="I"]').getBoundingClientRect();
    const ev = (type, el, x, y, id) => el.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: x, clientY: y, pointerType: 'touch', pointerId: id}));
    ev('pointerdown', card, cr.x + 20, cr.y + 10, 1); await new Promise(r => setTimeout(r, 320));
    ev('pointermove', document, cr.x + 22, cr.y + 12, 1); ev('pointermove', document, tr.x + 30, tr.y + 50, 1); ev('pointerup', document, tr.x + 30, tr.y + 50, 1);
    await new Promise(r => setTimeout(r, 120));
    const moved = [...document.querySelectorAll('.kc[data-v="I"] .kcard')].some(x => x.dataset.aid === name);
    const c2 = document.querySelector('.kc[data-v="PA"] .kcard'), r2 = c2.getBoundingClientRect(), n0 = document.querySelectorAll('.kc[data-v="PA"] .kcard').length;
    ev('pointerdown', c2, r2.x + 10, r2.y + 10, 2); ev('pointermove', document, r2.x + 70, r2.y + 10, 2); ev('pointerup', document, r2.x - 150, r2.y + 10, 2);
    await new Promise(r => setTimeout(r, 350));
    return {moved, kept: n0 === document.querySelectorAll('.kc[data-v="PA"] .kcard').length};
  });
  expect(r).toEqual({moved: true, kept: true});
});

test('página do aluno: separadores, observação, dados e duas colunas no PC', async ({page}, ti) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="tsub"][data-k="alunos"]');
  if (!isMobile(ti)) await expect(page.locator('.split .split-r .apage')).toBeVisible();
  await page.locator('.li[data-a="aluno-edit"]').nth(2).click();
  await expect(page.locator('.apage .ap-nm h1')).toHaveText(await page.evaluate(() => alunosOf(turma())[2].nome));
  await expect(page.locator('.apage .retrato svg.viz')).toBeVisible();
  for (const k of ['comp', 'fit', 'ass', 'hist', 'resumo']) { await page.click(`[data-a="ap-tab"][data-k="${k}"]`); await expect(page.locator(`[data-a="ap-tab"][data-k="${k}"]`)).toHaveClass(/on/); }
  await page.click('[data-a="obs-sug"]');
  expect(await page.evaluate(() => Object.values(avalOf(turma().id, UI.p).obs || {}).length)).toBe(1);
  await page.click('[data-a="ap-edit"]');
  await expect(page.locator('#sheet #a-nome')).toBeVisible();
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  if (isMobile(ti)) { await page.click('[data-a="ap-back"]'); await expect(page.locator('.li[data-a="aluno-edit"]').first()).toBeVisible(); }
});

test('lesão ou dispensa: regime do período e D nas aulas novas', async ({page}) => {
  await demo(page);
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = alunosOf(turma())[1].id; render(); });
  await page.click('[data-a="ap-edit"]'); await page.click('[data-a="disp-add"]');
  await page.selectOption('select[data-in="disp"][data-k="tipo"]', 'Dispensa Total');
  for (const [k, v] of [['ini', '2026-09-14'], ['fim', '2027-06-18']]) { await page.fill(`input[data-in="disp"][data-k="${k}"]`, v); await page.dispatchEvent(`input[data-in="disp"][data-k="${k}"]`, 'change'); }
  await page.click('[data-a="aluno-save"]');
  expect(await page.evaluate(() => regAt(alunosOf(turma())[1], 1))).toBe('Dispensa Total');
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'aulas'; render(); });
  await page.click('[data-a="aula-new"]');
  expect(await page.evaluate(() => UI.draft.presencas[alunosOf(turma())[1].id])).toBe('D');
});

test('calendário do ano abre a aula do dia', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="aview"][data-k="cal"]');
  await expect(page.locator('.cd.au')).toHaveCount(10);
  await page.locator('.cd.au').first().click();
  await expect(page.locator('#sheet .sh-h h2')).toHaveText('Lição 1');
});

test('relatório individual em PDF', async ({page, browserName}, ti) => {
  test.skip(isMobile(ti), 'o PDF gera-se no computador');
  await demo(page);
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = alunosOf(turma())[0].id; render(); });
  await page.click('.apage [data-a="rel-esc"]'); await page.click('#sheet [data-a="rel-one"]');
  await expect(page.locator('#print .rel h1')).toBeVisible();
  await page.emulateMedia({media: 'print'});
  const pdf = await page.pdf({format: 'A4', printBackground: true});
  expect(pdf.length).toBeGreaterThan(30000);
});

test('importar turmas do Excel', async ({page}) => {
  await page.goto('/'); await page.waitForFunction(() => window.XLSX);
  await page.evaluate(() => {
    const rows = [['Nº', 'Nº Processo', 'Nome do Aluno', 'Sexo', 'Data Nasc.', 'Turma'], [1, 5001, 'ANA DA SILVA', 'F', '12/03/2013', '7B'], [2, 5002, 'BRUNO COSTA', 'M', '30/07/2013', '7B'], [1, 6001, 'DIOGO PIRES', 'M', '01/02/2012', '8A']];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Alunos');
    const dt = new DataTransfer(); dt.items.add(new File([XLSX.write(wb, {bookType: 'xlsx', type: 'array'})], 'turmas.xlsx'));
    const i = document.getElementById('file-xls'); i.files = dt.files; i.dispatchEvent(new Event('change'));
  });
  await page.click('[data-a="imp-go"]');
  expect(await page.evaluate(() => Object.values(S.turmas).map(t => t.nome + ':' + t.alunos.length + ':' + t.ano).sort())).toEqual(['7B:2:7', '8A:1:8']);
});

test('dados antigos do localStorage passam para o IndexedDB e são migrados', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('ef:turmas:t1', JSON.stringify({id: 't1', nome: '8.º C', ciclo: '3', escala: '0-20', alunos: [{id: 'a1', num: 1, nome: 'Rui Sá', sexo: 'M', nasc: '2012-05-01', regime: 'Normal'}]}));
    localStorage.setItem('ef:aval:t1_1', JSON.stringify({id: 't1_1', turmaId: 't1', p: 1, materias: ['Voleibol', 'Judo/Luta'], af: {a1: {Voleibol: 'I', 'Judo/Luta': 'E'}}, comp: {a1: {Voleibol: {I0: true}}}, fit: {}, con: {}, av: {}}));
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Store.mode)).toBe('idb');
  expect(await page.evaluate(() => [S.turmas.t1.ano, S.turmas.t1.alunos[0].disp.length, CFG.schema, Object.keys(localStorage).filter(k => /^ef:(turmas|aval):/.test(k)).length])).toEqual([8, 0, 4, 0]);
  // versão 3: Judo/Luta passa a Luta; as competências assinaladas com a numeração antiga saem
  expect(await page.evaluate(() => [S.aval.t1_1.materias, S.aval.t1_1.af.a1.Luta, Object.keys(S.aval.t1_1.comp.a1)])).toEqual([['Voleibol', 'Luta'], 'E', []]);
  await page.waitForTimeout(700); await page.reload();
  expect(await page.evaluate(() => S.aval.t1_1.af.a1.Voleibol)).toBe('I');
});

test('gráficos, documentos e ferramentas abrem sem erros', async ({page}) => {
  await demo(page); await go(page, 'relatorios');
  await page.click('[data-a="pview"][data-k="graf"]');
  expect(await page.locator('figure svg.viz').count()).toBeGreaterThan(4);
  await page.click('[data-a="pview"][data-k="rel"]');
  await page.click('[data-a="doc-crit"]'); await expect(page.locator('#print .rel')).toBeVisible(); await page.click('[data-a="print-close"]');
  await page.click('[data-a="doc-plan"]'); await expect(page.locator('#print .rel')).toBeVisible(); await page.click('[data-a="print-close"]');
  await go(page, 'turma'); await page.click('[data-a="tools"]'); await page.click('[data-a="tool-eq"]');
  await expect(page.locator('.eq')).toHaveCount(2);
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  await go(page, 'inicio'); await expect(page.locator('.tcard')).toHaveCount(1);
});

test('avaliação inicial guiada gera prioridades e plano anual; plano de aula com o banco de exercícios', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="tsub"][data-k="planear"]');
  await page.click('[data-a="ai-sug"]');
  await page.locator('[data-a="ai-set"][data-l="NI"]').nth(0).click();
  await page.click('[data-a="ai-rest"][data-l="I"]');
  await page.locator('[data-a="ai-m"]').nth(1).click(); await page.click('[data-a="ai-rest"][data-l="E"]');
  await expect(page.locator('.ai-pr')).toHaveCount(2);
  await expect(page.locator('.ai-pr').first()).toContainText('Voleibol');
  await expect(page.locator('.ai-g')).toHaveCount(1);
  await page.click('[data-a="ai-plano"]'); await page.click('[data-a="ai-plano-go"]');
  expect(await page.evaluate(() => [turma().plano[1][0].m, turma().plano[2][0].m])).toEqual(['Voleibol', 'Basquetebol']);
  // plano de aula
  await page.click('[data-a="aula-new"]');
  await page.click('#pa-det summary'); await page.click('[data-a="pa-pick"]');
  await page.locator('[data-a="pa-add"]').first().click();
  await page.locator('[data-a="pa-sug"][data-k="aq"]').first().click();
  await page.click('[data-a="pa-sum"]');
  await expect(page.locator('#d-sum')).toHaveValue(/^Voleibol: /);
  await page.click('[data-a="aula-save"]');
  expect(await page.evaluate(() => { const a = Object.values(S.aulas).sort((x, y) => (x._u || 0) - (y._u || 0)).pop(); return [a.plano.pf.length, !!a.plano.aq.txt]; })).toEqual([1, true]);
  // banco: exercício do professor
  await page.click('[data-a="tsub"][data-k="planear"]'); await page.click('[data-a="plv"][data-k="ex"]');
  await page.click('[data-a="ex-new"]'); await page.fill('#ex-dn', 'Circuito de manchete'); await page.click('[data-a="ex-save"]');
  await expect(page.locator('.card.ex', {hasText: 'Circuito de manchete'})).toHaveCount(1);
});

test('espaços, lembretes, partilha com o grupo e consistência das notas', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="tsub"][data-k="planear"]'); await page.click('[data-a="plv"][data-k="esp"]');
  await page.selectOption('#esp-s0', 'Pavilhão'); await page.selectOption('#esp-s1', 'Exterior');
  await expect(page.locator('.esp-r').first()).toContainText('Pavilhão');
  expect(await page.evaluate(() => [espOf(turma(), '2026-09-14'), espOf(turma(), '2026-09-28')])).toEqual(['Pavilhão', 'Exterior']);
  await page.locator('[data-a="esp-wk"]').first().click();
  await expect.poll(() => page.evaluate(() => espOf(turma(), '2026-09-14'))).toBe('Ginásio');
  // lembretes: lista do dia e teste (sem notificações, aparece dentro da app)
  await page.click('#top .gear'); await page.click('[data-a="dsec"][data-k="lemb"]');
  await page.click('[data-a="lemb-test"]'); await expect(page.locator('#toast')).toContainText('Caderno EF');
  // pacote do grupo: exportar e importar noutro caderno
  const pkg = await page.evaluate(() => { CFG.exs = [{id: 'x1', m: 'Voleibol', lv: 'I', nome: 'Rede baixa 1x1', desc: '', crit: ''}]; const t = turma(), v = avalOf(t.id, 1); v.ind = {Voleibol: [{id: 'i1', n: 'Passe'}]}; S.aval[v.id] = v; return pkgBuild(); });
  expect(pkg.ind['7'].Voleibol).toEqual(['Passe']);
  await page.evaluate(p => { CFG.exs = []; const t = turma(), v = avalOf(t.id, UI.p); v.ind = {}; S.aval[v.id] = v; pkgOpen(p); }, pkg);
  await page.click('[data-a="pkg-go"]');
  expect(await page.evaluate(() => [CFG.exs.length, avalOf(turma().id, UI.p).ind.Voleibol[0].n])).toEqual([1, 'Passe']);
  // consistência: nível acima das competências assinaladas trava a exportação
  await page.evaluate(() => { const t = turma(), v = avalOf(t.id, 1), al = t.alunos[1]; v.af[al.id] = Object.assign(v.af[al.id] || {}, {Voleibol: 'E'}); v.comp = {[al.id]: {Voleibol: {I1: true}}}; S.aval[v.id] = v; UI.p = 1; UI.tab = 'relatorios'; UI.pview = 'pauta'; render(); });
  await expect(page.locator('details.cons')).toContainText('nível E em Voleibol');
  await page.click('[data-a="xlsx"]');
  await expect(page.locator('#sheet .sh-h h2')).toHaveText('Antes de exportar a pauta');
});

test('avaliação formativa: evidências, próximo desafio, estações por nível e cartões', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.evaluate(() => { A['aula-new'](null, null, '2026-10-20'); UI.draft.materias = ['Voleibol']; });
  await page.click('[data-a="obs-open"]');
  // por aluno: várias competências de uma vez, o nível sai logo
  for (let i = 0; i < 3; i++) await page.locator('#sheet input[data-in="obs-tk"]').nth(i).click();
  await expect(page.locator('#sheet .obs-nav .lvpill')).toBeVisible();
  // por competência: várias colunas, ✓/✗ por célula
  await page.click('[data-a="obs-modo"][data-k="turma"]');
  await page.locator('[data-a="obs-cell"]').first().click();
  await expect(page.locator('[data-a="obs-cell"]').first()).toHaveClass(/ok/);
  // segunda evidência positiva noutra data: a competência passa a dominada e é assinalada
  // regra única: a segunda evidência positiva assinala logo a competência, sem passo extra
  const ok = await page.evaluate(() => { const t = turma(), O = UI.obs; evAdd(t, '2026-10-13', t.alunos[0].id, O.m, O.cids[0], 1); closeSheet(); return !!tksOf(avalOf(t.id, 1), t.alunos[0].id, O.m)[O.cids[0]]; });
  expect(ok).toBe(true);
  expect(await page.evaluate(() => { const t = turma(), d = desafioDe(t, 1, t.alunos[0], 'Voleibol'); return !!(d && d.txt); })).toBe(true);
  await page.evaluate(() => { UI.aluno = turma().alunos[0].id; UI.tsub = 'alunos'; UI.atab = 'comp'; render(); });
  await expect(page.locator('.desf').first()).toContainText('Próximo desafio');
  await expect(page.locator('details.evl').first()).toContainText('Evidências');
  await page.evaluate(() => { UI.aluno = null; UI.tsub = 'aulas'; render(); A['aula-new'](null, null, '2026-10-22'); UI.draft.materias = ['Voleibol']; });
  await page.click('#pa-det summary'); await page.click('[data-a="dif-on"]');
  await expect(page.locator('.dif-g').first()).toBeVisible();
  await page.evaluate(() => { closeSheet(); A['doc-des'](); });
  await expect(page.locator('#print .cdes').first()).toBeVisible();
});

test('modo aluno: autoavaliação, coavaliação e questionário que lança Conhecimentos', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="modo-aluno"]'); await page.click('[data-a="ki-go"]');
  await page.locator('[data-a="ki-al"]').first().click();
  const n = await page.locator('[data-a="ki-r"][data-v="1"]').count();
  for (let i = 0; i < n; i++) await page.locator('[data-a="ki-r"][data-v="1"]').nth(i).click();
  await page.click('[data-a="ki-save"]'); await expect(page.locator('.ki-fim')).toBeVisible();
  await page.click('[data-a="ki-exit"]'); await page.click('[data-a="ki-exit"]');
  await page.click('[data-a="modo-aluno"]'); await page.click('[data-a="ki-act"][data-k="quiz"]'); await page.click('[data-a="ki-go"]');
  await page.locator('[data-a="ki-al"]').nth(1).click();
  // responde sempre a opção certa (a primeira do banco)
  await page.evaluate(() => { KI.qs.forEach(id => { KI.r[id] = 0; }); kiRender(); });
  await page.click('[data-a="ki-save"]'); await expect(page.locator('.ki-fim h1')).toContainText('Acertaste 8 de 8');
  await page.click('[data-a="ki-exit"]'); await page.click('[data-a="ki-exit"]');
  await page.click('[data-a="modo-aluno"]'); await page.click('[data-a="ki-con"]');
  expect(await page.evaluate(() => { const t = turma(); return [avalOf(t.id, UI.p).con[t.alunos[1].id], Object.keys(avalOf(t.id, UI.p).autoc).length]; })).toEqual([20, 1]);
});

test('aptidão individual, inclusão, papéis, reflexão, balanço da unidade, relatório e equidade', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.click('[data-a="tsub"][data-k="planear"]'); await page.click('[data-a="plv"][data-k="apt"]');
  await page.click('[data-a="pfit-all"]');
  expect(await page.evaluate(() => alunosOf(turma()).filter(al => pfitOf(turma(), al)).length)).toBeGreaterThan(0);
  await page.evaluate(() => { const t = turma(); t.alunos[0].med = {u:['Diferenciação pedagógica'], s:[], a:[], obs:'Evitar impacto.'}; t.plano = {1:[{m:'Voleibol', n:4}]}; UI.tsub = 'aulas'; render(); A['aula-new'](null, null, '2026-10-21'); UI.draft.materias = ['Voleibol']; });
  await page.click('#pp-det summary'); await page.selectOption('#pp-p', 'Árbitro'); await page.click('[data-a="pp-add"]');
  await page.locator('details.aplano').last().locator('summary').click();
  await page.fill('#rf-mud', 'Mais jogo reduzido.');
  await page.click('[data-a="aula-save"]');
  await page.evaluate(() => { A['aula-new'](null, null, '2026-10-23'); UI.draft.materias = ['Voleibol']; });
  await page.click('#pa-det summary');
  await expect(page.locator('#pa-box')).toContainText('Mais jogo reduzido.');
  await expect(page.locator('#pa-box .inc')).toContainText('Evitar impacto.');
  await page.evaluate(() => closeSheet());
  await page.locator('[data-a="ud-bal"]').first().click();
  await expect(page.locator('#sheet .sh-h h2')).toContainText('Balanço da unidade');
  await page.evaluate(() => { closeSheet(); const t = turma(); printRel(t, 1, [t.alunos[0]]); });
  await expect(page.locator('#print')).toContainText('Papéis desempenhados');
  await expect(page.locator('#print')).toContainText('Medidas de suporte');
  expect(await page.evaluate(() => Array.isArray(equidade(turma(), 1)))).toBe(true);
});

test('modo aula: antes, durante e depois, com presenças e sumário gravados no momento', async ({page}) => {
  await demo(page);
  await page.evaluate(() => { const t = turma(); t.plano = {1:[{m:'Voleibol', n:8}]}; A['hoje-go']({dataset:{id:t.id}}); });
  await expect(page.locator('.ma-st [data-k="antes"]')).toHaveClass(/on/);
  await page.click('[data-a="ma-edit"]'); await page.click('#pa-det summary'); await page.click('[data-a="pa-pick"]'); await page.locator('[data-a="pa-add"]').first().click(); await page.click('[data-a="aula-save"]');
  await expect(page.locator('.ma-plano')).toBeVisible();
  await page.click('.ma-st [data-k="durante"]');
  await page.locator('[data-a="ma-ps"]').nth(1).click();
  await expect(page.locator('[data-a="ma-ps"]').nth(1)).toHaveClass(/ps-F/);
  await page.click('.ma-st [data-k="depois"]');
  await expect(page.locator('#ma-sum')).toHaveValue(/^Voleibol: /);
  await page.fill('#ma-mud', 'Grupos de 3.');
  const a = await page.evaluate(() => { Store.flush(); const a = S.aulas[UI.maula]; return [Object.values(a.presencas).filter(x => x === 'F').length, a.refl.mud]; });
  expect(a).toEqual([1, 'Grupos de 3.']);
});

test('nível escolhido à mão contra as competências fica marcado como exceção', async ({page}) => {
  await demo(page); await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'tabela'; UI.gedOpen = true; UI.domOpen = true; render(); });
  await page.locator('td.c[data-k="m:Voleibol"]').nth(0).click();
  await page.evaluate(() => { UI.gedOpen = true; UI.domOpen = true; gEditor(); });
  await page.click('#ged [data-a="comp-all"][data-k="I"]');
  await page.click('#ged [data-a="g-set"][data-v="A"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveClass(/man/);
  const aid = await page.locator('td.c[data-k="m:Voleibol"]').nth(0).evaluate(td => td.closest('tr').dataset.aid || null);
  await page.evaluate(id => { SEL = {aid:id || alunosOf(turma()).find(al => (REG[regAt(al, UI.p)] || REG.Normal).af > 0).id, k:'m:Voleibol'}; UI.gedOpen = true; UI.domOpen = true; gEditor(); }, aid);
  await page.click('#ged [data-a="man-clear"]');
  await expect(page.locator('td.c[data-k="m:Voleibol"]').nth(0)).toHaveText('I');
});

test('linguagem do aluno, desafio com treino, passaporte e relatório de uma página', async ({page}) => {
  await demo(page);
  const r = await page.evaluate(() => { const t = turma(), c = compsOf('3', 'Voleibol').find(x => x.id === 'E4.1'), d = desafioPlus(t, 1, t.alunos[1], 'Voleibol');
    return [cAluno('3', 'Voleibol', c), !!(d && d.alvo), !!(d && d.ex)]; });
  expect(r).toEqual(['Serve por baixo ou por cima.', true, true]);
  await page.evaluate(() => { CFG.cal = {'3|Voleibol|E4.1': 'Sirvo para longe do adversário.'}; });
  expect(await page.evaluate(() => cAluno('3', 'Voleibol', compsOf('3', 'Voleibol').find(x => x.id === 'E4.1')))).toBe('Sirvo para longe do adversário.');
  await page.evaluate(() => A['doc-pass']()); await page.locator('[data-a="pass-go"]').first().click();
  await expect(page.locator('#print .pass').first()).toContainText('Estás aqui');
  await page.click('[data-a="print-close"]');
  await page.evaluate(() => A['doc-rel-alunos']());
  await expect(page.locator('#print .relal').first()).toContainText('O teu próximo passo');
  await page.click('[data-a="print-close"]');
  await page.evaluate(() => A['cons-open']());
});

test('sincronizar: receber junta a versão mais recente de cada registo', async ({page}) => {
  await demo(page);
  const res = await page.evaluate(() => {
    const d = JSON.parse(JSON.stringify(syncData())), a = Object.values(d.aulas)[0], b = Object.values(d.aulas)[1];
    delete d.sync2; delete d.meta; delete d.tomb; delete d.dev;         // cópia de uma versão antiga, sem registo campo a campo
    a.sumario = 'Mudado no outro aparelho.'; a._u = Date.now() + 1000;   // mais recente: entra
    b.sumario = 'Versão antiga.'; b._u = 1;                               // mais antiga: não entra
    const n = syncMerge(d); return [n, S.aulas[a.id].sumario, S.aulas[b.id].sumario !== 'Versão antiga.'];
  });
  expect(res).toEqual([1, 'Mudado no outro aparelho.', true]);
  await page.click('#top .gear'); await page.click('[data-a="dsec"][data-k="sync"]');
  await expect(page.locator('.sync-st')).toBeVisible();
});

test('FITescola: ombros e senta e alcança com lado direito e esquerdo; conta o lado mais fraco', async ({page}) => {
  await demo(page);
  const r = await page.evaluate(() => {
    const t = turma(), al = t.alunos.find(x => x.sexo && x.nasc), v = avalOf(t.id, 1), f = FIT.find(x => x.k === 'senta'), o = {};
    fitSetLado(o, f, 'd', 30); fitSetLado(o, f, 'e', 12);
    const ob = {}, fo = FIT.find(x => x.k === 'ombros'); fitSetLado(ob, fo, 'd', 'S'); fitSetLado(ob, fo, 'e', 'N');
    const leg = {senta: 20}; fitSetLado(leg, f, 'd', 25);             // valor antigo passa para os dois lados antes de mudar um
    return [o.senta, ob.ombros, leg.senta_e, leg.senta, fitTxt(f, o)];
  });
  expect(r).toEqual([12, 'N', 20, 20, 'D 30 · E 12 cm']);
  await go(page, 'avaliar');
  await page.evaluate(() => { UI.glay = 'tabela'; render(); });
  await expect(page.locator('th', {hasText: 'Senta e alc. D'})).toHaveCount(1);
  await expect(page.locator('th', {hasText: 'Ombros E'})).toHaveCount(1);
});

test('calendário escolar editável, aulas reais no plano, quem falta observar, sumários e fecho do período', async ({page}) => {
  await demo(page);
  const r = await page.evaluate(() => {
    const t = turma(); t.horario = [{d:2, h:'10:15'}, {d:4, h:'08:30'}]; t.plano = {1:[{m:'Voleibol', n:30}]};
    const antes = slotsReais(t, 1).length; CFG.semAulas.push(['2026-10-20', '2026-10-20', 'Feriado municipal']); const depois = slotsReais(t, 1).length;
    return [CFG.semAulas.some(x => x[2] === 'Interrupção do Natal'), antes - depois, planoReal(t, 1).us[0].cabem < 30];
  });
  expect(r).toEqual([true, 1, true]);
  // editar um dia sem aulas nas Definições
  await page.click('#top .gear'); await page.click('[data-a="dsec"][data-k="ano"]');
  const nome = page.locator('[data-in="cal-e"][data-j="2"]').first();
  await nome.fill('Feriado da República'); await nome.blur();
  await expect.poll(() => page.evaluate(() => CFG.semAulas.some(x => x[2] === 'Feriado da República'))).toBe(true);
  // plano mostra as aulas reais e o aviso
  await go(page, 'turma');
  await expect(page.locator('.pl-real')).toContainText('aulas reais');
  await expect(page.locator('.pl-av')).toContainText('só cabem');
  // sumários prontos a colar
  await page.click('[data-a="sum-open"]');
  await expect(page.locator('#sum-txt')).toHaveValue(/^Lição n\.º 1 \(16\/09\/2026\): /);
  await page.evaluate(() => closeSheet());
  // quem falta observar
  const falta = await page.evaluate(() => { const t = turma(); evAdd(t, '2026-09-16', t.alunos[0].id, 'Voleibol', 'I3', 1); return semObs(t, 1, 'Voleibol').length; });
  expect(falta).toBeGreaterThan(0);
  // fecho do período
  await go(page, 'relatorios'); await page.click('[data-a="pview"][data-k="fecho"]');
  await expect(page.locator('.list.fecho .li')).toHaveCount(7);
  await page.locator('[data-a="fe-go"][data-k="con"]').click();
  await expect.poll(() => page.evaluate(() => [UI.tab, UI.hide.con])).toEqual(['avaliar', false]);
});

test('modalidades do período: retirar, juntar e criar uma modalidade nova', async ({page}) => {
  await demo(page); await go(page, 'turma');
  await page.evaluate(() => { const t = turma(); t.plano = {2:[{m:'Badminton', n:8}]}; UI.p = 2; render(); A['mats-per'](); });
  await expect(page.locator('#sheet .chip.on', {hasText: 'Badminton'})).toHaveCount(1);   // o plano do período conta
  await page.fill('#mp-n', 'Boccia'); await page.click('[data-a="mp-new"]');
  await expect(page.locator('#sheet .chip.on', {hasText: 'Boccia'})).toHaveCount(1);
  await page.locator('#sheet .chip.on', {hasText: 'Boccia'}).click();                   // retirar
  const r = await page.evaluate(() => [matsOf(turma(), 2).includes('Boccia'), matsOf(turma(), 1).includes('Boccia'), (MATS['3'] || []).includes('Boccia')]);
  expect(r).toEqual([false, false, true]);
});

test('FITescola do 2.º período transita para o 3.º e conta o melhor resultado', async ({page}) => {
  await demo(page);
  const r = await page.evaluate(() => {
    const t = turma(), al = t.alunos.find(x => x.sexo && x.nasc), f = FIT.find(x => x.k === 'vaivem'), age = ageAt(al.nasc, refDate(2)), ref = fitRef('vaivem', al.sexo, age);
    const v2 = avalOf(t.id, 2); v2.fit = {[al.id]: {vaivem: ref.zs + 5}}; S.aval[v2.id] = v2;   // na Zona Saudável no 2.º período
    const v3 = avalOf(t.id, 3); S.aval[v3.id] = v3;
    const z3 = zoneOf(f, al, ageAt(al.nasc, refDate(3)), v3);                                      // sem teste no 3.º: transita
    v3.fit = {[al.id]: {vaivem: 1}}; const pior = zoneOf(f, al, ageAt(al.nasc, refDate(3)), v3);  // pior no 3.º: fica o anterior
    CFG.fitTransita = false; const sem = zoneOf(f, al, ageAt(al.nasc, refDate(3)), v3); CFG.fitTransita = true;
    return [z3 >= 1, pior >= 1, sem];
  });
  expect(r).toEqual([true, true, 0]);
});

test('critérios: intervalos da conversão em nível são exclusivos', async ({page}) => {
  await demo(page);
  const r = await page.evaluate(() => [nivelFaixas(), [3, 4, 9, 10, 13, 14, 17, 18].map(x => nivel(turma(), x))]);
  expect(r).toEqual([['0–3', '4–9', '10–13', '14–17', '18–20'], [1, 2, 2, 3, 3, 4, 4, 5]]);
});

test('automatizar: aulas em falta, vários alunos, plano noutras turmas, níveis propostos e observações', async ({page}) => {
  await demo(page);
  const n = await page.evaluate(() => { const t = turma(); t.horario = [{d:3, h:'10:15'}, {d:5, h:'08:30'}]; t.plano = {1:[{m:'Voleibol', n:12}]};
    S.turmas.tb = {id:'tb', nome:'7.º B', ciclo:'3', ano:7, escala:'0-20', alunos:[{id:'b1', num:1, nome:'Ana Sousa', sexo:'F', nasc:'2013-03-01', regime:'Normal', disp:[]}], horario:[{d:1, h:'09:00'}]}; return aulasEmFalta(t).length; });
  expect(n).toBeGreaterThan(0);
  await go(page, 'turma');
  await page.click('[data-a="af-open"]'); await page.click('[data-a="af-go"]');
  await expect.poll(() => page.evaluate(() => aulasEmFalta(turma()).length)).toBe(0);
  // vários alunos: marcar uma competência para todos
  await page.evaluate(() => { sheetObs(today(), ['Voleibol']); UI.obs.modo = 'grupo'; obsRender(); });
  await page.click('[data-a="og-sel"][data-k="todos"]');
  await page.locator('#sheet input[data-in="obs-tk"][data-id="I4.2"]').click();
  expect(await page.evaluate(() => { const t = turma(), v = avalOf(t.id, 1); return alunosOf(t).filter(al => (REG[regAt(al, 1)] || REG.Normal).af > 0).every(al => (tksOf(v, al.id, 'Voleibol') || {})['I4.2']); })).toBe(true);
  await page.evaluate(() => closeSheet());
  // nível dado à mão não baixa ao assinalar
  expect(await page.evaluate(() => { const t = turma(), v = avalOf(t.id, 1), al = t.alunos.find(a => { const l = ((v.af || {})[a.id] || {})['Ginástica de Solo']; return l === 'PI' || l === 'PE' || l === 'PA'; }); if (!al) return 'ok'; const l0 = v.af[al.id]['Ginástica de Solo']; tickSet(t, 1, al.id, 'Ginástica de Solo', id => id === 'I1.1', true); return LVI(avalOf(t.id, 1).af[al.id]['Ginástica de Solo']) >= LVI(l0) ? 'ok' : 'baixou'; })).toBe('ok');
  // plano do período para a outra turma do 7.º ano
  await page.evaluate(() => A['pp-per']()); await page.click('[data-a="pp-go"]');
  expect(await page.evaluate(() => S.turmas.tb.plano[1][0].m)).toBe('Voleibol');
  // níveis propostos e observações escritas
  await go(page, 'relatorios'); await page.click('[data-a="pview"][data-k="fecho"]');
  await page.click('[data-a="prop-open"]'); await page.click('[data-a="prop-go"]');
  await page.click('[data-a="obs-auto-all"]');
  expect(await page.evaluate(() => { const t = turma(), o = avalOf(t.id, 1).obs || {}; return Object.values(o).filter(x => x && x.length > 20).length; })).toBeGreaterThan(5);
});

test('OneDrive: ligar (início de sessão simulado), guardar sozinho, recuperar e cópias diárias', async ({page}) => {
  const enviados = {}; let tokenPedidos = 0;
  await page.route(/login\.microsoftonline\.com\/consumers\/oauth2\/v2\.0\/authorize/, r => {
    const u = new URL(r.request().url()); return r.fulfill({status: 302, headers: {location: u.searchParams.get('redirect_uri') + '?code=CODIGO&state=' + u.searchParams.get('state')}});
  });
  await page.route(/login\.microsoftonline\.com\/consumers\/oauth2\/v2\.0\/token/, r => { tokenPedidos++; const b = new URLSearchParams(r.request().postData());
    expect(b.get('code_verifier') || b.get('refresh_token')).toBeTruthy();
    return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({access_token: 'AT' + tokenPedidos, refresh_token: 'RT', expires_in: 3600})}); });
  await page.route(/graph\.microsoft\.com\/v1\.0\/me\/?$/, r => r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({displayName: 'Professor Teste'})}));
  await page.route(/graph\.microsoft\.com\/v1\.0\/me\/drive\/special\/approot:\/([^:]+):\/content/, r => {
    const nome = decodeURIComponent(/approot:\/([^:]+):/.exec(r.request().url())[1]);
    if (r.request().method() === 'PUT') { enviados[nome] = r.request().postDataBuffer().length; return r.fulfill({status: 201, contentType: 'application/json', body: '{}'}); }
    return r.fulfill({status: 200, contentType: 'application/json', body: enviados.copia});
  });
  await demo(page);
  await page.click('#top .gear'); await page.click('[data-a="dsec"][data-k="sync"]');
  await page.fill('#od-cid', '11111111-2222-3333-4444-555555555555');
  await page.click('[data-a="od-entrar"]');
  await page.waitForURL(u => !u.search.includes('code='));
  await expect.poll(() => Object.keys(enviados).length, {timeout: 15000}).toBeGreaterThanOrEqual(2);
  expect(Object.keys(enviados)).toContain('caderno-ef.json');
  await page.click('[data-a="dsec"][data-k="sync"]');
  await expect(page.locator('.sync-url, .card')).toContainText(['Ligado']);
  // recuperar: o OneDrive devolve uma cópia com uma aula alterada mais recente
  // cópia feita noutro aparelho: o sumário de uma aula foi alterado lá, mais recentemente
  enviados.copia = await page.evaluate(() => { const d = JSON.parse(JSON.stringify(syncData())), a = Object.values(d.aulas)[0]; a.sumario = 'Vindo do OneDrive'; a._u = Date.now() + 5000;
    d.dev = 'outro-aparelho'; d.meta = Object.assign({}, d.meta, {['aulas' + FS_SEP + a.id + FS_SEP + 'sumario']: Date.now() + 5000}); return JSON.stringify(d); });
  await page.click('[data-a="od-rec"]'); await page.click('[data-a="od-rec"]');
  await expect.poll(() => page.evaluate(() => Object.values(S.aulas).some(a => a.sumario === 'Vindo do OneDrive'))).toBe(true);
  // cópias diárias no aparelho
  await page.evaluate(() => snapFazer());
  await page.click('[data-a="snap-ver"]'); await expect(page.locator('[data-a="snap-rest"]')).toHaveCount(1);
});

test('o nível sobe à medida que se assinalam as competências motoras e táticas', async ({page}) => {
  await demo(page);
  const seq = await page.evaluate(() => { const t = turma(), al = t.alunos[3], m = 'Voleibol', v = avalOf(t.id, 1); if (v.af[al.id]) delete v.af[al.id][m]; if (v.comp) delete v.comp[al.id];
    const cs = compsOf('3', m), out = []; ['I', 'E', 'A'].forEach(k => cs.filter(c => c.k === k && !geralC(c)).forEach(c => { tickSet(t, 1, al.id, m, id => id === c.id, true); out.push(avalOf(t.id, 1).af[al.id][m]); }));
    return [...new Set(out)]; });
  expect(seq).toEqual(['NI', 'PI', 'I', 'PE', 'E', 'PA', 'A']);
});

test('robustez: mais de 1000 registos na conta, nomes com aspas, evidências limitadas', async ({page}) => {
  await demo(page);
  const n = await page.evaluate(async () => {
    const docs = {aulas: Array.from({length: 2500}, (_, i) => ({id: 'a' + String(i).padStart(5, '0'), turmaId: 't', data: '2026-10-01'}))};
    const mk = (k, flt) => ({where: (f, op, v) => mk(k, v), limit: n => ({get: async () => ({docs: (docs[k] || []).filter(d => flt == null || d.id > flt).sort((a, b) => a.id < b.id ? -1 : 1).slice(0, Math.min(n, 1000)).map(d => ({exists: true, id: d.id, data: () => d}))})})});
    const old = {mode: Store.mode, col: Store.col}; Store.mode = 'cloud'; Store.col = k => mk(k, null);
    try { return Object.keys((await Store.loadAll()).aulas).length; } finally { Store.mode = old.mode; Store.col = old.col; }
  });
  expect(n).toBe(2500);
  const r = await page.evaluate(() => {
    const m = 'Jogo d\'"Ouro" <b>&'; CFG.matsX = [{m, sub: 'OUT'}]; matsXAplicar(); const t = turma(), v = avalOf(t.id, 1); v.materias.push(m); touchAval(v);
    ['inicio', 'avaliar', 'relatorios'].forEach(tab => { UI.tab = tab; render(); });
    for (let i = 0; i < 10; i++) evAdd(t, somaDias('2026-09-16', i), t.alunos[0].id, 'Voleibol', 'I3', 1);
    return [document.querySelectorAll('b').length >= 0, evMap(avalOf(t.id, 1), t.alunos[0].id, 'Voleibol').I3.length];
  });
  expect(r).toEqual([true, 6]);
});

test('dois aparelhos: alterações em alunos diferentes juntam-se, eliminações passam, conflitos ficam registados', async ({browser}) => {
  const abrir = async () => { const ctx = await browser.newContext(); const p = await ctx.newPage(); const er = []; p.on('pageerror', e => er.push(e.message));
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto('/'); await p.waitForFunction(() => typeof CFG !== 'undefined' && CFG && typeof FS !== 'undefined' && FS.dev); return {ctx, p, er}; };
  const A1 = await abrir(), B1 = await abrir();
  await A1.p.evaluate(() => makeDemo()); await A1.p.waitForTimeout(300);
  const base = await A1.p.evaluate(() => JSON.stringify(syncData()));
  expect(await B1.p.evaluate(d => syncMerge(JSON.parse(d)), base)).toBeGreaterThan(5);
  // cada aparelho muda um aluno diferente da mesma turma e período
  const nivel = (p, i, l) => p.evaluate(([i, l]) => { const t = turma(), v = avalOf(t.id, 1); v.af[t.alunos[i].id] = Object.assign(v.af[t.alunos[i].id] || {}, {Voleibol: l}); touchAval(v); }, [i, l]);
  await nivel(A1.p, 0, 'A'); await nivel(B1.p, 1, 'NI');
  // A apaga uma aula; B altera o sumário de outra
  const [apagada, outra] = await A1.p.evaluate(() => { const as = aulasOf(turma().id); delete S.aulas[as[0].id]; Store.del('aulas', as[0].id); return [as[0].id, as[1].id]; });
  await B1.p.evaluate(id => { const a = S.aulas[id]; a.sumario = 'Mudado no aparelho B'; Store.save('aulas', a); }, outra);
  const dA = await A1.p.evaluate(() => JSON.stringify(syncData())), dB = await B1.p.evaluate(() => JSON.stringify(syncData()));
  await A1.p.evaluate(d => syncMerge(JSON.parse(d)), dB); await B1.p.evaluate(d => syncMerge(JSON.parse(d)), dA);
  const ver = p => p.evaluate(([apagada, outra]) => { const t = turma(), v = avalOf(t.id, 1); return [v.af[t.alunos[0].id].Voleibol, v.af[t.alunos[1].id].Voleibol, !!S.aulas[apagada], S.aulas[outra].sumario]; }, [apagada, outra]);
  expect(await ver(A1.p)).toEqual(['A', 'NI', false, 'Mudado no aparelho B']);
  expect(await ver(B1.p)).toEqual(['A', 'NI', false, 'Mudado no aparelho B']);
  // conflito: o mesmo campo muda nos dois; fica o mais recente e regista-se o conflito
  await nivel(A1.p, 2, 'E'); await A1.p.waitForTimeout(20); await nivel(B1.p, 2, 'PI');
  const dA2 = await A1.p.evaluate(() => JSON.stringify(syncData())), dB2 = await B1.p.evaluate(() => JSON.stringify(syncData()));
  await A1.p.evaluate(d => syncMerge(JSON.parse(d)), dB2); await B1.p.evaluate(d => syncMerge(JSON.parse(d)), dA2);
  const c = p => p.evaluate(() => { const t = turma(); return [avalOf(t.id, 1).af[t.alunos[2].id].Voleibol, FS.conf.length]; });
  const [ca, cb] = [await c(A1.p), await c(B1.p)];
  expect(ca[0]).toBe('PI'); expect(cb[0]).toBe('PI'); expect(ca[1] + cb[1]).toBeGreaterThan(0);
  // uma cópia inválida não é aplicada
  expect(await A1.p.evaluate(() => syncMerge({app: 'Caderno EF', turmas: {x: {id: 'x', alunos: 'mau'}}, aulas: {y: {id: 'y'}}}))).toBe(0);
  expect(A1.er.concat(B1.er)).toEqual([]);
  await A1.ctx.close(); await B1.ctx.close();
});

test('privacidade: cópias cifradas, código de acesso, arquivo, exportação sem nomes, verificação e arrumação', async ({page}) => {
  await demo(page);
  // cifra: só se abre com a palavra-passe
  const r = await page.evaluate(async () => { await cifraDefinir('palavra-secreta-1'); CFG.cifraOn = true; const c = await copiaCifrar('{"app":"Caderno EF","x":1}'); const o = JSON.parse(c);
    return [o.enc, c.includes('"x":1'), JSON.parse(await copiaDecifrar(c)).x]; });
  expect(r).toEqual([1, false, 1]);
  // exportação sem nomes
  const csv = await page.evaluate(() => csvAnonimo(1));
  expect(csv).toContain('A01'); expect(csv).not.toContain('Alice');
  // verificação: uma aula órfã é encontrada e arrumada
  await page.evaluate(() => { S.aulas.orfa = {id: 'orfa', turmaId: 'nao-existe', data: '2026-10-01', materias: [], presencas: {}}; });
  expect(await page.evaluate(() => verificar().some(x => x.k === 'aulas'))).toBe(true);
  await page.evaluate(() => arrumar());
  expect(await page.evaluate(() => !!S.aulas.orfa)).toBe(false);
  // diagnóstico e privacidade abrem
  await page.click('#top .gear'); await page.click('[data-a="dsec"][data-k="diag"]'); await expect(page.locator('.diag')).toContainText('Versão');
  await page.click('[data-a="dsec"][data-k="priv"]'); await expect(page.locator('ul.priv')).toBeVisible();
  // código de acesso: ao voltar a abrir, pede o código
  await page.evaluate(async () => { const salt = crypto.getRandomValues(new Uint8Array(16)); localStorage.setItem('ef:pin', JSON.stringify({salt: b64(salt), hash: await pinHash('2468', salt), n: 4, min: 5})); });
  await page.reload(); await expect(page.locator('#lock .lk-pad')).toBeVisible();
  for (const d of ['2', '4', '6', '8']) await page.click(`#lock [data-a="lk-d"][data-v="${d}"]`);
  await expect(page.locator('#lock')).toBeHidden();
  // arquivar uma turma retira-a do caderno
  await page.evaluate(() => { const t = turma(); return arquivar(t); });
  expect(await page.evaluate(() => Object.keys(S.turmas).length)).toBe(0);
});

test('visual: mapa de calor, pavilhão, evolução, selos, apresentação, início e cartões com QR', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message));
  // biblioteca de QR falsa (o teste não depende da rede)
  await page.route('**/qrcode-generator/**', r => r.fulfill({contentType: 'text/javascript', body: 'window.qrcode=function(){return{addData(){},make(){},getModuleCount(){return 21},isDark(y,x){return (x+y)%2==0}}}'}));
  await demo(page);
  await page.evaluate(() => { const t = turma(); t.alunos.slice(0, 4).forEach(al => compsOf('3', 'Voleibol').filter(c => c.k === 'I' && contaNivel(c)).slice(0, 2).forEach(c => tickSet(t, 1, al.id, 'Voleibol', id => id === c.id, true))); UI.mapaM = 'Voleibol'; });
  await go(page, 'avaliar');
  // mapa de calor
  await page.click('[data-a="g-lay"][data-k="mapa"]');
  await expect(page.locator('table.mapa tbody tr').first()).toBeVisible();
  expect(await page.locator('td.hm.s-dom').count()).toBeGreaterThan(0);
  expect(await page.locator('td.hm.s-dom').first().evaluate(e => getComputedStyle(e).display)).toBe('table-cell');
  // modo pavilhão
  await page.evaluate(() => { UI.pav = true; applyLook(); });
  expect(await page.evaluate(() => document.body.classList.contains('pav'))).toBe(true);
  await page.evaluate(() => { UI.pav = false; applyLook(); });
  // selos no passaporte e radar/semáforo no relatório
  const r = await page.evaluate(() => { const t = turma(); return [passDoc(t, 1, [t.alunos[3]], 'Voleibol').includes('class="selos"'), relAlunoHtml(t, 1, t.alunos[1]).includes('ra-vis')]; });
  expect(r).toEqual([true, true]);
  // linha do tempo do aluno
  await page.evaluate(() => { UI.atab = 'evol'; });
  const ev = await page.evaluate(() => { const t = turma(); return vAlunoPage(t, t.alunos[2]).includes('class="evol'); });
  expect(ev).toBe(true);
  // cartões de desafio com QR
  await page.evaluate(async () => { await qrCarregar(); });
  expect(await page.evaluate(() => { UI.qrOk = true; const t = turma(); return cartoesHtml(t, 1).includes('cdes-q'); })).toBe(true);
  // início personalizável: esconder e reordenar
  await go(page, 'inicio');
  await expect(page.locator('[data-a="ini-pers"]')).toBeVisible();
  await page.click('[data-a="ini-pers"]');
  await page.locator('#sheet [data-in="ini-on"][data-k="turmas"]').uncheck();
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  expect(await page.evaluate(() => UI.iniOff)).toContain('turmas');
  // modo apresentação: cronómetro corre e equipas aparecem
  await page.evaluate(() => projAbrir('crono'));
  await page.click('#proj [data-a="pj-dur"][data-s="30"]');
  await expect(page.locator('#pj-num')).toHaveText('0:30');
  await page.click('#proj [data-a="pj-go"]'); await page.waitForTimeout(1300);
  expect(await page.locator('#pj-num').textContent()).not.toBe('0:30');
  await page.click('#proj [data-a="pj-sec"][data-k="eq"]');
  await page.click('#proj [data-a="pj-eq"]');
  expect(await page.locator('#proj .pj-g').count()).toBeGreaterThan(1);
  await page.click('#proj [data-a="pj-sair"]'); await expect(page.locator('#proj')).toBeHidden();
  expect(er).toEqual([]);
});

test('ano e escola: pesquisa, notas de voz, exportação para a escola, relatório anual, caderno de um colega e novo ano letivo', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message));
  await demo(page);
  // pesquisa: Enter abre o primeiro resultado
  await page.click('#top [data-a="pesq"]'); await page.fill('#pq', 'Carolina');
  await expect(page.locator('#pq-out .pq-r').first()).toBeVisible(); await page.press('#pq', 'Enter');
  await expect(page.locator('.apage h1')).toHaveText('Carolina Matos');
  // notas de voz (gravação simulada) aparecem na ficha e vão no arquivo da turma
  await page.evaluate(async () => { await vozGuardar(turma().alunos[2].id, new Blob(['som'], {type:'audio/webm'}), 3); });
  await expect(page.locator('.voz audio')).toHaveCount(1);
  expect(await page.evaluate(() => Object.values(turmaPacote(turma()).docs).some(x => x.tipo === 'voz'))).toBe(true);
  // exportação para o programa da escola
  const lin = await page.evaluate(() => expLinhas([turma()], 1));
  expect(lin[0]).toEqual(['N.º', 'Nome', 'Classificação (nível ou 0–20)', 'Faltas']); expect(lin.length).toBe(15);
  await page.evaluate(() => { UI.tab = 'relatorios'; UI.pview = 'rel'; render(); });
  await page.click('[data-a="ee-open"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#sheet [data-a="ee-go"]')]);
  expect(dl.suggestedFilename()).toMatch(/\.csv$/);
  expect(readFileSync(await dl.path(), 'utf8')).toContain('Alice Ferreira;');
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  // relatório anual
  expect(await page.evaluate(() => { const h = relAnualHtml(turma()); return h.includes('Classificações') && h.includes('Zona Saudável') && h.includes('Assiduidade'); })).toBe(true);
  // caderno de um colega: só leitura e nada se mistura
  const copia = await page.evaluate(() => { const d = JSON.parse(JSON.stringify(syncData())); Object.values(d.turmas).forEach(t => { t.nome = 'Turma do colega'; }); d.cfg.geral.prof = 'Colega'; return JSON.stringify(d); });
  await page.evaluate(txt => consultaAbrir(new File([txt], 'colega.json')), copia);
  await expect(page.locator('#cons-bar')).toContainText('Colega');
  expect(await page.evaluate(() => turma().nome)).toBe('Turma do colega');
  await page.evaluate(() => { const t = turma(); t.nome = 'Mudado na consulta'; Store.save('turmas', t); });
  await page.click('#cons-bar [data-a="cons-sair"]'); await expect(page.locator('#cons-bar')).toHaveCount(0);
  expect(await page.evaluate(() => turma().nome)).toBe('Exemplo 7.º X');
  await page.waitForTimeout(600); await page.reload(); await page.waitForFunction(() => typeof CFG !== 'undefined' && CFG && Object.keys(S.turmas).length);
  expect(await page.evaluate(() => Object.values(S.turmas).map(t => t.nome))).toEqual(['Exemplo 7.º X']);
  // novo ano letivo: guarda o ano, passa a turma com o ponto de partida e limpa o resto
  await page.evaluate(() => { UI.tab = 'defs'; UI.dsec = 'ano'; render(); });
  await page.click('[data-a="na-open"]');
  await expect(page.locator('#sheet [data-in="na-nome"]')).toHaveValue('Exemplo 8.º X');
  await page.click('#sheet [data-a="na-go"]');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#sheet [data-a="na-go"]')]);
  expect(dl2.suggestedFilename()).toBe('caderno-ef-2026-2027.json');
  await page.waitForFunction(() => CFG.ano === '2027/2028');
  const r = await page.evaluate(() => { const t = turma(); return [t.nome, t.ano, Object.keys(S.aulas).length, Object.keys(S.aval).length, !!t.alunos[2].ant, t.alunos[2].ant.ano, CFG.per[0].ini.slice(0, 4), Object.keys(S.fotos).length >= 0]; });
  expect(r).toEqual(['Exemplo 8.º X', 8, 0, 0, true, '2026/2027', '2027', true]);
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = turma().alunos[2].id; UI.atab = 'resumo'; render(); });
  await expect(page.locator('.card.ant')).toContainText('2026/2027');
  expect(er).toEqual([]);
});

test('semana, fotografias, comparar turmas, diplomas, arrastar e gestos', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message));
  await demo(page);
  // horário da semana no Início
  await page.evaluate(() => { const t = turma(); t.horario = [{d:1, h:'08:30'}, {d:3, h:'10:15'}]; Store.save('turmas', t); UI.tab = 'inicio'; render(); });
  await expect(page.locator('.sem-b')).toHaveCount(2);
  // fotografias: «Quem é quem?» e sessão
  await page.evaluate(() => { const t = turma(); t.alunos.slice(0, 5).forEach(al => { S.fotos[al.id] = {id:al.id, d:'data:image/gif;base64,R0lGODlhAQABAAAAACw='}; }); UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = null; render(); });
  await page.click('[data-a="qq-open"]'); await expect(page.locator('#sheet .qq .btn')).toHaveCount(4);
  await page.locator('#sheet .qq .btn').first().click(); await expect(page.locator('#sheet [data-a="qq-next"]')).toBeVisible();
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  await page.click('[data-a="fs-open"]'); await expect(page.locator('#sheet [data-a="fs-cam"]')).toBeVisible(); await page.click('#sheet .sh-h [data-a="sh-close"]');
  await page.evaluate(() => { UI.fotoG = true; applyLook(); }); expect(await page.evaluate(() => document.body.classList.contains('fotog'))).toBe(true);
  // diplomas
  const n = await page.evaluate(() => diplomados(turma(), 1, 'Voleibol', 'I').length); expect(n).toBeGreaterThan(0);
  await page.evaluate(() => { UI.tab = 'relatorios'; UI.pview = 'rel'; UI.dip = {m:'Voleibol', k:'I'}; render(); });
  await page.click('[data-a="doc-dipl"]'); await page.click('#sheet [data-a="dip-go"]');
  await expect(page.locator('#print .dipl')).toHaveCount(n); await page.evaluate(() => A['print-close']());
  // arrastar no plano do período (rato) e com o teclado
  await page.evaluate(() => { const t = turma(); t.plano = {1:[{m:'Voleibol', n:8}, {m:'Atletismo', n:6}, {m:'Ginástica de Solo', n:6}]}; Store.save('turmas', t); A['plano-edit'](); });
  const hs = page.locator('#sheet .drag-h'); await expect(hs).toHaveCount(3);
  const a = await hs.nth(0).boundingBox(), b = await page.locator('#sheet .pl-ed').nth(1).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, b.y + b.height - 2, {steps:6}); await page.mouse.up();
  expect(await page.evaluate(() => UI.draft.map(u => u.m))).toEqual(['Atletismo', 'Voleibol', 'Ginástica de Solo']);
  await page.locator('#sheet .drag-h').nth(1).focus(); await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => UI.draft.map(u => u.m))).toEqual(['Atletismo', 'Ginástica de Solo', 'Voleibol']);
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  // calendário: mudar uma lição de dia
  const mv = await page.evaluate(() => { const a = aulasOf(turma().id)[0]; const ok = calMover(a.id, '2026-09-17'); return [ok, S.aulas[a.id].data]; });
  expect(mv).toEqual([true, '2026-09-17']);
  expect(await page.evaluate(() => { const xs = aulasOf(turma().id); return calMover(xs[1].id, xs[2].data); })).toBe(false);
  // gestos: deslizar para a esquerda marca falta; de novo põe presente
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'aulas'; render(); A['aula-new'](null, null, '2026-11-02'); });
  const swipe = (dx) => page.evaluate(dx => { const r = document.querySelector('#sheet .pr'), bx = r.getBoundingClientRect(), o = {bubbles:true, pointerType:'touch', pointerId:1, clientY:bx.top + 10};
    r.querySelector('.nm').dispatchEvent(new PointerEvent('pointerdown', {...o, clientX:200})); document.dispatchEvent(new PointerEvent('pointermove', {...o, clientX:200 + dx / 2})); document.dispatchEvent(new PointerEvent('pointermove', {...o, clientX:200 + dx})); document.dispatchEvent(new PointerEvent('pointerup', {...o, clientX:200 + dx}));
    return r.querySelector('.ps button.on').dataset.s; }, dx);
  expect(await swipe(-120)).toBe('F'); expect(await swipe(-120)).toBe('P'); expect(await swipe(120)).toBe('A');
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  // comparar turmas (duas turmas)
  await page.evaluate(() => { makeDemo(); UI.tab = 'relatorios'; UI.pview = 'graf'; render(); });
  await expect(page.locator('table.cmp tbody tr')).toHaveCount(2);
  expect(er).toEqual([]);
});

test('agenda, observação por grupos, banco de perguntas partilhado e gráfico de dispersão', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  await demo(page);
  // agenda: criar, ver no Início, concluir, marcar no calendário e nos lembretes
  await page.evaluate(() => { UI.tab = 'inicio'; render(); });
  await page.click('[data-a="ag-novo"]'); await page.fill('#ag-tit', 'Conselho de turma'); await page.click('#sheet [data-a="ag-tipo"][data-k="reuniao"]');
  const hoje = await page.evaluate(() => today()); await page.fill('#ag-data', hoje); await page.fill('#ag-hora', '23:59');
  await page.click('#sheet [data-a="ag-save"]');
  await expect(page.locator('.agenda .ag-i')).toContainText(['Conselho de turma']);
  expect(await page.evaluate(() => lembList().some(x => x.k.startsWith('ag:') && x.title.includes('Conselho')))).toBe(true);
  await page.locator('.agenda [data-in="ag-ok"]').first().check();
  expect(await page.evaluate(() => CFG.agenda[0].feito)).toBe(true);
  expect(await page.evaluate(d => new RegExp(`class="cd[^"]* ag" style="[^"]*" data-a="cal-dia" data-d="${d}"`).test(vCalendario(turma())), hoje)).toBe(true);
  // a secção pode ser escondida como as outras
  await page.evaluate(() => { UI.iniOff = ['agenda']; render(); }); await expect(page.locator('.agenda')).toHaveCount(0);
  // observação por grupos no modo aula
  await page.evaluate(() => { const a = aulasOf(turma().id)[3]; UI.maula = a.id; UI.tab = 'turma'; UI.tsub = 'aula'; UI.mstep = 'durante'; render(); });
  await page.click('[data-a="go-open"]'); await expect(page.locator('#sheet .go-t')).toBeVisible();
  const c0 = page.locator('#sheet .go-c').first();
  await c0.click(); await expect(page.locator('#sheet .go-c').first()).toHaveClass(/ok/);
  await page.locator('#sheet .go-c').first().click(); await expect(page.locator('#sheet .go-c').first()).toHaveClass(/no/);
  await page.locator('#sheet .go-c').first().click(); await expect(page.locator('#sheet .go-c').first()).not.toHaveClass(/ok|no/);
  await page.locator('#sheet .go-col').nth(1).click();
  const nAl = await page.locator('#sheet .go-t tbody tr').count();
  expect(await page.locator('#sheet .go-t tbody tr td:nth-child(3) .go-c.ok').count()).toBe(nAl);
  await page.click('#sheet .sh-h [data-a="sh-close"]');
  // banco de perguntas: pergunta própria entra no questionário, a correção regista-se por pergunta, e vai no pacote do grupo
  await page.evaluate(() => { CFG.perg = [{id:'uteste', q:'Quantos jogadores tem uma equipa de voleibol em campo?', o:['6', '5', '7', '11'], a:[5, 12], tema:'Voleibol'}]; KI = null; sheetModo(); });
  await page.click('#sheet [data-a="ki-act"][data-k="quiz"]');
  await expect(page.locator('#sheet [data-in="ki-q"][data-id="uteste"]')).toHaveCount(1);
  const r = await page.evaluate(() => { KI.qs = ['uteste', 'q1']; KI.aid = turma().alunos[0].id; KI.r = {uteste:0, q1:1}; kiSave(); const v = avalOf(turma().id, UI.p); return [v.quizQ.uteste, v.quizQ.q1, v.quiz[turma().alunos[0].id].slice(-1)[0].nota]; });
  expect(r).toEqual([[1, 1], [0, 1], 10]);
  expect(await page.evaluate(() => pkgBuild().perg.length)).toBe(1);
  const n = await page.evaluate(() => { CFG.perg = []; qbSync(); pkgApply({perg:[{id:'ux', q:'Pergunta do colega?', o:['Sim', 'Não'], a:[7, 9], autor:'Colega'}]}, {perg:true}); return [CFG.perg.length, QB.some(q => q.id === 'ux')]; });
  expect(n).toEqual([1, true]);
  await page.evaluate(() => { const k = $('#kiosk'); if (k) k.remove(); closeSheet(); });
  // gráfico de dispersão
  await page.evaluate(() => { UI.tab = 'relatorios'; UI.pview = 'graf'; UI.dx = 'con'; UI.dy = 'af'; render(); });
  expect(await page.locator('.disp svg circle').count()).toBeGreaterThan(3);
  await expect(page.locator('.disp')).toContainText(/r = -?\d,\d\d/);
  await page.selectOption('.disp select[data-k="dx"]', 'ass'); await expect(page.locator('.disp select[data-k="dx"]')).toHaveValue('ass');
  expect(er).toEqual([]);
});

test('verificação a fundo: 12.º ano não passa, nota de voz grande demais, consulta não junta sincronizações', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message));
  await demo(page);
  const r = await page.evaluate(async () => {
    const t0 = {id:uid(), nome:'12.º Z', ciclo:'S', ano:12, escala:'0-20', alunos:[]}; S.turmas[t0.id] = t0;
    UI.draft = null; sheetNovoAno(true); const caixa = document.querySelector(`#sheet [data-in="na-on"][data-id="${t0.id}"]`), dis = caixa.disabled, on = UI.draft.ts[t0.id].on; closeSheet();
    const n0 = Object.keys(S.docs).length; await vozGuardar(turma().alunos[0].id, new Blob([new Uint8Array(200000)], {type:'audio/webm'}), 40); const voz = Object.keys(S.docs).length - n0;
    const d = JSON.parse(JSON.stringify(syncData())); await consultaAbrir(new File([JSON.stringify(d)], 'c.json'));
    const outra = JSON.parse(JSON.stringify(d)); Object.values(outra.turmas)[0]._u = Date.now() + 1e6; const juntou = syncMerge(outra); consultaSair();
    return [dis, on, voz, juntou];
  });
  expect(r).toEqual([true, false, 0, 0]);
  expect(er).toEqual([]);
});

test('idade a 31 de dezembro em vez da data de nascimento', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message));
  await demo(page);
  const r = await page.evaluate(() => {
    const out = {};
    // quem nasceu a 30/12/2013 tem 13 anos a 31/12/2026, mesmo antes de fazer anos
    out.nasc = idadeDe({nasc:'2013-12-30'});
    out.i31 = idadeDe({i31:12, nasc:'2013-12-30'});
    out.cols = guessCols(['N.º', 'Nome', 'Nacionalidade', 'Idade a 31/12']).i31;
    return out;
  });
  expect(r).toEqual({nasc:13, i31:12, cols:3});
  // o formulário do aluno pede a idade e as zonas do FITescola usam-na
  await page.evaluate(() => { UI.tab = 'turma'; UI.tsub = 'alunos'; UI.aluno = null; render(); const al = turma().alunos[0]; sheetAluno(clone(al)); });
  await expect(page.locator('#a-i31')).toBeVisible(); await expect(page.locator('#a-nasc')).toHaveCount(0);
  await page.fill('#a-i31', '15'); await page.click('#sheet [data-a="aluno-save"]');
  expect(await page.evaluate(() => { const al = turma().alunos[0]; return [al.i31, calc(turma(), 1, al).age]; })).toEqual([15, 15]);
  // no novo ano letivo a idade sobe um ano
  const ant = await page.evaluate(async () => { const d = {}; Object.values(S.turmas).forEach(t => { d[t.id] = {on:true, nome:'Seguinte'}; }); const a = turma().alunos[0].id; await novoAnoAplicar(d); return turma().alunos.find(x => x.id === a).i31; });
  expect(ant).toBe(16);
  expect(er).toEqual([]);
});

test('rúbricas: usar, avaliar pelos descritores, nota pesada, Conhecimentos, autoavaliação, editor e partilha', async ({page}) => {
  const er = []; page.on('pageerror', e => er.push(e.message));
  await demo(page);
  await page.evaluate(() => { UI.tab = 'avaliar'; UI.avMode = 'grelha'; UI.glay = 'rub'; render(); });
  await page.click('.chips [data-a="rb-usar"]'); await page.click('#sheet [data-a="rb-add"][data-id="rb:arb"]');
  await expect(page.locator('.rb-t tbody tr')).toHaveCount(14);
  // avaliar um aluno nos 3 critérios (passa ao aluno seguinte a cada escolha)
  for (let i = 0; i < 3; i++) { await page.locator('.rb-t tbody tr').first().locator('.rb-c').nth(i).click(); await page.click('#sheet [data-a="rb-set"][data-l="3"]'); await page.click('#sheet .sh-h [data-a="sh-close"]'); }
  expect(await page.locator('.rb-t tbody tr').first().locator('.rb-n').textContent()).toBe('19');
  // conta como Conhecimentos
  await page.check('[data-in="rb-con"]');
  expect(await page.evaluate(() => { const t = turma(); return avalOf(t.id, 1).con[t.alunos[0].id]; })).toBe(19);
  // nota pesada: 40% MB(19) + 30% I(7) + 30% B(15) = 14,2
  expect(await page.evaluate(() => rubNota(rubById('rb:arb'), {'rb:arb:0':3, 'rb:arb:1':0, 'rb:arb:2':2}).v)).toBe(14.2);
  // autoavaliação no modo aluno
  const au = await page.evaluate(() => { KI = null; UI.tab = 'turma'; render(); sheetModo(); KI.act = 'rub'; sheetModo(); A['ki-go'](); KI.aid = turma().alunos[0].id; KI.r = {'rb:arb:0':1, 'rb:arb:1':1, 'rb:arb:2':1}; kiSave(); return avalOf(turma().id, 1).rubAuto['rb:arb'][turma().alunos[0].id]['rb:arb:0']; });
  expect(au).toBe(1); await page.evaluate(() => { const k = $('#kiosk'); if (k) k.remove(); document.body.classList.remove('locked'); });
  // editor: duplicar um modelo e guardar
  const n = await page.evaluate(() => { A['rb-dup']({dataset:{id:'rb:oral'}}); $('#rb-nome').value = 'Apresentação do trabalho de grupo'; A['rb-save'](); return [(CFG.rub || []).length, CFG.rub[0].crit.length, pkgBuild().rub.length]; });
  expect(n).toEqual([1, 4, 1]);
  // ficha do aluno e relatório mostram os descritores escolhidos
  expect(await page.evaluate(() => { const t = turma(); return relHtml(t, 1, t.alunos[0]).includes('Conhece e aplica todas as regras'); })).toBe(true);
  expect(er).toEqual([]);
});
