// ============================================================================
//  Conexao com o MySQL (mysql2/promise).
//
//  REGRA DIDATICA DO LABORATORIO:
//   - Consultas VULNERAVEIS (niveis Low/Medium) usam CONCATENACAO de string
//     crua via  pool.query('... ' + entrada + ' ...')  -> permite SQL Injection.
//   - Consultas SEGURAS (nivel High) usam PREPARED STATEMENTS via
//     pool.execute('... ?', [entrada])  -> o driver separa dados de codigo SQL.
// ============================================================================
const path = require('path');
// Le a .env da RAIZ do projeto (util quando rodando local, sem Docker).
// Se as variaveis ja vierem do ambiente (Docker), o dotenv nao as sobrescreve.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'vulnshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ATENCAO (intencional): multipleStatements habilita empilhar comandos
  // separados por ';' (stacked queries). Isso torna a SQL Injection MUITO
  // mais perigosa (ex.: '; DROP TABLE ...'). Em producao deve ficar FALSE.
  multipleStatements: true
});

// Testa a conexao sem derrubar o servidor caso o MySQL ainda nao esteja pronto.
async function testarConexao() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { pool, testarConexao };
