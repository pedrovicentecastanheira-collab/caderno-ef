// Servidor estático mínimo da pasta app/ (para os testes e para experimentar localmente).
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
const root = new URL('../app/', import.meta.url).pathname, port = +process.env.PORT || 8770;
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml'};
createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try { const f = join(root, p.endsWith('/') ? p + 'index.html' : p); res.writeHead(200, {'content-type':types[extname(f)] || 'application/octet-stream'}); res.end(await readFile(f)); }
  catch (e) { res.writeHead(404); res.end('não encontrado'); }
}).listen(port, () => console.log('Caderno EF em http://localhost:' + port));
