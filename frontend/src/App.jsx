import { Routes, Route } from 'react-router-dom';
import AvisoTreino from './components/AvisoTreino.jsx';
import Cabecalho from './components/Cabecalho.jsx';
import Home from './pages/Home.jsx';
import Sobre from './pages/Sobre.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Recuperar from './pages/Recuperar.jsx';
import Produto from './pages/Produto.jsx';
import Busca from './pages/Busca.jsx';
import Carrinho from './pages/Carrinho.jsx';
import Checkout from './pages/Checkout.jsx';
import Pedidos from './pages/Pedidos.jsx';
import PedidoDetalhe from './pages/PedidoDetalhe.jsx';
import Perfil from './pages/Perfil.jsx';
import Contato from './pages/Contato.jsx';
import Arquivos from './pages/Arquivos.jsx';
import Admin from './pages/Admin.jsx';
import ClientSide from './pages/ClientSide.jsx';
import GraphQLPage from './pages/GraphQLPage.jsx';
import Extras from './pages/Extras.jsx';
import Console from './pages/Console.jsx';

export default function App() {
  return (
    <div className="app">
      <AvisoTreino />
      <Cabecalho />
      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/resetar-senha" element={<Recuperar />} />
          <Route path="/produto/:id" element={<Produto />} />
          <Route path="/busca" element={<Busca />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/arquivos" element={<Arquivos />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/client-side" element={<ClientSide />} />
          <Route path="/graphql" element={<GraphQLPage />} />
          <Route path="/extras" element={<Extras />} />
          <Route path="/console" element={<Console />} />
          <Route path="*" element={<p>Pagina nao encontrada.</p>} />
        </Routes>
      </main>
      <footer className="rodape">
        VulnShop · laboratorio de treino AppSec baseado no OWASP WSTG v4.2 · uso local e etico
      </footer>
    </div>
  );
}
