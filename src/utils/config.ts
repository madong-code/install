import axios from 'axios';

// 默认配置
const defaultConfig = {
  apiBaseUrl: '/adminapi',
  installInfo: {
    title: 'MD-Admin 安装向导',
    version: '1.0.0',
    description: '极速后台开发框架',
  },
  siteInfo: {
    logo: '',
    name: 'MD-Admin 极速后台开发框架',
    officialWebsite: 'https://madong.tech',
    community: 'https://madong.tech/ask',
    documentation: 'https://madong.tech/docs',
    frontendUrl: '/',
    backendUrl: '/admin',
    configUrl: '/admin#/system/config',
  },
};

/**
 * 获取 config.json 的正确路径
 * Dev 模式下 public/ 挂载在根路径 /，config.json 在 /config.json
 * 生产模式下文件随构建输出到 VITE_BASE 目录下
 */
function getConfigUrl(): string {
  if (import.meta.env.DEV) {
    return '/config.json';
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}config.json`;
}

// 动态加载配置
export async function loadConfig() {
  const configUrl = getConfigUrl();

  try {
    const response = await axios.get(configUrl, { timeout: 5000 });
    return deepMerge(defaultConfig, response.data);
  } catch {
    console.warn('加载 config.json 失败，使用默认配置:', configUrl);
    return defaultConfig;
  }
}

// 深度合并对象
function deepMerge(target: any, source: any) {
  const result = { ...target };

  for (const key in source) {
    result[key] =
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
        ? deepMerge(result[key] || {}, source[key])
        : source[key];
  }

  return result;
}

// 全局配置实例
let publicConfig = defaultConfig;

// 初始化配置
export async function initConfig() {
  try {
    publicConfig = await loadConfig();
    return publicConfig;
  } catch (error) {
    console.error('配置初始化失败:', error);
    return publicConfig;
  }
}

// 获取当前配置
export function getConfig() {
  return publicConfig;
}
