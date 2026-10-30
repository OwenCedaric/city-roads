import { fileURLToPath, URL } from 'url'
import fs from 'fs'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from "rollup-plugin-visualizer";

// Lightweight Vite dev middleware to preview city SEO landing pages on the fly without disk writes
function cityPagesDevPlugin() {
  return {
    name: 'city-pages-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const match = url.match(/^\/city\/([a-z0-9-]+)\/?$/i);
        if (match) {
          try {
            const { generateCityHTML, loadCities } = await import('./scripts/generate-city-pages.mjs');
            const cities = loadCities();
            const slug = match[1].toLowerCase();
            const city = cities.find(c => c.slug === slug);
            if (city) {
              const html = generateCityHTML(city, cities);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
              return;
            }
          } catch (err) {
            console.error('Error serving city dev page:', err);
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cityPagesDevPlugin(),
    visualizer({
    //  template: 'network'
    })
  ],
  base: '',
  server: {
    port: 8080
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
