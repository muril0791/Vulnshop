-- ============================================================================
--  VulnShop — SEED (dados ficticios para o treino)
--  Todos os dados sao INVENTADOS. Nenhuma credencial/dado real.
-- ============================================================================
USE vulnshop;

-- ---------------------------------------------------------------------------
-- USUARIOS
--  * senha em TEXTO PURO (WSTG-CRYP-03) — visivel em qualquer dump/SQLi.
--  * admin/admin => WSTG-ATHN-02 (credenciais padrao).
--  * token_lembrar = MD5(usuario) => previsivel (WSTG-ATHN-05 / CRYP-04).
--  * pergunta/resposta secreta faceis => WSTG-ATHN-08.
-- ---------------------------------------------------------------------------
INSERT INTO usuarios (nome, email, usuario, senha, papel, pergunta_secreta, resposta_secreta, token_lembrar, avatar) VALUES
('Administrador',   'admin@vulnshop.local',   'admin',   'admin',      'admin',   'Nome do primeiro pet?',      'rex',      MD5('admin'),   NULL),
('Alice Souza',     'alice@vulnshop.local',   'alice',   'alice123',   'cliente', 'Cidade natal?',              'salvador', MD5('alice'),   NULL),
('Bob Lima',        'bob@vulnshop.local',     'bob',     'bob123',     'cliente', 'Time do coracao?',           'flamengo', MD5('bob'),     NULL),
('Carlos Dias',     'carlos@vulnshop.local',  'carlos',  'password',   'cliente', 'Comida favorita?',           'pizza',    MD5('carlos'), NULL),
('Suporte Tecnico', 'suporte@vulnshop.local', 'suporte', 'suporte123', 'admin',   'Ano de fundacao da loja?',   '2020',     MD5('suporte'), NULL);

-- ---------------------------------------------------------------------------
-- PRODUTOS (catalogo do e-commerce)
--  Observacao: a descricao do "Mouse" contem um comentario HTML "esquecido"
--  com pista sensivel (WSTG-INFO-05) que aparece quando a descricao for
--  renderizada como HTML (nivel Low, nas fases seguintes).
-- ---------------------------------------------------------------------------
INSERT INTO produtos (nome, descricao, preco, categoria, estoque, imagem) VALUES
('Notebook Pro 15',      'Notebook leve com 16GB de RAM e SSD de 512GB.',                                     4999.90, 'Eletronicos', 12, 'notebook.png'),
('Smartphone Z10',       'Tela AMOLED 6.5", camera tripla e bateria de 5000mAh.',                             2799.00, 'Eletronicos', 30, 'smartphone.png'),
('Fone Bluetooth Air',   'Cancelamento de ruido e 24h de bateria.',                                          399.90,  'Eletronicos', 55, 'fone.png'),
('Mouse Gamer RGB',      'Mouse ergonomico. <!-- TODO(dev): remover conta de teste suporte:suporte123 -->', 149.90,  'Acessorios',  80, 'mouse.png'),
('Teclado Mecanico',     'Switches azuis, retroiluminado.',                                                  329.90,  'Acessorios',  40, 'teclado.png'),
('Cadeira Ergonomica',   'Apoio lombar e altura ajustavel.',                                                 899.00,  'Escritorio',  15, 'cadeira.png'),
('Monitor 27" 4K',       'IPS, 60Hz, HDR10.',                                                                1899.90, 'Eletronicos', 22, 'monitor.png'),
('Livro: AppSec na Pratica', 'Guia introdutorio de seguranca de aplicacoes web.',                            89.90,   'Livros',      100,'livro.png'),
('Webcam Full HD',       '1080p com microfone embutido.',                                                    249.90,  'Acessorios',  35, 'webcam.png'),
('SSD NVMe 1TB',         'Leitura ate 3500MB/s.',                                                            549.90,  'Eletronicos', 60, 'ssd.png');

-- ---------------------------------------------------------------------------
-- AVALIACOES (base; os payloads de XSS armazenado voce mesmo ira inserir)
-- ---------------------------------------------------------------------------
INSERT INTO avaliacoes (produto_id, usuario_id, autor, nota, comentario) VALUES
(1, 2, 'Alice Souza', 5, 'Excelente notebook, super rapido!'),
(1, 3, 'Bob Lima',    4, 'Bom custo-beneficio, mas esquenta um pouco.'),
(2, 2, 'Alice Souza', 5, 'Camera surpreendente para o preco.'),
(3, 4, 'Carlos Dias', 3, 'Bateria boa, mas o encaixe e frouxo.');

-- ---------------------------------------------------------------------------
-- CUPONS (WSTG-BUSL-05: sem limite de uso por usuario)
-- ---------------------------------------------------------------------------
INSERT INTO cupons (codigo, desconto_percentual, ativo, usos) VALUES
('BEMVINDO10', 10, 1, 0),
('PROMO50',    50, 1, 0),
('FRETEGRATIS', 5, 1, 0);

-- ---------------------------------------------------------------------------
-- PEDIDOS + ITENS
--  pedido 1 pertence a Alice (id 2); pedido 2 ao Bob (id 3).
--  Trocar o ID na URL de visualizacao => IDOR (WSTG-ATHZ-04).
-- ---------------------------------------------------------------------------
INSERT INTO pedidos (usuario_id, total, status, endereco) VALUES
(2, 5399.80, 'pago',      'Rua das Flores, 100 - Salvador/BA'),
(3, 549.90,  'enviado',   'Av. Brasil, 2000 - Rio de Janeiro/RJ'),
(2, 149.90,  'separando', 'Rua das Flores, 100 - Salvador/BA');

INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario) VALUES
(1, 1, 'Notebook Pro 15',    1, 4999.90),
(1, 5, 'Teclado Mecanico',   1, 329.90),
(1, 3, 'Fone Bluetooth Air', 1, 399.90),
(2, 10,'SSD NVMe 1TB',       1, 549.90),
(3, 4, 'Mouse Gamer RGB',    1, 149.90);
