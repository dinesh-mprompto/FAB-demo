import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './context/CartContext.tsx';
import { ConversationProvider } from './context/ConversationContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConversationProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </ConversationProvider>
  </StrictMode>,
);
