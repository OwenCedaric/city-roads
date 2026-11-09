#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import siteConfig, { buildUrl } from '../site.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const DATA_FILE = path.resolve(ROOT_DIR, 'src/data/top-cities.json');

const BASE_URL = siteConfig.siteUrl;

export const COUNTRY_ZH_MAP = {
  'AR': '阿根廷', 'AU': '澳大利亚', 'AT': '奥地利', 'BE': '比利时', 'BR': '巴西',
  'CA': '加拿大', 'CL': '智利', 'CN': '中国', 'HK': '中国香港', 'CO': '哥伦比亚',
  'CZ': '捷克', 'DK': '丹麦', 'EG': '埃及', 'FI': '芬兰', 'FR': '法国',
  'DE': '德国', 'GR': '希腊', 'HU': '匈牙利', 'IN': '印度', 'ID': '印度尼西亚',
  'IE': '爱尔兰', 'IL': '以色列', 'IT': '意大利', 'JP': '日本', 'MY': '马来西亚',
  'MX': '墨西哥', 'NL': '荷兰', 'NO': '挪威', 'PH': '菲律宾', 'PL': '波兰',
  'PT': '葡萄牙', 'SG': '新加坡', 'ZA': '南非', 'KR': '韩国', 'ES': '西班牙',
  'SE': '瑞典', 'CH': '瑞士', 'TW': '中国台湾', 'TH': '泰国', 'TR': '土耳其',
  'AE': '阿联酋', 'GB': '英国', 'US': '美国', 'VN': '越南'
};

export const CITY_ZH_MAP = {
  'paris': '巴黎', 'tokyo': '东京', 'new-york': '纽约', 'london': '伦敦',
  'beijing': '北京', 'shanghai': '上海', 'berlin': '柏林', 'rome': '罗马',
  'san-francisco': '旧金山', 'amsterdam': '阿姆斯特丹', 'sydney': '悉尼',
  'singapore': '新加坡', 'barcelona': '巴塞罗那', 'seoul': '首尔', 'chicago': '芝加哥',
  'hong-kong': '香港', 'los-angeles': '洛杉矶', 'madrid': '马德里', 'vienna': '维也纳',
  'toronto': '多伦多', 'bangkok': '曼谷', 'dubai': '迪拜', 'milan': '米兰',
  'prague': '布拉格', 'moscow': '莫斯科', 'istanbul': '伊斯坦布尔', 'mexico-city': '墨西哥城',
  'sao-paulo': '圣保罗', 'buenos-aires': '布宜诺斯艾利斯', 'cairo': '开罗', 'mumbai': '孟买',
  'delhi': '德里', 'kyoto': '京都', 'osaka': '大阪', 'guangzhou': '广州', 'shenzhen': '深圳',
  'hangzhou': '杭州', 'chengdu': '成都', 'taipei': '台北', 'melbourne': '墨尔本',
  'vancouver': '温哥华', 'montreal': '蒙特利尔', 'boston': '波士顿', 'seattle': '西雅图',
  'washington-dc': '华盛顿', 'miami': '迈阿密', 'stockholm': '斯德哥尔摩', 'copenhagen': '哥本哈根',
  'oslo': '奥斯陆', 'helsinki': '赫尔辛基', 'dublin': '都柏林', 'brussels': '布鲁塞尔',
  'munich': '慕尼黑', 'frankfurt': '法兰克福', 'zurich': '苏黎世', 'geneva': '日内瓦',
  'lisbon': '里斯本', 'athens': '雅典', 'budapest': '布达佩斯', 'warsaw': '华沙',
  'chongqing': '重庆', 'wuhan': '武汉', 'nanjing': '南京', 'xian': '西安',
  'suzhou': '苏州', 'tianjin': '天津', 'changsha': '长沙', 'qingdao': '青岛',
  'sapporo': '札幌', 'yokohama': '横滨', 'fukuoka': '福冈', 'kuala-lumpur': '吉隆坡',
  'jakarta': '雅加达', 'manila': '马尼拉', 'hanoi': '河内', 'ho-chi-minh-city': '胡志明市',
  'cape-town': '开普敦', 'johannesburg': '约翰内斯堡', 'santiago': '圣地亚哥', 'bogota': '波哥大'
};

export function loadCities() {
  const content = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(content);
}

