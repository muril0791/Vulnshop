# VulnShop — Documento de Contexto Completo (handoff para outra IA)

> **Objetivo deste arquivo:** dar a uma IA todo o contexto necessário para
> entender a estrutura do projeto **VulnShop** e, a partir disso, **guiar o
> usuário no aprendizado de pentest web** (OWASP WSTG v4.2), nível
> iniciante/intermediário. O usuário fala **português**. Guie de forma didática:
> explique a técnica, dê dicas progressivas e só então a solução; incentive
> testar nos 3 níveis (Low → Medium → High) para entender falha, bypass e correção.

---

## 1. O QUE É O PROJETO

**VulnShop** é um **e-commerce fictício deliberadamente vulnerável**, feito para
**treino de pentest web** — no mesmo espírito de **DVWA, OWASP Juice Shop e
WebGoat**. Cada funcionalidade (login, catálogo, busca, avaliações, carrinho,
checkout, perfil, upload, contato, painel admin, GraphQL) é uma **superfície de
ataque** mapeada às técnicas do **OWASP Web Security Testing Guide (WSTG) v4.2**.

- É **educacional** e roda **apenas localmente/isolado**. Nunca deve ir para a internet.
- Todo código vulnerável está **comentado em português** com o marcador
  `// [WSTG-XXX-NN]`, explicando **por que é vulnerável** e **como corrigir**.
- Tem um **seletor global de nível de segurança (Low / Medium / High)** que muda
  o comportamento de cada falha.

---

## 2. AMBIENTE E COMO EXECUTAR (importante — específico desta máquina)

- **SO:** Windows 11, PowerShell. **Node.js v22** instalado.
- **Sem virtualização** no firmware → o **Docker não sobe containers** nesta máquina.
  Por isso o banco **NÃO** roda em Docker; roda **nativo**.
- **Banco:** **MariaDB 12.3** (100% compatível com MySQL para este projeto, mesmo
  driver `mysql2`, mesma SQLi), instalado via `winget`, rodando como **serviço do
  Windows** em `localhost:3306`, usuário **`root`**, senha **`root`**.
  - Cliente: `C:\Program Files\MariaDB 12.3\bin\mysql.exe`
  - Também há um **MongoDB** instalado na máquina (porta 27017), **mas ele está
    OCIOSO** — o VulnShop é 100% SQL; ignore o Mongo.
- **Pasta do projeto:** `C:\Users\Administrador\Documents\vulnshop`
- **`docker-compose.yml` existe** e funcionaria numa máquina COM virtualização,
  mas aqui o fluxo é rodar com Node + MariaDB nativo.

### Rodar (dois terminais)
```powershell
cd C:\Users\Administrador\Documents\vulnshop\backend ;  npm install ; npm start   # API  -> http://localhost:4000
cd C:\Users\Administrador\Documents\vulnshop\frontend ; npm install ; npm run dev  # Loja -> http://localhost:5173
```
- Loja (frontend React): **http://localhost:5173**
- API (backend Express): **http://localhost:4000** (health em `/api/health`)
- GraphQL: **http://localhost:4000/graphql**

### Resetar o banco (reaplica schema + seed)
```powershell
& "C:\Program Files\MariaDB 12.3\bin\mysql.exe" -u root -proot -e "SOURCE C:/Users/Administrador/Documents/vulnshop/db/schema.sql"
& "C:\Program Files\MariaDB 12.3\bin\mysql.exe" -u root -proot -e "SOURCE C:/Users/Administrador/Documents/vulnshop/db/seed.sql"
```

---

## 3. STACK E ARQUITETURA

- **Frontend:** React 18 + Vite + React Router 6 (CSS puro). SPA em `localhost:5173`.
- **Backend:** Node.js + Express 4, API REST + endpoint GraphQL (`graphql` puro).
  Usa `mysql2/promise`, `cookie-parser`, `multer` (upload), `ejs` (SSTI).
- **Banco:** MariaDB/MySQL via `mysql2`.
- **Sessão:** implementação **própria em memória** (Map em `backend/src/sessao.js`),
  cookie `sid`. **Reiniciar o backend derruba todos os logins** (não persiste).
- **Fluxo:** frontend (fetch com `credentials:'include'`) → backend (cada request
  lê `req.nivel` do cookie e `req.usuario` da sessão) → MariaDB.

### Regra didática central (SQLi)
- Consultas **vulneráveis** (Low/Medium) usam **concatenação de string crua**
  (`pool.query('... '+entrada+' ...')`).
