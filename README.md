# 🛒 VulnShop — Laboratório de Pentest Web (OWASP WSTG v4.2)

> ## ⚠️ AMBIENTE DE TREINO DELIBERADAMENTE VULNERÁVEL
> Contém **falhas de segurança intencionais** para fins **educacionais**.
> **NÃO EXPONHA NA INTERNET.** Rode **apenas na sua máquina**, isolada, e ataque
> **somente esta aplicação**. Nunca use estas técnicas contra sistemas de terceiros.
> No mesmo espírito de **DVWA**, **OWASP Juice Shop** e **WebGoat**.

E-commerce fictício para praticar as técnicas do **OWASP Web Security Testing
Guide (WSTG) v4.2**. Cada funcionalidade (login, carrinho, avaliações, upload,
busca, admin, contato…) é uma **superfície de ataque**. Todo código vulnerável
está comentado com o `WSTG-ID`, o **porquê** da falha e a **correção** (nível High).

---

## 🧱 Stack

| Camada | Tecnologia |
|--------|-----------|
| Front-end | React (Vite) + React Router |
| Back-end | Node.js + Express (REST + GraphQL) |
| Banco | MySQL / **MariaDB** (driver `mysql2`) |
| Orquestração | Docker Compose (quando há virtualização) |

---

## 🚀 Como executar

### ✅ Setup validado nesta máquina (sem Docker / sem virtualização)

A virtualização está **desativada no firmware**, então o *engine* do Docker não
sobe containers. O banco roda **nativo**: **MariaDB 12.3** (compatível com MySQL)
instalado via `winget`, como serviço em `localhost:3306` (root/root), com
`db/schema.sql` + `db/seed.sql` já aplicados.

**Rodar (dois terminais):**
```powershell
cd backend ;  npm install ; npm start      # API   -> http://localhost:4000
cd frontend ; npm install ; npm run dev    # Loja  -> http://localhost:5173
```

**Ou suba com um comando** (usa `concurrently`; rode `npm install` na raiz uma vez):
```powershell
npm install ; npm run dev
```
_(Alternativa: `.\iniciar.ps1` abre backend e frontend em janelas separadas.)_

**Resetar o banco (reaplica schema + seed):**
```powershell
& "C:\Program Files\MariaDB 12.3\bin\mysql.exe" -u root -proot -e "SOURCE C:/Users/Administrador/Documents/vulnshop/db/schema.sql"
& "C:\Program Files\MariaDB 12.3\bin\mysql.exe" -u root -proot -e "SOURCE C:/Users/Administrador/Documents/vulnshop/db/seed.sql"
```

### 🐳 Alternativa — Docker (em máquina com virtualização ligada)
```bash
docker compose up --build
```
> _O MongoDB que porventura esteja instalado (porta 27017) fica ocioso — este
> projeto é 100% SQL._

---

## 🎚️ Seletor de nível (Low / Medium / High)

No topo da loja há um seletor global (estilo DVWA) que grava o cookie
`vulnshop_nivel`, lido pelo backend em **cada requisição** (`req.nivel`).

| Nível | Comportamento |
|-------|---------------|
| **Low** | Falha crua, sem proteção. Entenda a vulnerabilidade. |
| **Medium** | Proteção fraca/incompleta (blacklist). Treine o *bypass*. |
| **High** | Implementação segura/corrigida. Referência de "como fazer". |

Cada endpoint ramifica com `switch (req.nivel)` — veja os comentários no código.

---

## 👤 Contas de exemplo (seed)

| Usuário | Senha | Papel |
|---------|-------|-------|
| `admin` | `admin` | admin |
| `alice` | `alice123` | cliente |
| `bob` | `bob123` | cliente |
| `carlos` | `password` | cliente |
| `suporte` | `suporte123` | admin |

> As senhas ficam em **texto puro** no banco de propósito (WSTG-CRYP-03).

---

## 📇 Tabela-índice das ~90 técnicas WSTG

