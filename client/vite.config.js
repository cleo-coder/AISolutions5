import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' 

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        proxy: {
            // Forward any frontend request starting with /api to your local backend
            '/api': {
                target: 'http://localhost:3000', // Update this to 5000 if your backend uses port 5000
                changeOrigin: true,
                secure: false,
            }
        }
    },
    optimizeDeps: {
        include: [
            'jspdf',
            'jspdf-autotable',
        ],
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
})