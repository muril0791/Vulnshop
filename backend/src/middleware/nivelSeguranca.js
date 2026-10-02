// ============================================================================
//  SELETOR DE NIVEL DE SEGURANCA (estilo DVWA)
//
//  O nivel ativo (low | medium | high) controla o comportamento de CADA
//  funcionalidade vulneravel:
//    - low    => falha crua, sem nenhuma protecao.
//    - medium => protecao fraca/incompleta (ensina bypass).
//    - high   => implementacao segura/corrigida (referencia de "como fazer").
//
//  O nivel e guardado num cookie 'vulnshop_nivel' e lido aqui em CADA
//  requisicao, ficando disponivel em req.nivel para todas as rotas.
// ============================================================================
const NIVEIS = ['low', 'medium', 'high'];

function nivelSeguranca(req, res, next) {
  const bruto = (req.cookies && req.cookies.vulnshop_nivel) || 'low';
  req.nivel = NIVEIS.includes(bruto) ? bruto : 'low';
  next();
}

module.exports = { nivelSeguranca, NIVEIS };
