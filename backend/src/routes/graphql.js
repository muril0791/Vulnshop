// ============================================================================
//  Endpoint GraphQL (Fase 4).
//   [WSTG-APIT-01] Testes de API/GraphQL:
//     - INTROSPECTION habilitada (padrao) -> o schema inteiro e enumeravel.
//     - SEM autenticacao e SEM rate limit.
//     - A query `usuarios` NAO tem autorizacao -> vaza dados sensiveis (senha).
//     - `pedido(id)` permite IDOR pela API.
// ============================================================================
const express = require('express');
const router = express.Router();
const { graphql, buildSchema } = require('graphql');
const { pool } = require('../db');

const schema = buildSchema(`
  type Usuario { id: Int, nome: String, email: String, usuario: String, senha: String, papel: String }
  type Produto { id: Int, nome: String, descricao: String, preco: Float, categoria: String }
  type Pedido  { id: Int, usuario_id: Int, total: Float, status: String, endereco: String }
  type Query {
    produtos: [Produto]
    produto(id: Int!): Produto
    usuarios: [Usuario]
    pedido(id: Int!): Pedido
  }
`);

const root = {
  produtos: async () => { const [r] = await pool.query('SELECT * FROM produtos'); return r; },
  produto: async ({ id }) => { const [r] = await pool.execute('SELECT * FROM produtos WHERE id = ?', [id]); return r[0]; },
  // Sem checagem de permissao: qualquer um consegue { usuarios { usuario senha papel } }
  usuarios: async () => { const [r] = await pool.query('SELECT * FROM usuarios'); return r; },
  pedido: async ({ id }) => { const [r] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]); return r[0]; }
};

router.post('/', async (req, res) => {
  const { query, variables } = req.body || {};
  const resultado = await graphql({ schema, source: query || '', rootValue: root, variableValues: variables });
  res.json(resultado);
});

router.get('/', (req, res) => res.json({
  dica: 'POST /graphql com {"query":"{ usuarios { usuario senha papel } }"}. ' +
        'Introspection: {"query":"{ __schema { types { name } } }"}'
}));

module.exports = router;
