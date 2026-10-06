import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    base: '/deploy-webapp-example/',
    plugins: [
        react(),
        tailwindcss(),
    ],
})
