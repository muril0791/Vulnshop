// ============================================================================
//  Estado em memoria compartilhado (coisas que nao moram no banco).
//  - tentativasLogin: contador de tentativas por usuario, para demonstrar
//    (ou nao) o bloqueio por brute force. [WSTG-ATHN-03]
// ============================================================================
const tentativasLogin = new Map(); // usuario -> { qtd, bloqueadoAte }

module.exports = { tentativasLogin };
