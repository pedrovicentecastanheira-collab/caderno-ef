#!/usr/bin/env bash
# SessionStart: instala as dependências e, nos ambientes na nuvem com o Chromium pré-instalado,
# cria pw.local.config.js para o Playwright usar esse navegador (npx playwright test -c pw.local.config.js).
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -d node_modules/@playwright/test ] || npm ci --no-audit --no-fund >/dev/null 2>&1 || echo "npm ci falhou" >&2
if [ -x /opt/pw-browsers/chromium ] && [ ! -f pw.local.config.js ]; then
  cat > pw.local.config.js <<'CFG'
import base from './playwright.config.js';
const lo = {launchOptions: {executablePath: '/opt/pw-browsers/chromium'}};
export default {...base, use: {...base.use, ...lo}, projects: base.projects.map(p => ({...p, use: {...p.use, ...lo}}))};
CFG
fi
exit 0