**Status:** ✅ implementada · 🟡 simulada/demonstração · 📄 conceitual/documentada

### Information Gathering (INFO)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| INFO-01 | Recon por buscadores | 📄 | (não aplicável a app local) |
| INFO-02 | Fingerprint do servidor (headers) | ✅ | headers `X-Powered-By` / `Server` |
| INFO-03 | Metadados/metafiles | ✅ | `/robots.txt`, `/sitemap.xml` |
| INFO-04 | Enumeração de aplicações | 📄 | rotas listadas abaixo |
| INFO-05 | Vazamento em comentários HTML/JS | ✅ | `Ctrl+U` na home |
| INFO-06 | Pontos de entrada | 📄 | seção "Rotas" |
| INFO-07 | Mapeamento de caminhos de execução | 📄 | conceitual |
| INFO-08 | Fingerprint do framework | ✅ | headers revelam Express |
| INFO-09 | Fingerprint da aplicação | ✅ | banner de versão `v0.2.0` |
| INFO-10 | Mapa da arquitetura | 📄 | seção "Estrutura" |

### Configuration & Deployment (CONF)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| CONF-01 | Infra de rede | 📄 | conceitual |
| CONF-02 | Config da plataforma | 📄 | conceitual |
| CONF-03 | Tratamento de extensões | ✅ | upload de avatar |
| CONF-04 | Arquivos de backup | ✅ | `/config.js.bak` |
| CONF-05 | Interfaces administrativas | ✅ | `/admin`, `robots.txt` |
| CONF-06 | Métodos HTTP perigosos | ✅ | `TRACE` habilitado |
| CONF-07 | HSTS ausente | ✅ | headers (Low/Medium) |
| CONF-08 | Política cross-domain | ✅ | CORS (ver CLNT-07) |
| CONF-09 | Permissões de arquivo | 📄 | conceitual |
| CONF-10 | Subdomain takeover | 📄 | conceitual |
| CONF-11 | Cloud storage | 📄 | conceitual |

### Identity Management (IDNT)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| IDNT-01 | Definição de papéis | 📄 | `cliente`/`admin` |
| IDNT-02 | Processo de registro | ✅ | `/registro` |
| IDNT-03 | Provisionamento de conta | 📄 | conceitual |
| IDNT-04 | Enumeração de usuários | ✅ | erro do login |
| IDNT-05 | Nome de usuário fraco | ✅ | `/registro` |

### Authentication (ATHN)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| ATHN-01 | Credenciais em canal não cripto | 📄 | HTTP local |
| ATHN-02 | Credenciais padrão | ✅ | `admin/admin` |
| ATHN-03 | Lockout ausente (brute force) | ✅ | `/login` |
| ATHN-04 | Bypass de autenticação | ✅ | SQLi no login |
| ATHN-05 | "Lembrar senha" previsível | ✅ | cookie `lembrar` (MD5) |
| ATHN-06 | Cache do navegador | 📄 | conceitual |
| ATHN-07 | Política de senha fraca | ✅ | `/registro` |
| ATHN-08 | Pergunta secreta fraca | ✅ | `/recuperar` |
| ATHN-09 | Reset de senha inseguro | ✅ | `/recuperar` |
| ATHN-10 | Auth fraca em canal alt. (API) | ✅ | GraphQL / REST sem auth |

### Authorization (ATHZ)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| ATHZ-01 | Directory Traversal / LFI | ✅ | `/arquivos` |
| ATHZ-02 | Bypass de autorização | ✅ | `/admin` (header X-Admin) |
| ATHZ-03 | Escalação de privilégio | ✅ | `/perfil` (mass assignment) |
| ATHZ-04 | IDOR | ✅ | `/pedidos/:id` |

