# GOLDREX

Plataforma de perfil com fotos e vídeos vendidos individualmente (Pix), serviços ao vivo agendados, chat com robô e painel `/admin`. Sem dependências: só o Node.js 18+.

## Rodar
1. Abra a pasta `goldrex` no VS Code e, no terminal, rode `node server.js`.
2. Site: http://localhost:3000 · Painel: http://localhost:3000/admin (ou Ctrl + / no site e a palavra do atalho; padrão `admin`).
3. Opcional: copie `.env.example` para `.env`.

## Primeiro acesso ao /admin
Crie e-mail (ou login) e senha (mín. 8). Você recebe o **código de troca de conta**, que aparece uma única vez. Quem digitar esse código no botão "Trocar de conta" cria um novo acesso e o anterior deixa de valer. Em Acesso você altera sua senha, gera outro código de troca, cria **atendentes** (só veem o Chat) e outros administradores.
Se vier de uma versão anterior: o seu login antigo continua valendo (digite-o no campo e-mail e o código antigo como senha). Pacotes, vídeos e pedidos da versão anterior ficam guardados em `data/db.json` (campo `legacy`) mas não aparecem mais.
Perdeu o acesso? Pare o servidor e rode `node scripts/reset-admin.js`. O script valida o banco, **faz um backup em `data/backups/`** e remove somente os administradores (pedidos, atendentes, conteúdo e configurações ficam intactos). Em seguida inicie o servidor e crie o novo administrador no painel **logo em seguida**, porque a tela de criação fica aberta a quem acessar o painel enquanto não houver administrador. Não edite `data/db.json` à mão: um erro de digitação deixa o arquivo ilegível (nesse caso o servidor se recusa a iniciar para proteger os dados; restaure um arquivo de `data/backups/`).

## Como funciona
- **Perfil (página inicial):** foto, nome, @usuário, bio, selo de verificado, contadores e abas Fotos/Vídeos. Cada foto e cada vídeo tem **preço próprio**. A prévia pública é sempre borrada (gerada no navegador do admin; só a miniatura borrada vira pública, o original fica privado). Vídeos também têm um trecho borrado de 2 s em loop (melhor no Chrome/Edge/Firefox).
- **Entrada 18+:** pede e-mail e confirmação de maioridade (guardado em `leads`). É uma declaração, não verificação documental.
- **Compra:** botão Comprar → janela de Pix com QR Code e copia e cola → "Aguardando confirmação". O conteúdo só é liberado depois da confirmação, na aba Compra e no link de acesso do pedido (`/acesso/<token>`).
- **Confirmação do pagamento:** o Pix comum não avisa o site sozinho. Manual: Compras › Confirmar (exige justificativa, fica no registro). Automática: defina `PIX_WEBHOOK_SECRET` e peça ao seu provedor para chamar `POST /api/webhook/pix` com o cabeçalho `x-webhook-secret` e o corpo `{"txid":"GR<codigo-do-pedido>","valor":29.90}` (depende do provedor, de HTTPS e de o Pix ser gerado por ele com esse identificador). O servidor só confirma se o segredo estiver correto, se o `valor` estiver presente e for **exatamente** o valor do pedido (com centavos) e se o pedido ainda estiver pendente; notificações repetidas são ignoradas e valores ausentes/divergentes são recusados e anotados no registro do painel. Se o seu provedor enviar também um campo `status`/`estado`, ele precisa indicar pagamento concluído.
- **Pix:** painel › Pix. Cole o copia e cola (usado em todos os pedidos, com o valor dentro do código) ou preencha chave, nome do recebedor e cidade (o sistema gera o Pix com o valor de cada item). O QR é gerado dentro do site (`public/js/qr.js`).
- **Ao Vivo e robô (painel):**
  - *Modalidades:* nome, descrição, preço, duração, condições, ativa/inativa e horários. O cliente escolhe, vê o orçamento, confirma ou cancela, e paga por Pix. Horário reservado e não pago volta a ficar livre em 30 min.
  - *Transmissão:* vídeo em loop exibido como "prévia gravada, não é ao vivo".
  - *Robô:* fluxo de mensagens com respostas clicáveis, texto livre, voltar/corrigir, mensagens automáticas e encaminhamento para atendente. O robô se identifica como automático, só informa preços cadastrados e o site só mostra "atendente disponível" quando você marca isso.
- **Personalização:** textos, capa, cores, áreas do site e contadores, com rascunho, visualizar, publicar e cancelar.
- **Chat:** tempo real (SSE) entre visitante e painel.

## Endereço secreto do painel
Por padrão o painel abre em `/admin` (tela de login). Para esconder o endereço, defina `ADMIN_PATH=/painel-x7k2` no `.env`: `/admin` deixa de existir e o atalho Ctrl + / leva ao novo endereço. O login continua sendo a proteção.

## Atualizar sem perder dados
Pare o servidor (Ctrl+C), **faça uma cópia de `data/`, `private/` e `public/uploads/`**, copie os arquivos novos por cima **sem apagar** essas três pastas (nem o `.env`) e rode `node server.js`. Se o `data/db.json` for de uma versão antiga, ele é migrado automaticamente depois de um backup em `data/backups/`. Se o arquivo estiver corrompido, o servidor não inicia e não altera nada.

## Publicar
Na hospedagem defina `HTTPS=true` e `TRUST_PROXY=true` (e `TRUSTED_PROXY_HOPS` se houver mais de um proxy na frente), use disco persistente e faça backup de `data/` e `private/`. O servidor guarda cópias automáticas do banco em `data/backups/` (as 20 mais recentes), mas elas ficam no mesmo disco: copie-as também para fora. Sem `TRUST_PROXY=true` atrás de um proxy, todos os visitantes parecem ter o mesmo IP e os limites de tentativas atingem todo mundo junto. Revise a página `/privacidade` (modelo) com um profissional antes de publicar.

## Segurança (resumo)
- Banco com gravação atômica, validação antes de gravar e backups automáticos; arquivo corrompido nunca vira banco vazio.
- Webhook Pix exige segredo, valor exato e pedido pendente; limites de tentativas nas consultas de pedido, no login e na criação do primeiro administrador.
- Uploads validados por extensão, tipo MIME e assinatura real do arquivo (SVG não é aceito) e gravados em pasta temporária antes do destino.
- Cabeçalhos CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy e HSTS (só com HTTPS=true em conexão HTTPS).

## Licenças
`public/js/qr.js` usa "QRCode for JavaScript" (Kazuhiko Arase, MIT). QR Code é marca registrada da DENSO WAVE.
