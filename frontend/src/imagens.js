// Gera uma "foto" de produto como SVG embutido (data URI) — sem assets externos.
// Visual de card de loja: fundo em gradiente, brilho, ICONE DE LINHA (mesmo
// estilo do resto do sistema, nao emoji) e faixa inferior com a categoria.
// Se o produto tiver p.imagem (URL/data/caminho), usa ela.
const CORES = {
  Eletronicos: ['#60a5fa', '#1e3a8a', '#0b1e4d'],
  Acessorios: ['#a78bfa', '#5b21b6', '#2e1065'],
  Livros: ['#fbbf24', '#b45309', '#7c2d12'],
  Escritorio: ['#34d399', '#047857', '#064e3b']
};

// Icones de linha (grade 24x24), desenhados em branco sobre o fundo colorido.
const ICONES = {
  Eletronicos:
    `<rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/>`,
  Acessorios:
    `<rect x='6' y='3' width='12' height='18' rx='6'/><line x1='12' y1='7' x2='12' y2='11'/>`,
  Livros:
    `<path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'/><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'/>`,
  Escritorio:
    `<rect x='2' y='7' width='20' height='14' rx='2'/><path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/>`
};
const ICONE_PADRAO =
  `<line x1='16.5' y1='9.4' x2='7.5' y2='4.21'/>` +
  `<path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/>` +
  `<polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/>`;

export function imagemProduto(p) {
  if (p && p.imagem && /^(https?:|data:|\/)/.test(p.imagem)) return p.imagem;
  const cat = (p && p.categoria) || '';
  const [c1, c2, c3] = CORES[cat] || ['#93c5fd', '#334155', '#0f172a'];
  const glifo = ICONES[cat] || ICONE_PADRAO;
  const rotulo = cat || 'VulnShop';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>` +
      `<defs>` +
        `<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
          `<stop offset='0' stop-color='${c1}'/><stop offset='0.6' stop-color='${c2}'/><stop offset='1' stop-color='${c3}'/>` +
        `</linearGradient>` +
        `<radialGradient id='luz' cx='0.3' cy='0.25' r='0.8'>` +
          `<stop offset='0' stop-color='#ffffff' stop-opacity='0.35'/><stop offset='1' stop-color='#ffffff' stop-opacity='0'/>` +
        `</radialGradient>` +
      `</defs>` +
      `<rect width='400' height='300' fill='url(#g)'/>` +
      `<rect width='400' height='300' fill='url(#luz)'/>` +
      `<circle cx='320' cy='70' r='120' fill='#ffffff' fill-opacity='0.06'/>` +
      `<circle cx='70' cy='250' r='90' fill='#000000' fill-opacity='0.08'/>` +
      `<g transform='translate(200,128) scale(4.4) translate(-12,-12)' fill='none' stroke='#ffffff' stroke-opacity='0.95' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>${glifo}</g>` +
      `<rect x='0' y='250' width='400' height='50' fill='#000000' fill-opacity='0.22'/>` +
      `<text x='24' y='281' font-size='20' font-family='Inter, Arial, sans-serif' font-weight='700' fill='#ffffff' fill-opacity='0.92'>${rotulo}</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
