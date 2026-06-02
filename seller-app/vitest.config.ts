/**
 * vitest.config.ts — Configuración de Vitest para tests unitarios y de integración.
 *
 * Resuelve el alias @/ hacia src/ y ejecuta tests con entorno Node.
 * Incluye archivos src/**\/*.test.ts con variables globales habilitadas.
 */
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
