/* ---------- Perfil dos Alunos à Saída da Escolaridade Obrigatória ---------- */
const PA = {A:'Linguagens e textos', B:'Informação e comunicação', C:'Raciocínio e resolução de problemas', D:'Pensamento crítico e pensamento criativo', E:'Relacionamento interpessoal', F:'Desenvolvimento pessoal e autonomia', G:'Bem-estar, saúde e ambiente', H:'Sensibilidade estética e artística', I:'Saber científico, técnico e tecnológico', J:'Consciência e domínio do corpo'};
// Proposta de ligação dos domínios e critérios às áreas de competência (o grupo de EF pode ajustar nos critérios da escola).
const PAD = {af:'C D E H J', apf:'G J', con:'A B G I', pont:'F', mat:'F', resp:'E', emp:'F', lid:'E F'};
const paTags = k => PAD[k].split(' ').map(x => `<span class="pa" title="${esc(PA[x])}">${x}</span>`).join('');

