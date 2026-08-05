import { get, post } from '@/utils/request'

// 安装相关 API
export const installApi = {
  // 检查安装状态
  checkInstall: () => get('/install/check'),

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
}

export default installApi
