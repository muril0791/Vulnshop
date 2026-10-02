-- ============================================================================
--  VulnShop — SCHEMA do banco (MySQL 8)
--  AMBIENTE DE TREINO. Estrutura pensada para servir de superficie de ataque.
--
--  Decisoes didaticas importantes:
--   * A coluna `senha` guarda a senha EM TEXTO PURO de proposito
--     (WSTG-CRYP-03: dados sensiveis sem criptografia). No nivel High, o
--     correto seria armazenar um hash forte com salt (ex.: bcrypt/argon2).
--   * Nao usamos FOREIGN KEYs rigidas para permitir cenarios de IDOR e
--     registros "orfaos" nos exercicios, e para manter o seed simples.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS vulnshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vulnshop;

-- Recria tudo do zero (idempotente)
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS avaliacoes;
DROP TABLE IF EXISTS tokens_reset;
DROP TABLE IF EXISTS mensagens_contato;
DROP TABLE IF EXISTS cupons;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS usuarios;

-- ---------------------------------------------------------------------------
-- Usuarios (login, papeis, "lembrar-me", pergunta secreta, avatar)
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(100) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  usuario           VARCHAR(50)  NOT NULL,
  -- WSTG-CRYP-03: senha em texto puro (intencional). High => bcrypt + salt.
  senha             VARCHAR(255) NOT NULL,
  papel             ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  -- WSTG-ATHN-08: pergunta secreta fraca (respostas adivinhaveis)
  pergunta_secreta  VARCHAR(255),
  resposta_secreta  VARCHAR(255),
  -- WSTG-ATHN-05 / CRYP-04: token de "lembrar-me" previsivel (MD5 do usuario)
  token_lembrar     VARCHAR(255),
  avatar            VARCHAR(255),
  criado_em         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Produtos (catalogo)
-- ---------------------------------------------------------------------------
CREATE TABLE produtos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  descricao   TEXT,                         -- pode conter HTML (XSS/HTML injection em Low)
  preco       DECIMAL(10,2) NOT NULL,
  categoria   VARCHAR(80),
  estoque     INT DEFAULT 0,
  imagem      VARCHAR(255),
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Avaliacoes de produto (campo `comentario` => XSS armazenado em Low)
-- ---------------------------------------------------------------------------
CREATE TABLE avaliacoes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  produto_id  INT NOT NULL,
  usuario_id  INT,
  autor       VARCHAR(100),
  nota        INT,
  comentario  TEXT,                         -- WSTG-INPV-02: XSS armazenado
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Pedidos + itens (historico; visualizar por ID => IDOR)
-- ---------------------------------------------------------------------------
CREATE TABLE pedidos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,                 -- WSTG-ATHZ-04: trocar o ID = ver pedido alheio
  total       DECIMAL(10,2) NOT NULL,
  status      VARCHAR(30) DEFAULT 'pago',
  endereco    VARCHAR(255),
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itens_pedido (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT NOT NULL,
  produto_id      INT NOT NULL,
  nome_produto    VARCHAR(150),
  quantidade      INT NOT NULL,
  preco_unitario  DECIMAL(10,2) NOT NULL
);

-- ---------------------------------------------------------------------------
-- Cupons (WSTG-BUSL-05: reuso infinito quando nao ha limite)
-- ---------------------------------------------------------------------------
CREATE TABLE cupons (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  codigo               VARCHAR(50) NOT NULL,
  desconto_percentual  INT NOT NULL,
  ativo                TINYINT DEFAULT 1,
  usos                 INT DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Mensagens de contato (form que busca uma URL => WSTG-INPV-19 SSRF)
-- ---------------------------------------------------------------------------
CREATE TABLE mensagens_contato (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100),
  email       VARCHAR(150),
  mensagem    TEXT,
  url_avatar  VARCHAR(255),
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Tokens de reset de senha (WSTG-ATHN-09: token previsivel/sequencial)
-- ---------------------------------------------------------------------------
CREATE TABLE tokens_reset (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  token       VARCHAR(100) NOT NULL,
  expira_em   TIMESTAMP NULL,
  usado       TINYINT DEFAULT 0
);