- Consultas **seguras** (High) usam **prepared statements** (`pool.execute('... ?', [entrada])`).

---

## 4. SISTEMA DE NÍVEIS (Low / Medium / High)

Há um **seletor no topo da loja** (estilo DVWA). Ele grava o cookie
**`vulnshop_nivel`** (valores `low` | `medium` | `high`, padrão `low`). O backend
lê esse cookie em **cada requisição** via o middleware
`backend/src/middleware/nivelSeguranca.js`, expondo **`req.nivel`**. Cada endpoint
ramifica com `switch (req.nivel)`:

- **Low** → falha crua, sem proteção. Para entender a vulnerabilidade.
- **Medium** → proteção fraca/incompleta (ex.: blacklist contornável). Para treinar **bypass**.
- **High** → implementação **segura/corrigida**. Referência de "como deveria ser".

> Ao trocar o nível no seletor, a página recarrega para aplicar em todas as telas.
> O cookie é **sem HttpOnly de propósito** (para poder inspecioná-lo no DevTools).

---

## 5. ESTRUTURA DE PASTAS (com propósito de cada arquivo)

```
vulnshop/
├── docker-compose.yml          # orquestração (só funciona onde há Docker/virtualização)
├── .env  /  .env.example       # variáveis (DB_HOST, DB_USER=root, DB_PASSWORD=root, DB_NAME=vulnshop, etc.)
├── README.md                   # MANUAL DE TREINO: tabela-índice das ~90 técnicas + cards (dicas/soluções/correções)
├── CONTEXTO-PARA-IA.md         # este arquivo
├── db/
│   ├── schema.sql              # cria o banco e as 8 tabelas
│   └── seed.sql                # popula usuários (admin/admin...), produtos, avaliações, cupons, pedidos
├── comprovantes/
│   └── nota-1001.txt           # arquivo-alvo do Directory Traversal (ATHZ-01)
├── backend/
│   ├── package.json            # deps: express, mysql2, cookie-parser, cors, dotenv, ejs, graphql, multer
│   ├── Dockerfile / .dockerignore
│   ├── uploads/                # avatares enviados (servidos em /uploads) — palco do upload malicioso
│   ├── public/
│   │   ├── robots.txt          # [INFO-03] lista rotas sensíveis
│   │   ├── sitemap.xml         # [INFO-03]
│   │   └── config.js.bak       # [CONF-04] backup com credenciais/segredos falsos
│   └── src/
│       ├── server.js           # monta o app, middlewares globais (CORS/headers/TRACE), registra rotas, handler de erro
│       ├── db.js               # pool mysql2 (multipleStatements: true de propósito) + testarConexao()
│       ├── sessao.js           # store de sessão em memória; gera sid por nível (previsível em Low)
│       ├── estado.js           # Map de tentativas de login (brute force)
│       ├── middleware/
│       │   ├── nivelSeguranca.js  # lê cookie vulnshop_nivel -> req.nivel
│       │   ├── sessao.js          # lê cookie sid -> req.usuario / req.sessao
│       │   └── autorizacao.js     # requerLogin, requerAdmin (Low: sem check; Medium: header X-Admin; High: papel real)
│       └── routes/
│           ├── nivel.js        # GET/POST /api/nivel  (ler/gravar o nível)
│           ├── auth.js         # login, registro, logout, eu, esqueci/resetar senha, pergunta secreta, "continuar"
│           ├── produtos.js     # catálogo + busca (SQLi + XSS refletido)
│           ├── avaliacoes.js   # listar/criar avaliação (XSS armazenado)
│           ├── pedidos.js      # meus pedidos + /:id (IDOR)
│           ├── perfil.js       # ver/editar perfil (escalação por mass assignment) + upload de avatar
│           ├── contato.js      # form de contato com "preview de URL" (SSRF)
│           ├── arquivos.js     # download de comprovante por caminho (Directory Traversal)
│           ├── admin.js        # painel: lista usuários (senhas!), ping (cmd injection), calcular (code injection), CRUD
│           ├── utilitarios.js  # redirect (open redirect), template (SSTI), hpp (parameter pollution)
│           ├── checkout.js     # /api/checkout e /api/cupom/:codigo (regras de negócio)
│           └── graphql.js      # /graphql (introspection, sem auth, IDOR via API)
└── frontend/
    ├── package.json / vite.config.js / index.html   # index.html tem o comentário vazado [INFO-05]
    └── src/
        ├── main.jsx            # providers (AuthProvider, CarrinhoProvider) + Router
        ├── App.jsx             # define TODAS as rotas
        ├── estilos.css
        ├── api/client.js       # cliente HTTP único (todas as chamadas à API)
        ├── contexts/
        │   ├── AuthContext.jsx     # usuário logado, nível; guarda "token" no localStorage em Low/Medium [CLNT-12]
        │   └── CarrinhoContext.jsx # carrinho no localStorage (preço/qtd editáveis)
        ├── components/
        │   ├── Cabecalho.jsx   # nav + busca + seletor de nível + login/logout
        │   ├── SeletorNivel.jsx# troca o nível (grava cookie e recarrega)
        │   └── AvisoTreino.jsx # banner de aviso ético
        └── pages/  (16 telas)
            Home, Sobre, Login, Registro, Recuperar, Produto, Busca, Carrinho,
            Checkout, Pedidos, PedidoDetalhe, Perfil, Contato, Arquivos, Admin,
            ClientSide, GraphQLPage
```