### Session Management (SESS)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| SESS-01 | Esquema de sessão | ✅ | `sessao.js` |
| SESS-02 | Atributos de cookie | ✅ | cookie `sid` |
| SESS-03 | Session fixation | ✅ | login (Low) |
| SESS-04 | Variáveis de sessão expostas | ✅ | `/api/auth/eu` |
| SESS-05 | CSRF | ✅ | site do atacante (`:4444`) |
| SESS-06 | Logout não invalida | ✅ | `/api/auth/logout` |
| SESS-07 | Timeout ausente | ✅ | sessão (Low/Medium) |
| SESS-08 | Session puzzling | 📄 | conceitual |
| SESS-09 | Session ID previsível | ✅ | `sid` sequencial (Low) |

### Input Validation (INPV)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| INPV-01 | XSS Refletido | ✅ | `/busca` |
| INPV-02 | XSS Armazenado | ✅ | avaliações do produto |
| INPV-03 | HTTP Verb Tampering | ✅ | `/api/verbo` (PUT) |
| INPV-04 | HTTP Parameter Pollution | ✅ | `/api/util/hpp` |
| INPV-05 | SQL Injection | ✅ | login e busca |
| INPV-06 | LDAP Injection | 📄 | conceitual |
| INPV-07 | XML Injection | 📄 | conceitual |
| INPV-08 | SSI Injection | ✅ | `/extras` |
| INPV-09 | XPath Injection | ✅ | `/extras` |
| INPV-10 | IMAP/SMTP Injection | 📄 | conceitual |
| INPV-11 | Code Injection | ✅ | admin → calculadora |
| INPV-12 | Command Injection | ✅ | admin → ping |
| INPV-13 | Format String | 📄 | conceitual |
| INPV-14 | Vulnerabilidade incubada | 🟡 | XSS via upload |
| INPV-15 | HTTP Splitting/Smuggling | 📄 | conceitual |
| INPV-16 | Requisições HTTP entrantes | 📄 | conceitual |
| INPV-17 | Host Header Injection | ✅ | link de reset |
| INPV-18 | SSTI | ✅ | `/api/util/template` |
| INPV-19 | SSRF | ✅ | `/contato` |

### Error Handling (ERRH)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| ERRH-01 | Tratamento de erro impróprio | ✅ | handler global |
| ERRH-02 | Stack trace vazando | ✅ | qualquer erro 500 (Low) |

### Cryptography (CRYP)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| CRYP-01 | TLS fraco | 📄 | conceitual (HTTP local) |
| CRYP-02 | Padding oracle | 📄 | conceitual |
| CRYP-03 | Dados sensíveis sem cripto | ✅ | senha texto puro |
| CRYP-04 | Criptografia fraca (MD5) | ✅ | token `lembrar` |

### Business Logic (BUSL)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| BUSL-01 | Validação de negócio | ✅ | checkout (qtd/preço) |
| BUSL-02 | Forjar requisições | 🟡 | checkout (API direta) |
| BUSL-03 | Checagem de integridade | ✅ | preço do cliente |
| BUSL-04 | Timing de processo | 📄 | conceitual |
| BUSL-05 | Limite de uso de função | ✅ | reuso de cupom |
| BUSL-06 | Burlar fluxo de trabalho | ✅ | checkout sem etapas |
| BUSL-07 | Defesa contra abuso | 📄 | rate limit ausente |
| BUSL-08 | Upload de tipo inesperado | ✅ | avatar |
| BUSL-09 | Upload malicioso | ✅ | avatar `.svg`/`.html` |

### Client-side (CLNT)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| CLNT-01 | DOM-based XSS | ✅ | `/client-side` (hash) |
| CLNT-02 | Execução de JS | ✅ | DOM XSS / eval |
| CLNT-03 | HTML Injection | ✅ | descrição do produto |
| CLNT-04 | Open Redirect | ✅ | `?redirect=` / `/api/util/redirect` |
| CLNT-05 | CSS Injection | 📄 | conceitual |
| CLNT-06 | Manipulação client-side | 🟡 | carrinho no localStorage |
| CLNT-07 | CORS mal configurado | ✅ | cabeçalhos CORS |
| CLNT-08 | Cross-site flashing | 📄 | conceitual (sem Flash) |
| CLNT-09 | Clickjacking | ✅ | falta `X-Frame-Options` |
| CLNT-10 | WebSockets | 📄 | conceitual |
| CLNT-11 | Web Messaging (postMessage) | ✅ | `/client-side` |
| CLNT-12 | Armazenamento no navegador | ✅ | token no localStorage |
| CLNT-13 | Cross-Site Script Inclusion | 📄 | conceitual |

