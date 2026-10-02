// Pagina "Sobre": explica o proposito do laboratorio e os niveis de dificuldade.
export default function Sobre() {
  return (
    <div className="sobre">
      <h1>Sobre o VulnShop</h1>
      <p>
        O <b>VulnShop</b> e um e-commerce ficticio <b>deliberadamente vulneravel</b>,
        criado para praticar as tecnicas do <b>OWASP Web Security Testing Guide
        (WSTG) v4.2</b> em um ambiente seguro e isolado — no mesmo espirito do DVWA,
        OWASP Juice Shop e WebGoat.
      </p>

      <h2>Niveis de dificuldade</h2>
      <ul className="lista-niveis">
        <li><b>Low</b> — a falha aparece de forma crua, sem nenhuma protecao. Ideal para entender a vulnerabilidade.</li>
        <li><b>Medium</b> — ha uma protecao fraca/incompleta (ex.: filtro de blacklist). Serve para treinar <i>bypass</i>.</li>
        <li><b>High</b> — implementacao segura/corrigida (prepared statements, output encoding, tokens CSRF, etc.). E a referencia de "como deveria ser".</li>
      </ul>
      <p>
        Use o seletor no topo da pagina para trocar o nivel a qualquer momento.
      </p>

      <h2>Aviso</h2>
      <p className="erro">
        Este ambiente contem falhas reais de proposito. <b>Nunca</b> o exponha na
        internet nem o use contra sistemas de terceiros. Ataque somente esta
        aplicacao, na sua propria maquina.
      </p>
    </div>
  );
}