---

## 6. BANCO DE DADOS

### Tabelas (`db/schema.sql`)
- **usuarios**(id, nome, email, usuario, **senha [texto puro]**, papel `enum('cliente','admin')`,
  pergunta_secreta, resposta_secreta, **token_lembrar [MD5(usuario)]**, avatar, criado_em)
- **produtos**(id, nome, descricao [pode conter HTML], preco, categoria, estoque, imagem, criado_em) — **8 colunas** (útil para UNION na SQLi)
- **avaliacoes**(id, produto_id, usuario_id, autor, nota, **comentario [renderizado como HTML em Low/Medium]**, criado_em)
- **pedidos**(id, usuario_id, total, status, endereco, criado_em)
- **itens_pedido**(id, pedido_id, produto_id, nome_produto, quantidade, preco_unitario)
- **cupons**(id, codigo, desconto_percentual, ativo, usos)
- **mensagens_contato**(id, nome, email, mensagem, url_avatar, criado_em)
- **tokens_reset**(id, usuario_id, token, expira_em, usado)
- *Sem FOREIGN KEYs rígidas de propósito (permite IDOR/órfãos).*

### Seed (`db/seed.sql`)
**Usuários (senha em texto puro):**

| id | usuario | senha | papel |
|----|---------|-------|-------|
| 1 | admin | admin | admin |
| 2 | alice | alice123 | cliente |
| 3 | bob | bob123 | cliente |
| 4 | carlos | password | cliente |
| 5 | suporte | suporte123 | admin |

**Produtos:** 10 itens (id 1..10), ex.: 1=Notebook Pro 15, 4=Mouse Gamer RGB
(a descrição do Mouse tem um comentário HTML vazando `suporte:suporte123` — [INFO-05]).
**Cupons:** `BEMVINDO10` (10%), `PROMO50` (50%), `FRETEGRATIS` (5%).
**Pedidos:** #1 e #3 pertencem à **alice (usuario_id=2)**; #2 ao **bob (usuario_id=3)** → base para IDOR.

---

## 7. ENDPOINTS DA API (todos ramificam por nível quando aplicável)

Base: `http://localhost:4000`. O nível vem do cookie `vulnshop_nivel`.

### Nível
- `GET /api/nivel` → `{nivel, niveis}`
- `POST /api/nivel` `{nivel}` → grava o cookie

### Autenticação (`/api/auth`)
- `POST /login` `{usuario, senha, lembrar}` — **SQLi, enumeração, brute force, cookie de sessão, fixation, "lembrar-me"**
- `POST /continuar` — auto-login pelo cookie `lembrar` (token previsível MD5)
- `POST /registro` `{nome,email,usuario,senha,pergunta_secreta,resposta_secreta}` — política de senha/usuário fraca
- `POST /logout` — em Low/Medium **não invalida** a sessão no servidor
- `GET /eu` — quem sou eu (Low expõe sid e objeto de sessão)
- `POST /esqueci-senha` `{usuario}` — token de reset previsível + link com Host header
- `POST /resetar-senha` `{token, nova_senha}`
- `GET /pergunta-secreta?usuario=` / `POST /recuperar-por-pergunta` `{usuario,resposta,nova_senha}`

### Produtos / busca / avaliações
- `GET /api/produtos` — catálogo
- `GET /api/produtos/busca?q=` — **SQLi (concatenação) + termo refletido (XSS)**
- `GET /api/produtos/:id`
- `GET /api/avaliacoes/:produtoId` — lista
- `POST /api/avaliacoes/:produtoId` `{autor,nota,comentario}` — **XSS armazenado**

