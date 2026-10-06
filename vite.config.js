import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5500 is the address the plain-JavaScript version used, so the URL stays the same.
export default defineConfig({
    plugins: [react()],
    server: { host: '127.0.0.1', port: 5500, strictPort: true },
    preview: { host: '127.0.0.1', port: 5500, strictPort: true },
});
