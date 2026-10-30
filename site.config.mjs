/**
 * City Roads — 站点全局配置文件 (Site Global Configuration)
 * 
 * 统一管理全站的域名、SEO/GEO 元数据、分析代码与对外链接。
 * 修改此处配置（或在 .env 中设置 VITE_SITE_URL），以下位置将全自动同步更新：
 * - dist/sitemap.xml (所有页面与 100+ 城市落地页的绝对 URL)
 * - dist/robots.txt (Sitemap 声明)
 * - dist/llms.txt & dist/llms-full.txt (AI 引擎检索规范与 API 示例)
 * - index.html (Canonical 链接、Open Graph、Twitter Card、JSON-LD 知识图谱)
 * - 所有城市静态落地页的规范链接与结构化数据
 */

/**
 * 校验并补全网址与路径：
 * 1. 协议补全：若缺少 https:// 则自动补全；若为 http:// 则自动升级为 https://
 * 2. 路径补全：网址或目录路径末尾若缺少 '/' 则自动补全（静态文件如 .xml, .txt 除外）
 * @param {string} input 待格式化的网址或路径
 * @param {boolean} isFile 是否为静态文件资源
 * @returns {string} 规范化后的完整网址或路径
 */
export function normalizeUrl(input, isFile = false) {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim();
  if (!str) return '';

  // 如果是以 / 开头的相对路径
  if (str.startsWith('/')) {
    const isFileResource = isFile || /\.[a-z0-9]+$/i.test(str.split('/').pop() || '');
    if (isFileResource) return str;
    return str.endsWith('/') ? str : str + '/';
  }

  // 协议检查与补全：如果缺少 https:// 或为 http:// 则补全为 https://
  if (/^http:\/\//i.test(str)) {
    str = str.replace(/^http:\/\//i, 'https://');
  } else if (!/^https:\/\//i.test(str)) {
    str = 'https://' + str;
  }

  try {
    const u = new URL(str);
    const lastSegment = u.pathname.split('/').pop() || '';
    const hasFileExt = isFile || /\.[a-z0-9]+$/i.test(lastSegment);

    // 路径后缺少 / 则补全
    if (!hasFileExt && !u.pathname.endsWith('/')) {
      u.pathname += '/';
    }
    return u.href;
  } catch (e) {
    return str;
  }
}

/**
 * 规范拼接基础网址与子路径，确保协议与末尾斜杠完整且无重复斜杠
 * @param {string} baseUrl 基础网址（如 https://example.com/ 或空）
 * @param {string} subpath 子路径（如 city/paris、sitemap.xml、?q=Beijing 或 #webapp）
 * @returns {string}
 */
export function buildUrl(baseUrl, subpath = '') {
  if (!baseUrl) {
    if (!subpath) return '/';
    if (subpath.startsWith('?') || subpath.startsWith('#')) return `/${subpath}`;
    const cleanSub = subpath.replace(/^\/+/, '');
    const pathPart = cleanSub.split('?')[0].split('#')[0];
    const isFile = /\.[a-z0-9]+$/i.test(pathPart.split('/').pop() || '');
    if (isFile) return `/${cleanSub}`;
    const [mainPath, ...rest] = cleanSub.split(/([?#].*)/);
    const suffix = rest.join('');
    return `/${mainPath.replace(/\/+$/, '')}/${suffix}`;
  }

  const base = normalizeUrl(baseUrl, false); // 确保 base 协议与末尾 / 均已补全
  if (!subpath) return base;

  if (subpath.startsWith('?') || subpath.startsWith('#')) {
    return `${base}${subpath}`;
  }

  const cleanSub = subpath.replace(/^\/+/, '');
  const pathPart = cleanSub.split('?')[0].split('#')[0];
  const isFile = /\.[a-z0-9]+$/i.test(pathPart.split('/').pop() || '');

  if (isFile) {
    return `${base}${cleanSub}`;
  } else {
    // 处理可能带有 query 或 hash 的页面路径，确保路径部分有末尾斜杠
    const [mainPath, ...rest] = cleanSub.split(/([?#].*)/);
    const suffix = rest.join('');
    const normalizedPath = mainPath.replace(/\/+$/, '') + '/';
    return `${base}${normalizedPath}${suffix}`;
  }
}

const rawSiteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL || '';

const siteConfig = {
  // 站点发布根地址（自动补全 https:// 协议头与路径末尾 /）
  // 优先级：环境变量 VITE_SITE_URL / SITE_URL > 默认配置
  // 例如：输入 'mycityroads.com' 会自动补全为 'https://mycityroads.com/'
  siteUrl: normalizeUrl(rawSiteUrl),
  rawSiteUrl,

  // 站点基础信息
  siteName: 'City Roads',
  title: 'City Roads — Minimalist Cartography & Urban Road Visualizer',
  description: 'Render and visualize every single road in any city at once with WebGL. Explore urban road networks, customize minimalist cartography styles, and export high-resolution SVG and PNG vector graphics.',
  keywords: 'city roads visualization, minimalist cartography, urban road networks, openstreetmap, street maps, vector svg export, city map poster, road graph',

  // 维护者与仓库信息
  author: 'Owen Cedaric',
  originalAuthor: 'Andrei Kashcha',
  githubRepo: 'https://github.com/OwenCedaric/city-roads',

  // 默认社交分享预览图
  ogImage: 'https://i.imgur.com/Fbbe5a6.png',

  // 可选分析追踪配置（如需启用请输入测量 ID，如 'G-XXXXXXXXXX'；留空则完全不加载）
  analytics: {
    googleAnalyticsId: process.env.VITE_GA_ID || ''
  }
};

export default siteConfig;