### Pedidos / perfil
- `GET /api/pedidos` (logado) — meus pedidos
- `GET /api/pedidos/:id` (logado) — **IDOR** (Low/Medium não checam dono)
- `GET /api/perfil` (logado)
- `POST /api/perfil` (logado) — **escalação por mass assignment** (`papel`)
- `POST /api/perfil/avatar` (logado, multipart campo `avatar`) — **upload malicioso**

### Contato / arquivos
- `POST /api/contato` `{nome,email,mensagem,url_preview}` — **SSRF** (servidor busca `url_preview`)
- `GET /api/arquivos/comprovante?file=` — **Directory Traversal**

### Admin (`/api/admin`, via `requerAdmin`)
- `GET /usuarios` — **lista senhas em texto puro + token MD5** (CRYP-03/04)
- `GET /pedidos`, `GET /mensagens`
- `POST /ping` `{host}` — **Command Injection**
- `POST /calcular` `{expr}` — **Code Injection (eval)**
- `POST /produtos`, `PUT /produtos/:id`, `DELETE /produtos/:id`, `DELETE /usuarios/:id`

### Utilitários (`/api/util`)
- `GET /redirect?url=` — **Open Redirect**
- `POST /template` `{template}` — **SSTI (ejs)**
- `GET /hpp?cor=` — demo de **HTTP Parameter Pollution**

### Checkout / cupom
- `GET /api/cupom/:codigo`
- `POST /api/checkout` `{itens:[{produto_id,nome,preco,quantidade}], cupom, endereco}` — **regras de negócio**

### GraphQL / outros
- `POST /graphql` `{query}` — introspection ON, sem auth; queries: `produtos`, `produto(id)`, `usuarios` (vaza senha!), `pedido(id)` (IDOR)
- `GET /api/health` — status
- Estáticos: `/uploads/*`, `/robots.txt`, `/sitemap.xml`, `/config.js.bak`
- **Globais:** headers verbosos `X-Powered-By`/`Server`; **CORS** reflete Origin com credenciais (Low/Medium); **TRACE** habilitado (Low/Medium); headers de segurança (X-Frame-Options/HSTS/CSP) só em High.

---

## 8. CATÁLOGO DE VULNERABILIDADES (com comportamento por nível e payloads)

> Legenda de status: ✅ implementada e testada · 🟡 demonstração/parcial · 📄 conceitual (documentada no README).

### 8.1 Autenticação & Sessão
- **[WSTG-INPV-05] SQL Injection no login** ✅ — `POST /api/auth/login`.
  - Low: query concatenada. **Payload no usuário:** `admin' -- ` (com espaço no fim), senha qualquer. Vira `... WHERE usuario='admin' -- ' AND senha='...'`. Alternativa: `' OR 1=1 -- `.
  - *Atenção didática:* `' OR '1'='1` **sozinho no usuário NÃO funciona** aqui, porque sobra `AND senha='...'` (precedência do AND). Tem que **comentar o resto** com `-- ` ou colocar a injeção pensando no `AND`.
  - Medium: blacklist remove aspas simples (contornável). High: prepared statement.
- **[WSTG-ATHN-02] Credenciais padrão** ✅ — `admin/admin`.
- **[WSTG-IDNT-04] Enumeração de usuários** ✅ — Low/Medium respondem "usuario nao encontrado" vs "senha incorreta"; High é genérico.
- **[WSTG-ATHN-03] Brute force / lockout** ✅ — Low não bloqueia; Medium bloqueio fraco (20 tentativas / 15s); High trava em 5 / 5 min.
- **[WSTG-ATHN-05] "Lembrar-me" previsível** ✅ — cookie `lembrar` = `MD5(usuario)`. Forje `md5("alice")` no cookie e chame `POST /api/auth/continuar` → vira a alice.
- **[WSTG-ATHN-07] Senha fraca / IDNT-05 usuário fraco** ✅ — Low aceita senha "123" e usuário "a"; High exige política.
- **[WSTG-ATHN-08] Pergunta secreta fraca** ✅ — pergunta é pública; respostas triviais; sem limite.
- **[WSTG-ATHN-09] Reset previsível + INPV-17 Host Header** ✅ — Low: token = **id do usuário** (ex.: "1"); o link de reset usa o header `Host` (troque-o no Burp para roubar o token).
- **[WSTG-SESS-02/03/06/07/09] Sessão** ✅ — cookie `sid`: Low é **sequencial** (`sessao-1001`), **sem HttpOnly**, aceita `sid` do cliente (**fixation**), **logout não invalida** no servidor, **sem timeout**. High: aleatório, HttpOnly+SameSite, regenera, TTL 30min, invalida no logout.
- **[WSTG-SESS-04] Variáveis de sessão expostas** ✅ — `GET /api/auth/eu` em Low retorna `sid` e objeto de sessão.
- **[WSTG-SESS-05] CSRF** 🟡 — não há token CSRF e o cookie não é SameSite em Low/Medium; um formulário cross-site que faça `POST /api/perfil` ou `/api/checkout` funcionaria. (Não há página de demo dedicada.)

