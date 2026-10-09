import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ensurePersist } from './backup';
import './styles.css';

registerSW({ immediate: true });
// persist() erst nach einer Nutzerinteraktion anfragen (bessere Chancen auf Zustimmung)
document.addEventListener('click', () => { void ensurePersist(); }, { once: true });

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
