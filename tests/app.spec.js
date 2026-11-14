// Testes de ponta a ponta do Caderno EF (Playwright). Cada teste começa sem dados (contexto novo).
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
