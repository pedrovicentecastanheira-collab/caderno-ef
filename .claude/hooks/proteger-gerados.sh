#!/usr/bin/env bash
# PreToolUse (Edit|Write): app/index.html e artifact/index.html são gerados pelo build; não se editam à mão.
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  */app/index.html|*/artifact/index.html|app/index.html|artifact/index.html)
    echo "Este ficheiro é gerado por build.mjs. Edite o código em src/js ou src/css (ou src/index.html); o build atualiza-o." >&2; exit 2 ;;
esac
exit 0
