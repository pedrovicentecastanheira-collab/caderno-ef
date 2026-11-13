#!/usr/bin/env python3
"""Extrai as competências por matéria e nível dos Anexos 2, 3 e 4 das Aprendizagens Essenciais
de Educação Física (DGE, março de 2026) e escreve src/js/00a-competencias-ae2026.js.

Uso: python3 tools/extrair_anexos.py <pasta-com-os-pdf>
Os PDF descarregam-se de https://www.dge.mec.pt/sites/default/files/anexoN_educacao_fisica.pdf (N = 2, 3, 4).
Precisa do pdftotext (poppler-utils)."""
import json, re, subprocess, sys
from pathlib import Path

NOMES = {'GINÁSTICA NO SOLO': 'Ginástica de Solo', 'GINÁSTICA DE SOLO': 'Ginástica de Solo', 'GINÁSTICA DE APARELHOS': 'Ginástica de Aparelhos (Trampolins)',
         'DESPORTOS DE DISCO (ULTIMATE FRISBEE)': 'Ultimate Frisbee', 'SOFTBOL/BEISEBOL': 'Softbol', 'JOGOS TRADICIONAIS POPULARES': 'Jogos Tradicionais Populares',
         'TÉNIS DE MESA': 'Ténis de Mesa', 'KIN-BALL': 'Kin-Ball', 'RUGBY T1': 'Rugby T1', 'JOGO DO PAU PORTUGUÊS': 'Jogo do Pau Português',
         'MONTANHISMO/ESCALADA': 'Montanhismo/Escalada', 'CAMPISMO/PIONEIRISMO': 'Campismo/Pioneirismo', 'CORRIDAS EM PATINS': 'Corrida de Patins'}
MIN = {'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'à', 'com'}
def nome(s):
    s = re.sub(r'\s+', ' ', s.strip())
    return NOMES.get(s) or ' '.join(w.lower() if i and w.lower() in MIN else w.capitalize() for i, w in enumerate(s.split(' ')))
HEAD = re.compile(r'^\s*([A-ZÁÀÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÀÉÍÓÚÂÊÔÃÕÇ0-9 ()/\-]+?)\s*[-–]\s*Nível\s+(Introdução|Elementar|Avançado)\s*$')
ITEM = re.compile(r'^\s*(\d+(?:\.\d+)*)\.\s+(.*)$')
NIV = {'Introdução': 'I', 'Elementar': 'E', 'Avançado': 'A'}
def limpa(t): return re.sub(r'\s+', ' ', t).replace(' ,', ',').strip()
def extrai(txt):
    out, cur, items, last, alt = {}, None, None, None, False
    ordem = {'n': [], 'a': []}
    def fecha():
        if cur and items is not None and cur not in out.get(cur[0], {}): pass
    for ln in txt.split('\n'):
        if 'MATÉRIAS ALTERNATIVAS' in ln: alt = True
        if 'ARTICULAÇÃO COM O PERFIL DOS ALUNO' in ln or re.match(r'^\s*PÁG\. \d+\s*$', ln) or not ln.strip(): continue
        if re.match(r'^\s*(MATÉRIAS (NUCLEARES|ALTERNATIVAS)|Especificação das Aprendizagens|matérias de cada subdomínio|[A-ZÁÉÍÓÚÇ ]{4,}$)', ln) and not HEAD.match(ln):
            last = None; continue
        m = HEAD.match(ln)
        if m:
            mat, k = nome(m.group(1)), NIV[m.group(2)]
            if mat not in out: ordem['a' if alt else 'n'].append(mat)
            d = out.setdefault(mat, {})
            if k in d: cur = None; items = None; last = None; continue  # repetido: fica a primeira ocorrência
            items = d[k] = []; cur = (mat, k); last = None; continue
        if items is None or ln.strip() == '(o aluno)': continue
        m = ITEM.match(ln)
        if m and len(m.group(1)) <= 7:
            last = {'n': m.group(1), 't': m.group(2)}; items.append(last); continue
        if last is not None: last['t'] += ' ' + ln.strip().lstrip('§').strip()
    # guardam-se todos os itens com a numeração original; os que têm subitens servem de contexto (ver compsOf na app)
    res = {}
    for mat, lv in out.items():
        for k, its in lv.items(): res.setdefault(mat, {})[k] = [[i['n'], limpa(i['t'])] for i in its]
    return res, ordem
pasta = Path(sys.argv[1]); dados = {}; ordens = {}
for ciclo, n in (('2', 2), ('3', 3), ('S', 4)):
    txt = subprocess.run(['pdftotext', '-layout', str(pasta / f'anexo{n}_educacao_fisica.pdf'), '-'], capture_output=True, text=True).stdout
    dados[ciclo], ordens[ciclo] = extrai(txt)
sujos = [(c, m, i[0]) for c, d in dados.items() for m, lv in d.items() for its in lv.values() for i in its if re.search(r'ANEXO \d|PÁG\.|ARTICULAÇÃO', i[1])]
print('itens com restos de paginação:', sujos[:5], len(sujos))
# O 2.º ciclo e o secundário guardam "=3" num nível igual ao do 3.º ciclo.
for c in ('2', 'S'):
    for m, lv in dados[c].items():
        for k in list(lv):
            if dados['3'].get(m, {}).get(k) == lv[k]: lv[k] = '=3'
destino = Path(__file__).resolve().parent.parent / 'src/js/00a-competencias-ae2026.js'
destino.write_text('/* ---------- competências oficiais por matéria e nível ---------- */\n'
  '// Gerado por tools/extrair_anexos.py a partir dos Anexos 2, 3 e 4 das Aprendizagens Essenciais de Educação Física (DGE, março de 2026).\n'
  '// Não editar à mão. Estrutura: AE26[ciclo][matéria][I|E|A] = [["4.1", "texto"], ...] ou "=3" (nível igual ao do 3.º ciclo).\n'
  '// AE26M[ciclo] = {n: matérias nucleares, a: matérias alternativas}, pela ordem dos anexos.\n'
  'const AE26M = ' + json.dumps(ordens, ensure_ascii=False, separators=(',', ':')) + ';\n'
  'const AE26 = ' + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
for c, d in dados.items():
    print(c, len(d), 'matérias;', sum(1 for v in d.values() for x in v.values() if x == '=3'), 'níveis iguais ao 3.º ciclo')
print(destino, destino.stat().st_size, 'bytes')