export function generateCityHTML(city, allCities = [], lang = 'en') {
  const isZh = lang === 'zh';
  const countryZh = COUNTRY_ZH_MAP[city.countryCode] || city.country;
  const cityDisplayName = CITY_ZH_MAP[city.slug] || city.localName || city.name;
  
  const enUrl = buildUrl(BASE_URL, `city/${city.slug}/`);
  const zhUrl = buildUrl(BASE_URL, `zh/city/${city.slug}/`);
  const canonicalUrl = isZh ? zhUrl : enUrl;

  const enHomeUrl = buildUrl(BASE_URL, '');
  const zhHomeUrl = buildUrl(BASE_URL, 'zh/');

  // Relative URLs based on depth:
  // English city: dist/city/{slug}/ (depth 2) -> ../../
  // Chinese city: dist/zh/city/{slug}/ (depth 3) -> ../../../
  const rootRelative = isZh ? '../../../' : '../../';
  const otherLangUrl = isZh ? `../../../city/${city.slug}/` : `../../zh/city/${city.slug}/`;
  const otherLangLabel = isZh ? 'English' : '中文';
  const otherLangTitle = isZh ? 'View in English' : '查看中文页面';

  const interactiveUrl = isZh 
    ? `${rootRelative}?q=${encodeURIComponent(city.name)}&auto=true&lang=zh` 
    : `${rootRelative}?q=${encodeURIComponent(city.name)}&auto=true`;

  const relatedCities = allCities
    .filter(c => c.slug !== city.slug)
    .slice(0, 6);

  // Localized Strings & Typography
  const pageTitle = isZh
    ? `${cityDisplayName} 城市道路网地图与极简矢量海报 | City Roads`
    : `${city.name} Road Network Map & Minimalist Vector Poster | City Roads`;

  const metaDescription = isZh
    ? `探索并导出${cityDisplayName} (${countryZh}) 的全部城市道路矢量图（SVG/高分辨率 PNG）。了解${cityDisplayName}的${city.layoutType}路网形态与街区肌理。`
    : `Explore and export every single road in ${city.name} (${city.country}) as clean vector SVG or high-resolution PNG. Discover the ${city.layoutType} cartography of ${city.name}.`;

  const metaKeywords = isZh
    ? `${city.name} 道路地图, ${cityDisplayName} 路网, ${city.name} 矢量 SVG, 城市路网海报, 极简地图设计, OpenStreetMap 数据, ${cityDisplayName} 城市规划, ${city.localName} 路网`
    : `${city.name} road map, ${city.name} street network, ${city.name} vector SVG, ${city.name} poster, minimalist cartography, ${city.localName} 路网, OpenStreetMap`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": BASE_URL ? `${buildUrl(BASE_URL, '')}#webapp` : "#webapp",
        "name": isZh ? "City Roads 城市路网" : "City Roads",
        "url": isZh ? zhHomeUrl : enHomeUrl,
        "inLanguage": isZh ? "zh-CN" : "en",
        "applicationCategory": "DesignApplication",
        "operatingSystem": "All"
      },
      {
        "@type": "Place",
        "@id": BASE_URL ? `${canonicalUrl}#place` : `#place-${city.slug}`,
        "name": isZh ? cityDisplayName : city.name,
        "alternateName": [city.name, city.localName].filter(Boolean),
        "containedInPlace": {
          "@type": "Country",
          "name": isZh ? countryZh : city.country,
          "identifier": city.countryCode
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": city.lat,
          "longitude": city.lon
        },
        "hasMap": canonicalUrl
      },
      {
        "@type": "Dataset",
        "@id": BASE_URL ? `${canonicalUrl}#dataset` : `#dataset-${city.slug}`,
        "name": isZh ? `${cityDisplayName} 矢量道路网络数据集` : `${city.name} Vector Road Network`,
        "description": isZh 
          ? `从 OpenStreetMap 提取的${cityDisplayName}全部矢量道路线段，包括高速公路、主干道、次干道及生活性居住街道。`
          : `Vectorized road segments of ${city.name} extracted from OpenStreetMap, including motorways, primary, secondary, and residential streets.`,
        "license": "https://opendatacommons.org/licenses/odbl/",
        "creator": {
          "@type": "Organization",
          "name": "OpenStreetMap Contributors"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": BASE_URL ? `${canonicalUrl}#breadcrumb` : `#breadcrumb-${city.slug}`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": isZh ? "主页" : "Home",
            "item": isZh ? zhHomeUrl : enHomeUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": isZh ? "城市目录" : "Cities",
            "item": isZh ? `${zhHomeUrl}#cities` : `${enHomeUrl}#cities`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": isZh ? cityDisplayName : city.name,
            "item": canonicalUrl
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": BASE_URL ? `${canonicalUrl}#faq` : `#faq-${city.slug}`,
        "mainEntity": isZh ? [
          {
            "@type": "Question",
            "name": `如何将${cityDisplayName}的道路导出为矢量 SVG？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `在浏览器中打开 City Roads 并加载${cityDisplayName}，点击导出菜单中的“复制 SVG”或“导出为矢量图 (.svg)”。开发者亦可通过 window.cityRoads.getSVG() 提取纯净路径。`
            }
          },
          {
            "@type": "Question",
            "name": `${cityDisplayName}的城市路网布局是怎样的？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${cityDisplayName}主要呈现${city.layoutType}格局。${city.description}`
            }
          },
          {
            "@type": "Question",
            "name": `导出的${cityDisplayName}路网数据支持商业使用吗？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `支持。道路几何数据依据开放数据库许可（ODbL）由 OpenStreetMap 贡献者提供。只要保留适当的 OpenStreetMap 版权署名，即可用于个人艺术挂画打印或商业设计。`
            }
          }
        ] : [
          {
            "@type": "Question",
            "name": `How can I export ${city.name} roads as vector SVG?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Launch City Roads in your browser, load ${city.name}, and click the 'Copy SVG' or 'Download SVG' button in the export menu. You can also extract vector paths programmatically via window.cityRoads.getSVG().`
            }
          },
          {
            "@type": "Question",
            "name": `What is the urban street layout of ${city.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${city.name} primarily exhibits a ${city.layoutType}. ${city.description}`
            }
          },
          {
            "@type": "Question",
            "name": `Is the road data for ${city.name} free to use commercially?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes, the road geometries are sourced from OpenStreetMap under the Open Database License (ODbL). You may use and export the maps for personal prints or commercial design with proper OpenStreetMap attribution.`
            }
          }
        ]
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="${isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="keywords" content="${metaKeywords}">
  <meta name="author" content="Owen Cedaric (original by Andrei Kashcha)">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Multilingual Hreflang SEO Tags -->
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="zh-CN" href="${zhUrl}">
  <link rel="alternate" hreflang="x-default" href="${enUrl}">

  <!-- Open Graph / Social Sharing -->
  <meta property="og:type" content="place">
  <meta property="og:site_name" content="${isZh ? 'City Roads 城市路网' : 'City Roads'}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://i.imgur.com/Fbbe5a6.png">
  <meta property="og:locale" content="${isZh ? 'zh_CN' : 'en_US'}">
  <meta property="og:locale:alternate" content="${isZh ? 'en_US' : 'zh_CN'}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${metaDescription}">
  <meta name="twitter:image" content="https://i.imgur.com/Fbbe5a6.png">

  <link rel="icon" type="image/svg+xml" href="${rootRelative}favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <style>
    :root {
      --bg-color: #fbf9f6;
      --card-bg: #ffffff;
      --text-color: #3d4451;
      --heading-color: #2c323d;
      --accent-color: #82a1b9;
      --accent-hover: #6a8aa3;
      --border-color: #eae6df;
      --code-bg: #f3f0eb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Plus Jakarta Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.65;
      padding: 0 20px 60px 20px;
      -webkit-font-smoothing: antialiased;
    }
    header {
      max-width: 960px;
      margin: 40px auto 24px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--heading-color);
      font-weight: 600;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }
    .brand svg { width: 36px; height: 36px; }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .nav-links a {
      color: var(--text-color);
      text-decoration: none;
      font-size: 0.95rem;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: var(--accent-hover); }
    .lang-switch-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 14px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      font-weight: 500;
      font-size: 0.85rem !important;
      color: var(--heading-color) !important;
      transition: all 0.2s;
    }
    .lang-switch-btn:hover {
      border-color: var(--accent-hover);
      background: #fdfdfc;
      transform: translateY(-1px);
    }
    main {
      max-width: 960px;
      margin: 0 auto;
    }
    .breadcrumb {
      font-size: 0.85rem;
      color: #8e95a5;
      margin-bottom: 16px;
    }
    .breadcrumb a { color: inherit; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .hero {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      margin-bottom: 32px;
    }
    h1 {
      font-family: 'Playfair Display', 'Noto Serif SC', serif;
      font-size: 2.6rem;
      color: var(--heading-color);
      line-height: 1.2;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #eef2f5;
      color: #556275;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 20px;
      margin-bottom: 16px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .lead {
      font-size: 1.15rem;
      color: #555d6b;
      margin-bottom: 24px;
      max-width: 780px;
    }
    .action-group {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-primary {
      background-color: var(--heading-color);
      color: #ffffff;
      border: 1px solid transparent;
      box-shadow: 0 2px 6px rgba(44, 50, 61, 0.2);
    }
    .btn-primary:hover {
      background-color: #1a1e24;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: var(--code-bg);
      color: var(--heading-color);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover {
      background-color: #e9e4dc;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      h1 { font-size: 2rem; }
      .hero { padding: 24px 20px; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
    }
    .card h2 {
      font-family: 'Playfair Display', 'Noto Serif SC', serif;
      font-size: 1.4rem;
      color: var(--heading-color);
      margin-bottom: 14px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed var(--border-color);
      font-size: 0.95rem;
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: #737c8d; }
    .stat-value { font-weight: 500; color: var(--heading-color); text-align: right; }
    pre {
      background: var(--code-bg);
      padding: 14px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.85rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #2b303a;
      line-height: 1.45;
      margin-top: 10px;
    }
    .faq-item {
      margin-bottom: 18px;
    }
    .faq-question {
      font-weight: 600;
      color: var(--heading-color);
      margin-bottom: 6px;
      font-size: 1.05rem;
    }
    .related-cities {
      margin-top: 40px;
    }
    .city-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .city-chip {
      padding: 8px 16px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--heading-color);
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .city-chip:hover {
      border-color: var(--accent-color);
      background: #fdfdfc;
      transform: translateY(-1px);
    }
    footer {
      max-width: 960px;
      margin: 60px auto 0 auto;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: #8b92a0;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    footer a { color: inherit; text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <a href="${rootRelative}" class="brand">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="24" cy="24" r="21" fill="#fbf9f6" stroke="#3d4451"/>
        <line x1="8" y1="18" x2="40" y2="18" stroke="#3d4451"/>
        <line x1="8" y1="30" x2="40" y2="30" stroke="#3d4451"/>
        <line x1="18" y1="8" x2="18" y2="40" stroke="#3d4451"/>
        <line x1="30" y1="8" x2="30" y2="40" stroke="#3d4451"/>
        <path d="M10 24 Q 24 10 38 24 Q 24 38 10 24" stroke="#82a1b9" stroke-width="1.8"/>
      </svg>
      <span>city roads</span>
    </a>
    <nav class="nav-links">
      <a href="${interactiveUrl}">${isZh ? '进入 WebGL 交互地图' : 'Interactive App'}</a>
      <a href="https://github.com/OwenCedaric/city-roads" target="_blank" rel="noopener">GitHub</a>
      <a href="${rootRelative}llms.txt">llms.txt</a>
      <a href="${otherLangUrl}" class="lang-switch-btn" title="${otherLangTitle}">
        <i class="ri-global-line"></i> ${otherLangLabel}
      </a>
    </nav>
  </header>

  <main>
    <div class="breadcrumb">
      <a href="${rootRelative}">${isZh ? '主页' : 'Home'}</a> &gt; <span>${isZh ? '城市目录' : 'Cities'}</span> &gt; <span>${isZh ? cityDisplayName : city.name}</span>
    </div>

    <section class="hero">
      <span class="badge">${isZh ? countryZh : city.country} • ${city.countryCode}</span>
      <h1>${isZh ? `${cityDisplayName} 城市道路网地图` : `${city.name} Road Network Map`}</h1>
      <p class="lead">${city.description}</p>

      <div class="action-group">
        <a href="${interactiveUrl}" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          ${isZh ? '在 WebGL 地图中交互查看' : 'Open in Interactive WebGL Map'}
        </a>
        <a href="#api" class="btn btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          ${isZh ? '矢量与代码 API' : 'Vector & Code API'}
        </a>
      </div>
    </section>

    <div class="grid-2">
      <section class="card">
        <h2>${isZh ? '城市路网格局与特征概览' : 'Road Typology & Facts'}</h2>
        <div class="stat-row">
          <span class="stat-label">${isZh ? '本地 / 母语名称' : 'Local / Native Name'}</span>
          <span class="stat-value">${city.localName}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${isZh ? '城市街网形态' : 'Urban Grid Pattern'}</span>
          <span class="stat-value">${city.networkMetrics.gridPattern}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${isZh ? '预估道路线段段数' : 'Estimated Road Ways'}</span>
          <span class="stat-value">${city.networkMetrics.estimatedRoads}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${isZh ? '地理坐标包围盒' : 'Geographic Bounding Box'}</span>
          <span class="stat-value">${city.bbox[0].toFixed(2)}, ${city.bbox[1].toFixed(2)} to ${city.bbox[2].toFixed(2)}, ${city.bbox[3].toFixed(2)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${isZh ? '核心干道走廊' : 'Primary Arterial Corridors'}</span>
          <span class="stat-value">${city.primaryStreets}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${isZh ? '数据来源与授权' : 'Data Source'}</span>
          <span class="stat-value">OpenStreetMap (ODbL)</span>
        </div>
      </section>

      <section class="card" id="api">
        <h2>${isZh ? '开发者与矢量导出 API' : 'Developer & Export API'}</h2>
        <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 8px;">
          ${isZh ? `直接在您的 Web 应用、Figma 插件或笔式绘图仪中提取${cityDisplayName}道路矢量：` : `Extract vector SVG geometries directly into your web applications or pen plotters:`}
        </p>
        <pre><code>// Programmatically extract ${city.name} roads:
const res = await window.cityRoads.loadCity('${city.name}', {
  minLength: 2,        // Filter micro segments
  includeLabels: true  // Minimalist typography
});

console.log(res.svg); // Clean XML &lt;path&gt; markup</code></pre>
        <p style="font-size: 0.85rem; color: #8b92a0; margin-top: 10px;">
          ${isZh ? '支持 iframe <code>postMessage</code> 桥接协议，适用于自动化数据流。' : 'Supports iframe <code>postMessage</code> bridge for automated pipelines.'}
        </p>
      </section>
    </div>

    <section class="card" style="margin-bottom: 32px;">
      <h2>${isZh ? '常见问题解答 (FAQ)' : 'Frequently Asked Questions'}</h2>
      ${isZh ? `
      <div class="faq-item">
        <div class="faq-question">City Roads 如何渲染${cityDisplayName}的城市道路？</div>
        <div>City Roads 从 OpenStreetMap 获取原始路网几何数据（通过 Overpass API 或预先索引的 Protobuf 图数据），并在高性能 WebGL 画布上实时渲染数以万计的道路线段。</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">我可以导出${cityDisplayName}的高清海报或矢量图吗？</div>
        <div>可以！交互式查看器允许自定义画布底色、道路墨色，并一键导出无限缩放的矢量 SVG 文件或打印级高清晰度 PNG 海报位图。</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">导出的${cityDisplayName}地图可以用于商业用途吗？</div>
        <div>可以。路网几何数据由 OpenStreetMap 贡献者在开放数据库许可（ODbL）下提供。只要在作品中保留 OpenStreetMap 版权署名，即可自由用于个人印刷、装饰画或商业设计。</div>
      </div>` : `
      <div class="faq-item">
        <div class="faq-question">How does City Roads render ${city.name} roads?</div>
        <div>City Roads pulls raw street geometries from OpenStreetMap using the Overpass API or pre-indexed protobuf graphs, rendering them in real time on a high-performance WebGL canvas.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Can I export high-resolution posters of ${city.name}?</div>
        <div>Yes! The interactive viewer allows selecting custom background paper hues, ink colors, and exporting vector SVG (infinitely scalable) or print-quality PNG raster snapshots.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Is commercial use permitted?</div>
        <div>Map geometries are licensed under the Open Database License (ODbL) by OpenStreetMap contributors. You are free to print, plot, and share visualizations with appropriate OSM credit.</div>
      </div>`}
    </section>

    <section class="related-cities">
      <h3 style="font-family: 'Playfair Display', 'Noto Serif SC', serif; font-size: 1.3rem; color: var(--heading-color);">
        ${isZh ? '探索全球其他主要都会区道路网' : 'Explore Other Global Metropolitan Road Networks'}
      </h3>
      <div class="city-chips">
        ${relatedCities.map(c => {
          const relName = isZh ? (CITY_ZH_MAP[c.slug] || c.localName || c.name) : c.name;
          const relSub = isZh ? (c.localName && c.localName !== relName ? ` (${c.localName})` : '') : ` (${c.localName})`;
          return `<a href="../${c.slug}/" class="city-chip">${relName}${relSub}</a>`;
        }).join('\n        ')}
      </div>
    </section>
  </main>

  <footer>
    <div>${isZh ? '© City Roads • 基于 OpenStreetMap 数据构建 • 极简制图美学' : '© City Roads • Built with OpenStreetMap data • Minimalist Cartography'}</div>
    <div>
      <a href="${rootRelative}">${isZh ? '主页' : 'Home'}</a> •
      <a href="${rootRelative}llms.txt">llms.txt</a> •
      <a href="https://github.com/OwenCedaric/city-roads" target="_blank" rel="noopener">GitHub</a>
    </div>
  </footer>
</body>
</html>`;
}

export function generateChineseHomepage(baseHtml) {
  const zhTitle = siteConfig.zh.title;
  const zhDesc = siteConfig.zh.description;
  const zhKeywords = siteConfig.zh.keywords;
  const zhSiteName = siteConfig.zh.siteName;
  const zhCanonical = buildUrl(BASE_URL, 'zh/');
  const enCanonical = buildUrl(BASE_URL, '');

  let zhHtml = baseHtml
    .replace('<html lang="en">', '<html lang="zh-CN">')
    .replace(/<title>.*?<\/title>/, `<title>${zhTitle}</title>`)
    .replace(/<meta name="title" content=".*?">/, `<meta name="title" content="${zhTitle}">`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${zhDesc}">`)
    .replace(/<meta name="keywords" content=".*?">/, `<meta name="keywords" content="${zhKeywords}">`)
    .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${zhCanonical}">`)
    .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${zhTitle}">`)
    .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${zhDesc}">`)
    .replace(/<meta property="og:site_name" content=".*?">/, `<meta property="og:site_name" content="${zhSiteName}">`)
    .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${zhCanonical}">`)
    .replace(/<meta property="og:locale" content=".*?">/, '<meta property="og:locale" content="zh_CN">')
    .replace(/<meta property="og:locale:alternate" content=".*?">/, '<meta property="og:locale:alternate" content="en_US">')
    .replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${zhTitle}">`)
    .replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${zhDesc}">`)
    .replace(/<meta name="twitter:url" content=".*?">/, `<meta name="twitter:url" content="${zhCanonical}">`)
    .replace(/(href|src)="assets\//g, '$1="../assets/')
    .replace(/(href|src)="favicon\.svg"/g, '$1="../favicon.svg"')
    .replace(/"name": "City Roads"/g, `"name": "${zhSiteName}"`)
    .replace(/"description": "Free web tool to instantly draw[^"]*"/g, `"description": "${zhDesc}"`);

  // Ensure reciprocal hreflang links exist
  if (!zhHtml.includes('hreflang="zh-CN"')) {
    const hreflangSnippet = `
    <!-- Multilingual Hreflang Tags -->
    <link rel="alternate" hreflang="en" href="${enCanonical}">
    <link rel="alternate" hreflang="zh-CN" href="${zhCanonical}">
    <link rel="alternate" hreflang="x-default" href="${enCanonical}">`;
    zhHtml = zhHtml.replace('</head>', `${hreflangSnippet}\n  </head>`);
  }

  // Localized noscript content
  const zhNoscript = `
    <noscript>
      <div style="max-width: 720px; margin: 40px auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3d4451; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <h1 style="font-family: 'Playfair Display', 'Noto Serif SC', serif; font-size: 28px; margin-bottom: 12px;">City Roads — 一键绘制与导出全球任意城市全部道路网</h1>
        <p><strong>City Roads 城市路网</strong> 是一款免费的在线极简地图工具，基于 OpenStreetMap 开源路网数据与 WebGL GPU 图形加速，一键秒级绘制全球任意城市的完整街网。</p>
        <h2>核心功能与应用场景</h2>
        <ul>
          <li><strong>一键绘制城市全部道路：</strong> 秒级渲染数千座世界都会区的全部街道网络与城市肌理。</li>
          <li><strong>矢量 SVG 导出：</strong> 清晰无损的矢量路径，支持按道路长度过滤，适配 Figma、Illustrator、激光雕刻与笔式绘图机。</li>
          <li><strong>高清 PNG 城市海报：</strong> 打印级高分辨率位图导出，轻松定制极简城市道路艺术挂画与文创产品。</li>
          <li><strong>开发者 API 与自动化脚本：</strong> 支持通过 <code>window.cityRoads</code>、iframe <code>postMessage</code> 或纯 Node.js CLI 无头引擎批量抓取导出。</li>
        </ul>
        <p><em>请在现代浏览器中启用 JavaScript 与 WebGL 支持，以畅享交互式 3D 地图浏览与实时配色调节。</em></p>
      </div>
    </noscript>`;

  zhHtml = zhHtml.replace(/<noscript>[\s\S]*?<\/noscript>/, zhNoscript.trim());

  return zhHtml;
}

export function generateSitemapXML(cities) {
  const now = new Date().toISOString().split('T')[0];
  const homeLoc = buildUrl(BASE_URL, '');
  const zhHomeLoc = buildUrl(BASE_URL, 'zh/');

  const urls = [
    // English Homepage
    `  <url>
    <loc>${homeLoc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${homeLoc}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhHomeLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${homeLoc}" />
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    // Chinese Homepage
    `  <url>
    <loc>${zhHomeLoc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${homeLoc}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhHomeLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${homeLoc}" />
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
    // City Pages (Both English & Chinese)
    ...cities.flatMap(c => {
      const enCity = buildUrl(BASE_URL, `city/${c.slug}/`);
      const zhCity = buildUrl(BASE_URL, `zh/city/${c.slug}/`);
      return [
        `  <url>
    <loc>${enCity}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${enCity}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhCity}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enCity}" />
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
        `  <url>
    <loc>${zhCity}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${enCity}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhCity}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enCity}" />
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      ];
    })
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

export function generateRobotsTxt() {
  const sitemapUrl = buildUrl(BASE_URL, 'sitemap.xml');
  return `User-agent: *
Allow: /

# Generative Engine Optimization (GEO): Allow AI search crawlers and models
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Cohere-ai
Allow: /

User-agent: OAI-SearchBot
Allow: /

# International & Chinese Search Engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: 360Spider
Allow: /

User-agent: Sogou web spider
Allow: /

User-agent: YandexBot
Allow: /

# Sitemaps
Sitemap: ${sitemapUrl}
`;
}

export function generateLlmsTxt() {
  const llmsFullUrl = buildUrl(BASE_URL, 'llms-full.txt');
  const sitemapUrl = buildUrl(BASE_URL, 'sitemap.xml');

  return `# City Roads — Draw & Export All Roads in Any City (Online Tool & AI Skill)

> High-resolution vector road network visualization, analysis, and cartographic export tool for cities worldwide.
> 全球任意城市道路网一键极简制图、高精矢量 SVG 与高清海报导出工具。

## Overview / 项目概述
City Roads (city-roads) renders every single road within any city or metropolitan area using OpenStreetMap (OSM) vector data and WebGL GPU acceleration. It allows urban planners, cartographers, graphic designers, software engineers, and AI agents to explore urban geometries, evaluate road network topology, and export crisp vector graphics (SVG) or high-resolution raster images (PNG).

City Roads 支持全球数千座城市的全部路网提取与渲染，支持纯无头 Node.js CLI 秒级导出、标准 JavaScript API 调用、iframe 跨域通信以及中文/英文双语自然语言 AI Skill。

## Key Features & Capabilities / 核心特性
- **Worldwide Coverage**: Visualizes roads for thousands of global cities using OpenStreetMap Overpass API and pre-cached binary protobuf road graphs.
- **Multilingual Support**: Fully supported in English and Simplified Chinese (中文), with bilingual landing pages and runtime locale switching.
- **Minimalist Cartographic Aesthetics**: Refined typography, warm-ivory paper background (\`#fbf9f6\`), deep ink roads (\`#3d4451\`), and slate blue-gray accents.
- **Export Capabilities**:
  - Raw vector SVG XML markup (filtered by road length, with or without city labels).
  - High-resolution PNG images and canvas data URLs for printing or rendering textures.
  - Direct clipboard copy of SVG markup for instant pasting into Figma, Illustrator, or pen plotter software.
- **AI Agent Skill**: Ready-to-use skill in \`.agents/skills/city-roads-export/\` for natural language and terminal automation.

## AI Assistant Prompt Examples / 自然语言 Prompt 示例
AI agents and users can trigger exports directly using these prompts:
- "帮我用 midnight 主题导出杭州的城市道路矢量图" (Generates gold-on-black vector SVG)
- "Export Paris roads in architectural blueprint style, 1200x1200" (Generates blueprint poster)
- "制作东京的黑金（midnight）手机壁纸，去除底边文字" (9:16 aspect ratio wallpaper)
- "帮我导出纽约曼哈顿的主要干道路网，过滤掉细小巷道" (Major arterials only)

## Headless CLI Automation / 命令行 CLI 自动化
Directly render and export city vector SVGs using pure Node.js without launching a browser:
\`\`\`bash
# Basic export (dark theme, 1200x1600):
npm run export:city -- --city "Seattle"

# Midnight gold theme with custom output path:
npm run export:city -- --city "Kyoto" --theme midnight --out ./output/kyoto-gold.svg

# Wallpaper aspect ratio without labels:
npm run export:city -- --city "Tokyo" --theme blueprint --width 1080 --height 1920 --no-label
\`\`\`

## Programmatic Developer API Reference (\`window.cityRoads\`)
- \`window.cityRoads.getSVG(options)\`: Returns raw SVG XML string. Options include \`minLength\` (number in px) and \`includeLabels\` (boolean).
- \`window.cityRoads.getSVGDataURL()\`: Returns \`data:image/svg+xml;utf8,...\` string.
- \`window.cityRoads.getSVGBlob()\`: Returns standard \`Blob\` instance.
- \`window.cityRoads.getPNG('dataUrl' | 'blob')\`: Asynchronously renders canvas snapshot.
- \`window.cityRoads.copySVG()\`: Copies SVG vector markup directly to system clipboard.
- \`window.cityRoads.loadCity(cityName, options)\`: Programmatically queries, downloads, and renders any city.

## Iframe Integration Protocol (\`postMessage\`)
Host pages can communicate with City Roads via iframe:
- Send: \`{ type: 'GET_SVG', city: 'Paris', options: { minLength: 2, includeLabels: false } }\`
- Receive: \`{ type: 'CITY_ROADS_SVG_RESPONSE', success: true, city: 'Paris', svg: '<svg...>...</svg>' }\`

## Canonical Documentation & Links
- Full API Reference: ${siteConfig.githubRepo}/blob/main/API.md
- Full LLM Details: ${llmsFullUrl}
- City Directory Sitemap: ${sitemapUrl}
`;
}

export function generateLlmsFullTxt() {
  const homeUrl = buildUrl(BASE_URL, '');
  const zhHomeUrl = buildUrl(BASE_URL, 'zh/');
  const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl.slice(0, -1) : homeUrl;

  return `# City Roads — Complete Technical Guide & Dataset Specifications
# City Roads — 完整技术规格与数据集指南

## 1. System Architecture & Rendering Pipeline / 系统架构
City Roads uses a lightweight, client-side WebGL pipeline to render complex urban road networks containing up to hundreds of thousands of line segments:
1. **Query Resolution**: The user query is resolved using OSM Nominatim to obtain bounding boxes (\`bbox\`) or administrative boundary area IDs (\`areaId\`).
2. **Data Ingestion**:
   - For ~3,000 pre-cached metropolitan areas with population > 100,000, binary Protocol Buffers (\`.pbf\`) are downloaded from CloudFront CDN (\`https://d2uf7yjjctyxf.cloudfront.net/nov-02-2020\`).
   - For all other locations or custom queries, queries are constructed using the Overpass QL syntax.
3. **Graph Construction**: Road coordinates (WGS84 lat/lon) are projected onto a 2D planar space using Mercator projection and packed into Float32Array buffers.
4. **WebGL Rendering**: Renders lines via \`w-gl\` with high FPS, supporting pan, zoom, custom color styling, and high-DPI scaling.
5. **Vector Serialization**: The internal graph segments can be serialized directly into XML SVG \`<path>\` elements, grouping segments by connectivity or rendering as individual polylines.

## 2. URL Parameters & Deep Linking / 深度链接规范
AI assistants and applications can construct direct URLs to load specific cities and states:
- \`${cleanHomeUrl}/?q={cityName}&auto=true\` (Automatically searches Nominatim and downloads the city in English, e.g. \`?q=Tokyo&auto=true\`)
- \`${cleanHomeUrl}/?q={cityName}&auto=true&lang=zh\` (Automatically loads with Chinese UI, e.g. \`?q=杭州&auto=true&lang=zh\`)
- \`${zhHomeUrl}\` (Dedicated Chinese homepage)
- \`${cleanHomeUrl}/?areaId={osmAreaId}\` (Directly loads pre-cached area ID)
- \`${cleanHomeUrl}/?bbox={minLon},{minLat},{maxLon},{maxLat}\` (Directly loads arbitrary geographic bounding box)
- \`${buildUrl(BASE_URL, 'city/{city-slug}/')}\` (Static programmatic SEO landing page in English)
- \`${buildUrl(BASE_URL, 'zh/city/{city-slug}/')}\` (Static programmatic SEO landing page in Chinese)

## 3. Bilingual Support & Internationalization Architecture
- Target Locales: English (\`en\`) and Simplified Chinese (\`zh\` / \`zh-CN\`).
- URL Detection: \`?lang=zh\` or \`?lang=en\`, or path prefix \`/zh/\`.
- Search Engines: Dedicated indexable static landing pages for both languages with Google-compliant reciprocal \`hreflang\` link tags.
- Sitemap: Complete \`sitemap.xml\` with embedded \`xhtml:link\` international alternates.

## 4. Citation & Academic/Technical Reference
- Project: City Roads (Cartographic Road Network Visualizer)
- Maintainer: ${siteConfig.author}
- Original Creator: ${siteConfig.originalAuthor}
- Open Source Repository: ${siteConfig.githubRepo}
- Data Attribution: Map data © OpenStreetMap contributors under ODbL
`;
}

export function buildPages() {
  const cities = loadCities();
  console.log(`[SEO/GEO Build] Generating static landing pages for ${cities.length} cities in English & Chinese...`);

  // Ensure output directories exist in dist
  const distCityDir = path.resolve(DIST_DIR, 'city');
  const distZhCityDir = path.resolve(DIST_DIR, 'zh/city');
  const distZhDir = path.resolve(DIST_DIR, 'zh');

  if (!fs.existsSync(distCityDir)) fs.mkdirSync(distCityDir, { recursive: true });
  if (!fs.existsSync(distZhCityDir)) fs.mkdirSync(distZhCityDir, { recursive: true });
  if (!fs.existsSync(distZhDir)) fs.mkdirSync(distZhDir, { recursive: true });

  // 1. Generate each city page: English (dist/city/{slug}/) and Chinese (dist/zh/city/{slug}/)
  cities.forEach(city => {
    // English city landing page
    const enHtml = generateCityHTML(city, cities, 'en');
    const distEnFolder = path.resolve(distCityDir, city.slug);
    if (!fs.existsSync(distEnFolder)) fs.mkdirSync(distEnFolder, { recursive: true });
    fs.writeFileSync(path.resolve(distEnFolder, 'index.html'), enHtml, 'utf8');

    // Chinese city landing page
    const zhHtml = generateCityHTML(city, cities, 'zh');
    const distZhFolder = path.resolve(distZhCityDir, city.slug);
    if (!fs.existsSync(distZhFolder)) fs.mkdirSync(distZhFolder, { recursive: true });
    fs.writeFileSync(path.resolve(distZhFolder, 'index.html'), zhHtml, 'utf8');
  });

  // 2. Generate Chinese Homepage (dist/zh/index.html) based on compiled dist/index.html
  const distIndexFile = path.resolve(DIST_DIR, 'index.html');
  if (fs.existsSync(distIndexFile)) {
    const baseIndexHtml = fs.readFileSync(distIndexFile, 'utf8');
    const zhIndexHtml = generateChineseHomepage(baseIndexHtml);
    fs.writeFileSync(path.resolve(distZhDir, 'index.html'), zhIndexHtml, 'utf8');
  }

  // 3. Generate sitemap.xml directly into dist/ with full bilingual alternates
  const sitemapXML = generateSitemapXML(cities);
  fs.writeFileSync(path.resolve(DIST_DIR, 'sitemap.xml'), sitemapXML, 'utf8');

  // 4. Generate robots.txt, llms.txt and llms-full.txt directly into dist/
  fs.writeFileSync(path.resolve(DIST_DIR, 'robots.txt'), generateRobotsTxt(), 'utf8');
  fs.writeFileSync(path.resolve(DIST_DIR, 'llms.txt'), generateLlmsTxt(), 'utf8');
  fs.writeFileSync(path.resolve(DIST_DIR, 'llms-full.txt'), generateLlmsFullTxt(), 'utf8');

  const domainNotice = BASE_URL ? `using domain: ${BASE_URL}` : '(domain not specified; generated clean domain-agnostic relative paths)';
  console.log(`[SEO/GEO Build] Successfully built ${cities.length * 2} bilingual city pages, Chinese home page, sitemap.xml, robots.txt, and llms.txt ${domainNotice}`);
}

// Execute when run directly
buildPages();