### API (APIT)
| ID | Técnica | Status | Onde |
|----|---------|--------|------|
| APIT-01 | Testes de API/GraphQL | ✅ | `/graphql` |

---

## 🎯 Desafios (cards)

> Dica geral: use o **DevTools** (Network/Application/Console) e uma ferramenta
> como **Burp**/**curl** para editar requisições. Troque o **nível** no topo.

### [WSTG-INPV-05] SQL Injection no login
- **Onde:** `/login` (POST `/api/auth/login`).
- **Objetivo:** autenticar como admin sem saber a senha.
- **Dica 1:** o que uma aspa simples (`'`) faz no campo usuário?
- **Dica 2:** encerre a string e comente o resto da query.
- **Solução:** usuário `admin' -- ` (com espaço no fim) e senha qualquer. Vira:
  `... WHERE usuario='admin' -- ' AND senha='...'`. Outro: `' OR 1=1 -- `.
- **Correção (High):** *prepared statement* `pool.execute('... WHERE usuario=? AND senha=?', [u,p])`.

### [WSTG-INPV-05] SQL Injection na busca (UNION)
- **Onde:** `/busca` (GET `/api/produtos/busca?q=`).
- **Objetivo:** extrair a tabela de usuários pelo catálogo.
- **Dica:** a query usa `LIKE '%<q>%'`. A tabela `produtos` tem 8 colunas.
- **Solução:** `x%' UNION SELECT id,usuario,senha,papel,email,1,1,NOW() FROM usuarios -- `.
- **Correção (High):** `LIKE ?` com *prepared statement*.

### [WSTG-ATHN-02] Credenciais padrão
- **Onde:** `/login`. **Objetivo:** entrar como admin. **Solução:** `admin/admin`.
- **Correção:** remover contas padrão; forçar troca no 1º acesso.

### [WSTG-IDNT-04] Enumeração de usuários
- **Onde:** `/login`. **Objetivo:** descobrir usuários válidos.
- **Solução:** compare "usuario nao encontrado" vs "senha incorreta".
- **Correção (High):** mensagem genérica ("credenciais invalidas").

### [WSTG-ATHN-03] Brute force (lockout ausente)
- **Onde:** `/login`. **Objetivo:** testar muitas senhas sem bloqueio.
- **Solução (Low):** repita o POST — nunca bloqueia. **Correção (High):** trava após 5 falhas.

### [WSTG-ATHN-05] "Lembrar-me" previsível
- **Onde:** cookie `lembrar` + POST `/api/auth/continuar`.
- **Solução:** o token é `MD5(usuario)`. Calcule `md5("alice")` e ponha no cookie `lembrar` → vira a Alice.
- **Correção (High):** token aleatório persistido, cookie HttpOnly.

### [WSTG-ATHN-09 / INPV-17] Reset previsível + Host Header Injection
- **Onde:** `/recuperar` (POST `/api/auth/esqueci-senha`).
- **Solução:** em Low o token é o **ID** do usuário (ex.: `1`). O link usa o header `Host` — troque-o (Burp) para roubar o token.
- **Correção (High):** token aleatório de 256 bits; host fixo por config.

### [WSTG-ATHN-08] Pergunta secreta fraca
- **Onde:** `/recuperar`. **Solução:** a pergunta é pública e as respostas são triviais; sem limite de tentativas.

### [WSTG-SESS-02/03/06/07/09] Sessão
- **Onde:** cookie `sid`. **Explore:** ID sequencial (`sessao-1001` → tente `-1000`); sem `HttpOnly` (roubável por XSS); logout não invalida no servidor; sem timeout; aceita `sid` do cliente (fixation).
- **Correção (High):** `sid` aleatório, `HttpOnly`+`SameSite`, regenerar no login, TTL, invalidar no logout.

### [WSTG-ATHZ-04] IDOR em pedidos
- **Onde:** `/pedidos/:id`. **Solução:** logue como `bob` e abra `/pedidos/1` (pedido da Alice).
- **Correção (High):** conferir `pedido.usuario_id === req.usuario.id`.

### [WSTG-ATHZ-03] Escalação de privilégio (mass assignment)
- **Onde:** `/perfil` (POST `/api/perfil`).
- **Solução:** envie `{"papel":"admin"}` (Low). Em Medium a blacklist é *case-sensitive* → use `{"Papel":"admin"}`.
- **Correção (High):** *allowlist* de campos (`nome`,`email`); `papel` nunca vem do body.

### [WSTG-ATHZ-02] Bypass de autorização (admin)
- **Onde:** `/admin` e `/api/admin/*`. **Solução:** Low não checa nada; Medium aceita header `X-Admin: true`.
- **Correção (High):** checar `req.usuario.papel === 'admin'` no servidor.

### [WSTG-ATHZ-01] Directory Traversal
- **Onde:** `/arquivos` (GET `/api/arquivos/comprovante?file=`).
- **Solução (Low):** `C:/Windows/win.ini` ou `..\..\..\..\..\..\Windows\win.ini` (Linux: `../../../../etc/passwd`). Medium remove `../` → use `....//` ou `..\`.
- **Correção (High):** `path.basename()` + confinar dentro da pasta base.

### [WSTG-INPV-01] XSS Refletido
- **Onde:** `/busca`. **Solução:** buscar `<img src=x onerror=alert(document.cookie)>`.
- **Correção (High):** renderizar como texto (React escapa por padrão; não usar `dangerouslySetInnerHTML`).

### [WSTG-INPV-02] XSS Armazenado
- **Onde:** avaliações do produto. **Solução:** comentário `<img src=x onerror=alert(document.cookie)>`. Medium filtra `<script>` → use `onerror`.
- **Correção (High):** *output encoding* (exibir como texto).

### [WSTG-INPV-12] Command Injection
- **Onde:** `/admin` → "ping". **Solução (Low, Windows):** `127.0.0.1 & whoami` ou `& dir`.
- **Correção (High):** validar host + `execFile` (sem shell).

### [WSTG-INPV-11] Code Injection
- **Onde:** `/admin` → "calculadora". **Solução (Low):** `global.process.mainModule.require('child_process').execSync('whoami').toString()`.
- **Correção (High):** nunca `eval`; validar entrada.

### [WSTG-INPV-18] SSTI
- **Onde:** POST `/api/util/template`. **Solução:** `<%= 7*7 %>` → 49; RCE: `<%= global.process.mainModule.require('child_process').execSync('whoami') %>`. Medium bloqueia palavras — contorne.
- **Correção (High):** template fixo; entrada só como dado.

### [WSTG-INPV-19] SSRF
- **Onde:** `/contato` (campo "URL para preview"). **Solução:** `http://localhost:4000/api/admin/usuarios` ou `http://127.0.0.1:4000/config.js.bak`. Medium bloqueia texto "localhost/127.0.0.1" → use `http://127.1:4000/...`.
- **Correção (High):** allowlist de esquema + bloquear IPs internos/privados.

### [WSTG-CLNT-04] Open Redirect
- **Onde:** `/login?redirect=` (cliente) e `/api/util/redirect?url=` (servidor).
- **Solução:** `?redirect=https://example.com`. Medium exige conter "vulnshop" → `https://evil.com/vulnshop`.
- **Correção (High):** só caminhos relativos internos.

### [WSTG-BUSL-01/03/05/06] Lógica de negócio (checkout)
- **Onde:** `/carrinho` + `/checkout`. **Solução (Low):** edite o **preço** no carrinho (0.01), use **quantidade negativa**, reaplique **`PROMO50`** várias vezes, finalize **sem login**.
- **Correção (High):** recalcular preço no servidor, validar qtd>0, cupom de uso único, exigir login/endereço.

### [WSTG-BUSL-08/09] Upload malicioso
- **Onde:** `/perfil` → avatar. **Solução (Low):** envie `xss.svg` com `<svg onload=alert(1)>` ou `.html` com `<script>`; abra em `/uploads/`. Medium só bloqueia `.php` → use `.svg` ou `shell.php.png`.
- **Correção (High):** allowlist de extensão + mimetype (idealmente *magic bytes*), nome aleatório.

### [WSTG-CRYP-03/04] Criptografia
- **Onde:** `/admin` → usuários (ou GraphQL). **Solução:** senhas em **texto puro** e token `lembrar` em **MD5 sem salt** (crackável).
- **Correção:** `bcrypt`/`argon2` com salt para senhas; tokens aleatórios.

### [WSTG-CLNT-01/11/12] Client-side
- **Onde:** `/client-side`. **Solução:** DOM XSS via `#<img src=x onerror=alert(1)>`; `postMessage` sem checar origem; token sensível no `localStorage`.
- **Correção (High):** `textContent` em vez de `innerHTML`; validar `event.origin`; não guardar segredo no storage.

### [WSTG-CLNT-07 / CLNT-09 / CONF-06/07] Config & headers
- **CORS:** Low/Medium refletem qualquer `Origin` com credenciais. **Clickjacking:** falta `X-Frame-Options`/CSP. **TRACE** habilitado. **HSTS** ausente.
- **Correção (High):** CORS restrito, `X-Frame-Options: DENY`, CSP, bloquear TRACE, HSTS.

### [WSTG-CONF-04/05 · INFO-02/03/05] Reconhecimento
- **Solução:** `/config.js.bak` (credenciais!), `/robots.txt` e `/sitemap.xml` (rotas sensíveis), comentário no `Ctrl+U` da home, headers `X-Powered-By`/`Server`.

### [WSTG-APIT-01] GraphQL
- **Onde:** `/graphql`. **Solução:** `{ usuarios { usuario senha papel } }` (sem auth), introspection `{ __schema { types { name } } }`, IDOR `{ pedido(id:2){ total endereco } }`.
- **Correção:** desabilitar introspection em prod, exigir auth/autorização, rate limit.

---

### [WSTG-SESS-05] CSRF (com site do atacante)
- **Onde:** site do atacante em `http://localhost:4444` (rode `node atacante/servir.js`).
- **Objetivo:** forçar a vítima logada a virar admin sem consentimento.
- **Solução:** logado no VulnShop, abra `csrf.html` — um `POST` forjado a `/api/perfil` com `papel=admin` é aceito em Low/Medium (o cookie de sessão viaja junto e não há token). Em High → **403** (falta `X-CSRF-Token`).
- **Correção (High):** token anti-CSRF por sessão exigido em requisições mutantes.

### [WSTG-INPV-08] SSI Injection
- **Onde:** `/extras` (POST `/api/injecoes/ssi`).
- **Solução (Low):** `<!--#exec cmd="whoami"-->` (RCE) · `<!--#include file="C:/Windows/win.ini"-->` (LFI).
- **Correção (High):** tratar a entrada como texto (não processar diretivas).

### [WSTG-INPV-09] XPath Injection
- **Onde:** `/extras` (POST `/api/injecoes/xpath`) — "login" sobre um XML.
- **Dica:** mesma pegadinha do login SQL — ponha a injeção no campo **senha** (o `and` do usuário fica neutralizado).
- **Solução:** senha = `' or '1'='1` → autentica como admin.
- **Correção (High):** literais escapados / consulta parametrizada.

### [WSTG-INPV-03] HTTP Verb Tampering
- **Onde:** `/extras` ou `PUT /api/verbo/promover/:id`.
- **Solução:** o `POST` é protegido, mas o `PUT` **não** é checado em Low/Medium → promova um usuário a admin via PUT. Também há `X-HTTP-Method-Override` (POST→PUT).
- **Correção (High):** autorização aplicada a **todos** os métodos.

---

## 😈 Site do atacante (origem externa `:4444`)

Para os ataques cross-origin ficarem realistas, há um mini-site atacante:
```powershell
node atacante/servir.js      # -> http://localhost:4444
```
Estando **logado** no VulnShop, abra: `csrf.html` (SESS-05), `cors.html` (CLNT-07 — rouba
seus dados), `clickjacking.html` (CLNT-09 — embute `painel-frame.html` em iframe).
Em **High** os três falham (token CSRF, CORS restrito, `X-Frame-Options`).

## ✅ Reverificação automática (smoke test)

```powershell
# com o backend no ar:
powershell -ExecutionPolicy Bypass -File testes\smoke.ps1
```
Reseta o banco e exercita ~28 falhas (SQLi, IDOR, priv-esc L/M/H, cmd/code/SSTI/SSI/XPath,
SSRF, cupom, CSRF, verb tampering, CORS, TRACE, GraphQL, open redirect…). O upload de
avatar tem teste próprio: `node testes/upload.mjs`.

## 📄 Itens conceituais (como praticar)

Estes não são demonstráveis de forma realista neste stack local, mas o README
explica a técnica:

- **INPV-06/07/10 (LDAP/XML/IMAP-SMTP):** injeções em back-ends que o VulnShop
  não usa (sem LDAP/servidor de e-mail local). A **mecânica** é a mesma das
  injeções já implementadas. _(SSI e XPath agora são demonstráveis em `/extras`.)_
- **INPV-13/15/16 (format string, HTTP smuggling/splitting):** dependem do
  servidor/proxy; conceituais aqui.
- **CRYP-01/02 (TLS/padding oracle):** exigem HTTPS/serviço cripto — o lab é HTTP.
- **CONF-01/09/10/11, SESS-08, CLNT-05/08/10/13:** infra/cenários fora do escopo local.

---

## 🗺️ Roadmap (concluído)

- [x] **Fase 0** — Scaffolding
- [x] **Fase 1** — Autenticação & Sessão
- [x] **Fase 2** — Input Validation
- [x] **Fase 3** — Authorization & Business Logic
- [x] **Fase 4** — Client-side, API, Config & Crypto
- [x] **Fase 5** — Documentação (este manual)
- [x] **Fechamento 100%** — CSRF (site atacante), SSI/XPath, verb tampering, imagens, um comando, suíte de testes

---

## 📁 Estrutura

```
vulnshop/
├── docker-compose.yml
├── .env / .env.example
├── db/            schema.sql · seed.sql
├── comprovantes/  nota-1001.txt   (alvo de path traversal)
├── backend/
│   ├── public/    robots.txt · sitemap.xml · config.js.bak
│   ├── uploads/   avatares enviados (servidos em /uploads)
│   └── src/
│       ├── server.js · db.js · sessao.js · estado.js
│       ├── middleware/  nivelSeguranca · sessao · autorizacao
│       └── routes/      auth · produtos · avaliacoes · pedidos · perfil ·
│                        contato · arquivos · admin · utilitarios · checkout · graphql
└── frontend/
    └── src/
        ├── pages/       (16 telas)
        ├── components/  Cabecalho · SeletorNivel · AvisoTreino
        ├── contexts/    AuthContext · CarrinhoContext
        └── api/         client.js
```

### Rotas principais da API
`/api/auth/*` · `/api/produtos` · `/api/produtos/busca` · `/api/avaliacoes/:id` ·
`/api/pedidos/:id` · `/api/perfil` · `/api/perfil/avatar` · `/api/contato` ·
`/api/arquivos/comprovante` · `/api/admin/*` · `/api/util/*` · `/api/checkout` ·
`/api/cupom/:codigo` · `/graphql` · `/health`

---

**Bom estudo — e lembre-se: só ataque o que é seu, e apenas localmente.** 🔒
