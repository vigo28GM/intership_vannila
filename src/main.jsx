import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles.css';

// StrictMode izstrādes laikā komponentes un efektus izpilda papildu reizi, lai atklātu kļūdas
// (netīras komponentes, trūkstošu sakopšanu). Gatavajā versijā tas neko nemaina.
// ErrorBoundary notver kļūdas renderēšanas laikā, lai nepaliktu tukša lapa.
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>,
);
