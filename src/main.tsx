import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App, AppErrorBoundary } from './app/App';
import { Providers } from './app/providers';
import './design/styles.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <Providers>
          <App />
        </Providers>
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
