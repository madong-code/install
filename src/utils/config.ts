import axios from 'axios'

// 默认配置
const defaultConfig = {
  apiBaseUrl: '/api',
  installInfo: {
    title: 'Madong 管理系统安装向导',
    version: '1.0.0',
    description: '快速开发通用管理后台框架'
  },
  siteInfo: {
    logo: './logo.png',
    name: 'Madong 管理系统',
    officialWebsite: 'https://madong.tech',
    community: 'https://madong.tech/question/',
    documentation: 'https://madong.tech/doc',
    frontendUrl: '/',
    backendUrl: '/admin',
    configUrl: '/admin#/system/config'
  }
}

// 动态加载配置 - 修复路径问题
export async function loadConfig() {
  const configPaths = [
    // 尝试1: 当前目录下的config.json（相对路径）
    './config.json',
    // 尝试2: 基于当前路径的绝对路径
    getConfigPath(),
    // 尝试3: 根目录下的config.json
    '/config.json',
    // 尝试4: 使用完整URL路径
    `${window.location.origin}${getConfigPath()}`
  ]
  
  console.log('开始加载配置文件，尝试路径:', configPaths)
  
  for (const path of configPaths) {
    try {
      const response = await axios.get(path, { timeout: 5000 })
      console.log(`✅ 配置文件加载成功: ${path}`, response.data)
      
      // 深度合并配置，确保所有字段都被正确覆盖
      const mergedConfig = deepMerge(defaultConfig, response.data)
      return mergedConfig
    } catch (error) {
      console.warn('❌ 配置文件加载失败')
    }
  }
  
  console.warn('⚠️ 所有配置文件路径尝试失败，使用默认配置')
  return defaultConfig
}

// 深度合并对象
function deepMerge(target: any, source: any) {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

// 获取配置文件的绝对路径
function getConfigPath() {
  if (typeof window === 'undefined') {
    return './config.json'
  }
  
  const currentPath = window.location.pathname
  const pathSegments = currentPath.split('/').filter(segment => segment)
  
  // 如果是根目录访问
  if (pathSegments.length === 0) {
    return './config.json'
  }
  
  // 如果是子目录访问，构建正确的路径
  const basePath = pathSegments.slice(0, -1).join('/') || ''
  return basePath ? `/${basePath}/config.json` : '/config.json'
}

// 全局配置实例
let publicConfig = defaultConfig

// 初始化配置
export async function initConfig() {
  try {
    publicConfig = await loadConfig()
    console.log('✅ 配置初始化完成:', publicConfig)
    return publicConfig
  } catch (error) {
    console.error('❌ 配置初始化失败:', error)
    return publicConfig
  }
}

// 路径处理工具函数
export function getAbsolutePath(relativePath: string) {
  if (typeof window === 'undefined') {
    return relativePath
  }
  
  if (relativePath.startsWith('http') || relativePath.startsWith('/')) {
    return relativePath
  }
  
  const currentPath = window.location.pathname
  const pathSegments = currentPath.split('/').filter(segment => segment)
  
  if (pathSegments.length === 0) {
    return `./${relativePath}`
  }
  
  const basePath = pathSegments.slice(0, -1).join('/') || ''
  return basePath ? `/${basePath}/${relativePath}` : `/${relativePath}`
}

export { publicConfig }