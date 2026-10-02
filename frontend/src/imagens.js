// Gera uma "imagem" de produto como SVG embutido (data URI) — sem assets externos.
// Cor e ícone por categoria; se o produto tiver uma URL/real em p.imagem, usa ela.
const CORES = {
  Eletronicos: ['#0ea5e9', '#1e3a8a'],
  Acessorios: ['#8b5cf6', '#4c1d95'],
  Livros: ['#f59e0b', '#7c2d12'],
  Escritorio: ['#10b981', '#064e3b']
};
const ICONE = { Eletronicos: '💻', Acessorios: '🖱️', Livros: '📚', Escritorio: '🪑' };

export function imagemProduto(p) {
  if (p && p.imagem && /^(https?:|data:|\/)/.test(p.imagem)) return p.imagem;
  const cat = (p && p.categoria) || '';
  const [c1, c2] = CORES[cat] || ['#334155', '#0ea5e9'];
  const icone = ICONE[cat] || '📦';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
    `<rect width='400' height='300' fill='url(#g)'/>` +
    `<text x='200' y='160' font-size='130' text-anchor='middle' dominant-baseline='central'>${icone}</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