### 8.2 Autorização
- **[WSTG-ATHZ-04] IDOR** ✅ — `GET /api/pedidos/:id`. Logue como bob e abra `/pedidos/1` (da alice). High confere o dono.
- **[WSTG-ATHZ-03] Escalação (mass assignment)** ✅ — `POST /api/perfil`. Low: `{"papel":"admin"}`. Medium: blacklist **case-sensitive**, então `{"Papel":"admin"}` passa. High: allowlist (só nome/email/pergunta/resposta).
  - *Detalhe técnico:* o backend **sincroniza a sessão** com o papel do banco após o update, então a escalação vale **na hora** (sem precisar relogar).
- **[WSTG-ATHZ-02] Bypass de autorização** ✅ — `/api/admin/*`: Low não checa nada; Medium aceita header `X-Admin: true` (ou `?admin=1`); High exige papel admin real.
- **[WSTG-ATHZ-01] Directory Traversal** ✅ — `GET /api/arquivos/comprovante?file=`. Low: `C:/Windows/win.ini` ou `..\..\..\..\..\..\Windows\win.ini` (Linux: `../../../../etc/passwd`). Medium remove `../` → use `....//` ou `..\`. High: `path.basename` + confinamento.

### 8.3 Input Validation
- **[WSTG-INPV-01] XSS Refletido** ✅ — `/busca`. Payload: `<img src=x onerror=alert(document.cookie)>` (o termo é renderizado sem escapar em Low/Medium).
- **[WSTG-INPV-02] XSS Armazenado** ✅ — avaliação de produto. Mesmo payload; em Medium `<script>` é filtrado → use `onerror`.
- **[WSTG-INPV-05] SQLi na busca (UNION)** ✅ — `x%' UNION SELECT id,usuario,senha,papel,email,1,1,NOW() FROM usuarios -- ` (produtos tem 8 colunas). Dumpa usuários no catálogo.
- **[WSTG-INPV-12] Command Injection** ✅ — Admin → ping. Low (Windows): `127.0.0.1 & whoami` ou `& dir`. Medium remove `; & |`. High: `execFile` sem shell + validação.
- **[WSTG-INPV-11] Code Injection** ✅ — Admin → calcular (eval). Low (RCE): `global.process.mainModule.require('child_process').execSync('whoami').toString()`.
- **[WSTG-INPV-18] SSTI (ejs)** ✅ — `POST /api/util/template`. Teste: `<%= 7*7 %>` → 49. RCE: `<%= global.process.mainModule.require('child_process').execSync('whoami') %>`. Medium bloqueia palavras (process/require/...). High trata a entrada como dado.
- **[WSTG-INPV-19] SSRF** ✅ — `/contato`, campo url_preview. Low: `http://localhost:4000/api/admin/usuarios` ou `http://127.0.0.1:4000/config.js.bak`. Medium bloqueia texto "localhost/127.0.0.1" → use `http://127.1:4000/...` ou `http://0.0.0.0:4000/...`. High: bloqueia IPs internos/privados.
- **[WSTG-INPV-04] HTTP Parameter Pollution** ✅ (demo) — `GET /api/util/hpp?cor=a&cor=b` mostra o valor virar array.
- **[WSTG-INPV-17] Host Header Injection** ✅ — ver reset de senha (8.1).
- **[WSTG-INPV-03] HTTP Verb Tampering** 🟡 — TRACE habilitado (Cross-Site Tracing); métodos PUT/DELETE presentes no admin.

