// 安装步骤类型
export interface InstallStep {
  id: number
  title: string
  description: string
  status: 'wait' | 'process' | 'finish' | 'error'
}

// 环境检测结果
export interface EnvironmentCheckResult {
  item: string
  required: string
  current: string
  status: 'success' | 'warning' | 'error'
  message: string
}

// 数据库配置
export interface DatabaseConfig {
  host: string
  port: string
  username: string
  password: string
  database: string
  prefix: string
}

// 管理员配置
export interface AdminConfig {
  username: string
  password: string
  siteTitle: string
  siteDescription: string
}

// 安装进度数据
export interface InstallProgressData {
  step: number
  total: number
  percentage: number
  message: string
  status: 'processing' | 'success' | 'error'
}
