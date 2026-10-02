import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CarrinhoProvider } from './contexts/CarrinhoContext.jsx';
import './estilos.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarrinhoProvider>
          <App />
        </CarrinhoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
