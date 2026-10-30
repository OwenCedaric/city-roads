import { fileURLToPath, URL } from 'url'
import fs from 'fs'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from "rollup-plugin-visualizer";
import siteConfig, { buildUrl, normalizeUrl } from './site.config.mjs'

// Injects site configuration placeholders into index.html
function htmlSiteConfigPlugin() {
  return {
    name: 'html-site-config-plugin',
    enforce: 'pre',
    transformIndexHtml(html) {
      const canonicalRoot = buildUrl(siteConfig.siteUrl, '');
      const webappId = siteConfig.siteUrl ? `${canonicalRoot}#webapp` : '#webapp';
      const datasetId = siteConfig.siteUrl ? `${canonicalRoot}#dataset` : '#dataset';

      let transformed = html
        .replace(/__SITE_URL__\/#webapp/g, webappId)
        .replace(/__SITE_URL__\/#dataset/g, datasetId)
        .replace(/__SITE_URL__\//g, canonicalRoot)
        .replace(/__SITE_URL__/g, canonicalRoot.replace(/\/$/, ''))
        .replace(/__SITE_NAME__/g, siteConfig.siteName)
        .replace(/__SITE_TITLE__/g, siteConfig.title)
        .replace(/__SITE_DESCRIPTION__/g, siteConfig.description)
        .replace(/__SITE_KEYWORDS__/g, siteConfig.keywords)
        .replace(/__SITE_AUTHOR__/g, siteConfig.author)
        .replace(/__OG_IMAGE__/g, siteConfig.ogImage);

      if (siteConfig.analytics?.googleAnalyticsId) {
        const gaId = siteConfig.analytics.googleAnalyticsId;
        const gaSnippet = `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    </script>`;
        transformed = transformed.replace('</head>', `${gaSnippet}\n  </head>`);
      }
      return transformed;
    }
  };
}

// Lightweight Vite dev middleware to preview city SEO landing pages & SEO/GEO manifests on the fly without disk writes
function cityPagesDevPlugin() {
  return {
    name: 'city-pages-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Dynamic dev routing for city landing pages
        const cityMatch = url.match(/^\/city\/([a-z0-9-]+)\/?$/i);
        if (cityMatch) {
          try {
            const { generateCityHTML, loadCities } = await import('./scripts/generate-city-pages.mjs');
            const cities = loadCities();
            const slug = cityMatch[1].toLowerCase();
            const city = cities.find(c => c.slug === slug);
            if (city) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              return res.end(generateCityHTML(city, cities));
            }
          } catch (err) {
            console.error('Error serving city dev page:', err);
          }
        }

        // Dynamic dev endpoints for sitemap, robots, and llms.txt
        if (url === '/sitemap.xml') {
          try {
            const { generateSitemapXML, loadCities } = await import('./scripts/generate-city-pages.mjs');
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            return res.end(generateSitemapXML(loadCities()));
          } catch (err) {
            console.error('Error serving sitemap.xml:', err);
          }
        }

        if (url === '/robots.txt') {
          try {
            const { generateRobotsTxt } = await import('./scripts/generate-city-pages.mjs');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end(generateRobotsTxt());
          } catch (err) {
            console.error('Error serving robots.txt:', err);
          }
        }

        if (url === '/llms.txt') {
          try {
            const { generateLlmsTxt } = await import('./scripts/generate-city-pages.mjs');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end(generateLlmsTxt());
          } catch (err) {
            console.error('Error serving llms.txt:', err);
          }
        }

        if (url === '/llms-full.txt') {
          try {
            const { generateLlmsFullTxt } = await import('./scripts/generate-city-pages.mjs');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end(generateLlmsFullTxt());
          } catch (err) {
            console.error('Error serving llms-full.txt:', err);
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
    htmlSiteConfigPlugin(),
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
