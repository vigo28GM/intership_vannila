import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Bez <StrictMode>: izstrādes režīmā tas katru efektu izpilda divreiz, un pieprasījumu
// žurnālā katrs pieprasījums parādītos dubultā.
createRoot(document.getElementById('root')).render(<App />);