### 8.4 Business Logic (checkout)
- **[WSTG-BUSL-03] Confiar no preço do cliente** ✅ — Low usa o `preco` enviado; edite no carrinho para 0.01.
- **[WSTG-BUSL-01] Quantidade/preço inválidos** ✅ — Low aceita **quantidade negativa** (total fica negativo).
- **[WSTG-BUSL-05] Reuso de cupom** ✅ — Low/Medium não limitam; aplique `PROMO50` (50%) repetidamente. High: cupom de uso único.
- **[WSTG-BUSL-06] Burlar fluxo** ✅ — Low finaliza sem login/endereço. High exige login + endereço.
- **[WSTG-BUSL-08/09] Upload malicioso** ✅ — `/perfil` avatar. Low aceita qualquer tipo; envie `xss.svg` (`<svg onload=alert(1)>`) ou `.html` com `<script>` e abra em `/uploads/<arquivo>` (executa no navegador → XSS armazenado via upload). Medium só bloqueia `.php` → use `.svg` ou `shell.php.png`. High: allowlist de imagem + mimetype + nome aleatório.

### 8.5 Config / Crypto / Error / Info
- **[WSTG-CRYP-03] Senha em texto puro** ✅ e **[CRYP-04] MD5 sem salt** ✅ — visíveis em `/api/admin/usuarios` e no GraphQL.
- **[WSTG-CONF-04] Backup acessível** ✅ — `http://localhost:4000/config.js.bak` (vaza credenciais/segredos falsos).
- **[WSTG-CONF-05] Interface admin exposta** ✅ — `/admin` (e listada no robots.txt).
- **[WSTG-CONF-06] Métodos HTTP** ✅ — TRACE responde em Low/Medium (405 em High).
- **[WSTG-CONF-07] HSTS ausente / CLNT-09 Clickjacking** ✅ — sem X-Frame-Options/HSTS/CSP em Low/Medium.
- **[WSTG-CLNT-07] CORS mal configurado** ✅ — Low/Medium refletem qualquer `Origin` com `Allow-Credentials: true`.
- **[WSTG-INFO-02] Fingerprint por headers** ✅ — `X-Powered-By`, `Server`. **[INFO-03]** robots/sitemap. **[INFO-05]** comentário no `Ctrl+U` da home. **[INFO-09]** banner de versão.
- **[WSTG-ERRH-01/02] Erros/stack trace** ✅ — Low/Medium devolvem `message` + `stack` em erros 500; High é genérico.

### 8.6 Client-side (página `/client-side`)
- **[WSTG-CLNT-01] DOM XSS** ✅ — o texto após `#` na URL vai para `innerHTML`. Teste: `/client-side#<img src=x onerror=alert('domxss')>`.
- **[WSTG-CLNT-11] postMessage** ✅ — handler sem checar `origin` (Low/Medium).
- **[WSTG-CLNT-12] Token no localStorage** ✅ — em Low/Medium o AuthContext grava `vulnshop_token`.
- **[WSTG-CLNT-04] Open Redirect** ✅ — `GET /api/util/redirect?url=https://example.com` (servidor) e `/login?redirect=https://example.com` (cliente). Medium exige a string "vulnshop" (bypass: `https://evil.com/vulnshop`).

### 8.7 API
- **[WSTG-APIT-01] GraphQL** ✅ — `POST /graphql`. Sem auth, sem rate limit, introspection ligada. Queries: `{ usuarios { usuario senha papel } }` (vaza senhas), `{ __schema { types { name } } }`, `{ pedido(id:2){ total endereco } }` (IDOR).

### 8.8 Itens conceituais/documentados (📄 — não demonstráveis de forma realista neste stack)
INPV-06/07/08/09/10 (LDAP/XML/SSI/XPath/IMAP-SMTP), INPV-13/15/16 (format string,
HTTP smuggling/splitting), CRYP-01/02 (TLS/padding oracle), CONF-01/09/10/11,
SESS-08, CLNT-05/08/10/13, ATHN-01/06. A **mecânica** desses está explicada no
README; a técnica é análoga às injeções/falhas já implementadas.

---

## 9. FRONTEND — TELAS (rota → o que demonstra)

