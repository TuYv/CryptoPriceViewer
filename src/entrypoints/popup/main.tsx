import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/popup/App';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('popup/index.html 里缺少 #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
