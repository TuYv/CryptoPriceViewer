import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { languageFromLocale } from '@/i18n';
import { App } from './App';
import './style.css';

const lang = languageFromLocale(browser.i18n.getUILanguage());
document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;

const root = document.getElementById('root');
if (!root) throw new Error('popup/index.html 里缺少 #root');

createRoot(root).render(
  <StrictMode>
    <App lang={lang} />
  </StrictMode>,
);
