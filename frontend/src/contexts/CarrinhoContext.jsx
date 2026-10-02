import { createContext, useContext, useEffect, useState } from 'react';

// Carrinho simples guardado no localStorage. As quantidades/precos ficam do
// lado do cliente de proposito — isso alimenta os exercicios de Business Logic
// (preco/quantidade adulteraveis no checkout).
const Ctx = createContext(null);

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carrinho') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('carrinho', JSON.stringify(itens)); }, [itens]);

  function adicionar(p) {
    setItens((prev) => {
      const i = prev.findIndex((x) => x.produto_id === p.id);
      if (i >= 0) { const c = [...prev]; c[i] = { ...c[i], quantidade: c[i].quantidade + 1 }; return c; }
      return [...prev, { produto_id: p.id, nome: p.nome, preco: Number(p.preco), quantidade: 1 }];
    });
  }
  function atualizar(idx, campo, valor) {
    setItens((prev) => prev.map((x, i) => (i === idx ? { ...x, [campo]: valor } : x)));
  }
  function remover(idx) { setItens((prev) => prev.filter((_, i) => i !== idx)); }
  function limpar() { setItens([]); }

  const total = itens.reduce((s, x) => s + Number(x.preco) * Number(x.quantidade), 0);

  return (
    <Ctx.Provider value={{ itens, adicionar, atualizar, remover, limpar, total }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCarrinho = () => useContext(Ctx);
