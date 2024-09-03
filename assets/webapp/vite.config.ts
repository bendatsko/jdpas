import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Access environment variables
const backendApiUrl = process.env.VITE_API_URL;
const frontendUrl = process.env.VITE_FRONTEND_URL;

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    // Define global constants to be replaced at compile-time
    define: {
        __API_URL__: JSON.stringify(backendApiUrl),
        __FRONTEND_URL__: JSON.stringify(frontendUrl),
    }
});