- `/` **Home** — catálogo + status (mostra nível ativo e se está logado).
- `/produto/:id` **Produto** — descrição renderizada como HTML (Low/Medium) [HTML injection] + avaliações [XSS armazenado] + adicionar ao carrinho.
- `/busca?q=` **Busca** — termo refletido [XSS refletido] + resultados (SQLi).
- `/login` **Login** — SQLi, creds padrão, enumeração, brute force, `?redirect=` (open redirect).
- `/registro` **Registro** — política de senha/usuário fraca.
- `/recuperar` e `/resetar-senha?token=` **Recuperar** — reset previsível, Host header, pergunta secreta.
- `/carrinho` **Carrinho** — preço e quantidade **editáveis** (client-side).
- `/checkout` **Checkout** — regras de negócio (preço, qtd negativa, reuso de cupom, sem login).
- `/pedidos` **Pedidos** e `/pedidos/:id` **PedidoDetalhe** — IDOR.
- `/perfil` **Perfil** — botão "tentar virar admin" (mass assignment) + upload de avatar.
- `/contato` **Contato** — SSRF (campo URL de preview).
- `/arquivos` **Arquivos** — download de comprovante (Directory Traversal).
- `/admin` **Admin** — usuários com senha em texto puro, ping (cmd injection), calculadora (code injection), mensagens.
- `/client-side` **ClientSide** — DOM XSS, postMessage, localStorage, open redirect, clickjacking.
- `/graphql` **GraphQLPage** — textarea para rodar queries (dump usuários, introspection, IDOR).
- `/sobre` **Sobre** — explica níveis e propósito.

O **cabeçalho** tem: busca, links de navegação, área de login/logout e o **seletor de nível**.

---

## 10. RESSALVAS / “PEGADINHAS” (para a IA guia saber)

1. **Rodar = 2 comandos** (backend + frontend), não `docker compose up` (sem virtualização nesta máquina). MariaDB nativo já roda como serviço.
2. **Sessões são em memória** — reiniciar o backend **desloga todo mundo**. Isso é esperado.
3. **SQLi de login precisa comentar o resto** (`admin' -- ` com espaço), porque há `AND senha`. `' OR '1'='1` puro no usuário não basta.
4. **Escalação de privilégio já sincroniza a sessão** — vira admin na hora (não precisa relogar). Para acessar `/admin` como não-admin, lembre que em **Low** o admin nem é checado (qualquer um entra).
5. **Upload `.php` não "executa"** (não há PHP no servidor). O impacto real aqui é **XSS via `.svg`/`.html`** servidos em `/uploads/`. Explique o conceito de webshell à parte.
6. **Trocar o nível recarrega a página**; o cookie `vulnshop_nivel` controla tudo. Sem cookie = Low.
7. **CSRF (SESS-05)** e **Verb Tampering (INPV-03)** são mais "leves" (ausência de proteção / TRACE), sem página de demo dedicada.
8. **Não foi feito walkthrough visual das 16 telas** uma a uma em navegador; o backend foi validado por API e o frontend por build de produção. Se algo não renderizar, provavelmente é um erro pontual de runtime fácil de corrigir.
9. Contas: `admin/admin`, `alice/alice123`, `bob/bob123`, `carlos/password`, `suporte/suporte123`.

---

## 11. COMO A IA DEVE GUIAR O APRENDIZADO (sugestão)

**Método:** para cada desafio — (1) explique a **técnica de pentest** e por que a
falha existe; (2) dê **dicas progressivas** antes da solução; (3) mostre o
**payload**; (4) peça para o usuário **repetir em Medium** (bypass) e ver em
**High** (correção); (5) explique a **causa raiz** e a **correção segura**.

**Ordem sugerida (do mais didático ao mais avançado):**
1. **Reconhecimento** (INFO/CONF): headers, `/robots.txt`, `/config.js.bak`, `Ctrl+U`.
2. **Autenticação** (ATHN/IDNT): creds padrão → enumeração → SQLi no login → brute force.
3. **Sessão** (SESS): atributos de cookie, ID previsível, logout, fixation.
4. **Autorização** (ATHZ): IDOR → escalação (mass assignment) → traversal.
5. **Input Validation** (INPV): XSS refletido → armazenado → SQLi UNION → command/code injection → SSTI → SSRF.
6. **Business Logic** (BUSL): preço/quantidade → cupom → upload.
7. **Client-side / API / Crypto** (CLNT/APIT/CRYP): DOM XSS, CORS, clickjacking, localStorage, GraphQL, senhas em texto puro.

**Ferramentas úteis para o usuário:** DevTools (Network/Application/Console),
`curl`/PowerShell `Invoke-RestMethod`, e um proxy como **Burp Suite** para editar
requisições (headers como `Host` e `X-Admin`, e o cookie `sid`).

**Fonte de verdade dos desafios:** o arquivo **`README.md`** do projeto tem a
tabela-índice das ~90 técnicas + um **card por vulnerabilidade** (Onde / Objetivo /
Dica 1 / Dica 2 / Solução / Correção). Use-o como roteiro.

