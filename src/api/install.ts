import { get, post } from '@/utils/request'

// 安装相关 API
export const installApi = {
  // 检查安装状态
  checkInstall: () => get('/install/check'),

  // 获取安装模式定义（mono/separated）
  getModes: () => get('/install/mode'),

  // 获取安装协议
  getAgreement: () => get('/install/agreement'),

  // 检查环境
  environment: () => get('/install/environment'),

  // 测试数据库连接
  testDatabase: (data: any) => post('/install/test-database', data),

  // 验证配置
  validateConfig: (data: any) => post('/install/validate-config', data),

  // 检测当前场景（版本）。后端可能尚未实现该接口，调用方必须自行 try/catch 容错，
  // 接口不可用时前端会降级到环境变量 VITE_APP_EDITION。
  getEdition: () => get('/install/edition'),

  // 框架信息验证：返回当前租户可用框架版本与能力支持。
  // 5 秒超时容错：接口异常或无响应时调用方自动回退标准版（无感知降级）。
  getFramework: () => get('/install/framework', { timeout: 5000 }),
}

export default installApi
