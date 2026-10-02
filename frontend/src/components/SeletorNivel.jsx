import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// ============================================================================
//  SELETOR GLOBAL DE NIVEL DE SEGURANCA (estilo DVWA)
//  Troca o nivel (low/medium/high) gravando o cookie no backend e recarrega
//  a pagina para que o novo comportamento valha em todas as telas.
// ============================================================================
export default function SeletorNivel() {
  const [nivel, setNivel] = useState('low');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.getNivel()
      .then((d) => setNivel(d.nivel))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  async function trocar(e) {
    const novo = e.target.value;
    setNivel(novo);
    try {
      await api.setNivel(novo);
    } catch {
      /* ignora — backend pode estar subindo ainda */
    }
    // recarrega para aplicar o novo nivel em toda a aplicacao
    window.location.reload();
  }

  return (
    <div className={'seletor-nivel nivel-' + nivel}>
      <label htmlFor="sel-nivel">Nivel de seguranca:</label>
      <select id="sel-nivel" value={nivel} onChange={trocar} disabled={carregando}>
        <option value="low">Low — falha crua</option>
        <option value="medium">Medium — bypass</option>
        <option value="high">High — corrigido</option>
      </select>
    </div>
  );
}