---

## 12. RESUMO DE 1 PARÁGRAFO (para colar rápido)

VulnShop é um e-commerce React (Vite, :5173) + Node/Express (:4000) + MariaDB
(:3306, root/root) deliberadamente vulnerável para treino de OWASP WSTG v4.2, com
um seletor global de nível Low/Medium/High (cookie `vulnshop_nivel`, lido como
`req.nivel`, com `switch` em cada endpoint) que alterna entre falha crua, bypass
de proteção fraca e correção segura. Cobre ~90 técnicas WSTG (a maioria
implementada; infra é documentada): SQLi (login `admin' -- ` e busca UNION), XSS
refletido/armazenado/DOM, IDOR (`/pedidos/:id`), escalação por mass assignment
(`papel`), directory traversal, command/code injection e SSTI (painel/`/api/util`),
SSRF (`/contato`), open redirect, upload malicioso, regras de negócio no checkout,
CORS/clickjacking/headers, senhas em texto puro/MD5, e GraphQL sem auth. Roda em
2 comandos (`npm start` no backend, `npm run dev` no frontend); o banco já está de
pé como serviço do Windows. O README.md é o manual com dicas e soluções.

---

## 13. ATUALIZAÇÕES — fechamento 100% (novas falhas e ferramentas)

Depois da entrega inicial, foram adicionados/promovidos:

**Novos endpoints backend:**
- `POST /api/injecoes/ssi` `{texto}` — **[INPV-08] SSI Injection** (era conceitual → ✅).
  Low processa `<!--#exec cmd="...">` (RCE), `<!--#include file="...">` (LFI), `<!--#echo var="...">`. High escapa.
- `POST /api/injecoes/xpath` `{usuario,senha}` — **[INPV-09] XPath Injection** (✅). Payload na **senha**: `' or '1'='1`. High usa literal escapado.
- `GET/POST/PUT /api/verbo/promover/:id` — **[INPV-03] Verb Tampering** (✅). POST protegido; **PUT não é checado em Low/Medium** (bypass). Há também `X-HTTP-Method-Override` (POST→PUT) em Low/Medium.

**CSRF [SESS-05] agora implementado (✅):**
- `backend/src/middleware/csrf.js` — só no **High** exige `X-CSRF-Token` (igual ao `req.sessao.csrf`) em métodos mutantes. Low/Medium: sem proteção.
- O token é gerado no login e devolvido em `login`/`continuar`/`eu` (campo `csrf`). O frontend (`api/client.js` + `AuthContext`) guarda e envia em `X-CSRF-Token`.
- Rotas "ferramenta" (`/api/injecoes`, `/api/util`, `/api/contato`) são isentas de CSRF (stateless; a defesa delas é a própria lógica High).
- **Detalhe:** portas diferentes são o MESMO site → o cookie `sid` é enviado de `:4444`; por isso o diferencial é o **token**, não o SameSite (SameSite fica conceitual).

**Site do atacante (origem externa):** pasta `atacante/` com `servir.js` (Node puro, porta **4444**) e `csrf.html`, `cors.html`, `clickjacking.html`. Suba com `node atacante/servir.js`. Alvo do clickjacking: `backend/public/painel-frame.html` (recebe `X-Frame-Options` só em High).

**Frontend:** nova página **`/extras`** (Extras.jsx) com SSI, XPath e verb tampering + links do site do atacante. Produtos agora têm **imagens** (SVG por categoria em `src/imagens.js`).

**Subir com um comando:** `package.json` na raiz com `npm run dev` (usa `concurrently`) — sobe backend + frontend juntos. Alternativa: `iniciar.ps1`.

**Testes automatizados:** `testes/smoke.ps1` (reseta o banco e valida ~28 falhas; passa 28/28) e `testes/upload.mjs` (upload de avatar). Rodar: `powershell -ExecutionPolicy Bypass -File testes\smoke.ps1`.

**Status atualizado:** SESS-05, INPV-03, INPV-08 e INPV-09 passaram para **✅**. Continuam conceituais (📄): INPV-06 (LDAP), INPV-07 (XML/XXE — exigiria parser nativo com build tools), INPV-10 (IMAP/SMTP), CRYP-01/02 (TLS/padding), e os itens de infra. A única ressalva de verificação: o walkthrough visual das telas não foi feito clicando uma a uma em navegador (validado por build + transforms do Vite + testes de API).
