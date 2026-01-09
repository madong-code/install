import { installApi } from '@/api/install'
import { getConfig } from '@/utils/config'
import { defineStore } from 'pinia'

export interface AgreementData {
  title: string
  content: string
  version: string
  update_time: string
}

export interface EnvironmentCheckItem {
  name: string
  need: string
  required: string
  current: string
  status: boolean
  status_text: string
  message: string
  is_required: boolean
}

// 目录权限检查结果
export interface DirectoryPermissionCheckResult {
  path: string
  path_name: string
  name: string
  required: boolean
  permission_type: 'read_only' | 'write_only' | 'read_write'
  description: string
  exists: boolean
  is_readable: boolean
  is_writable: boolean
  status: boolean
  status_text: string
  message: string
}

export interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  prefix: string
}

export interface AdminConfig {
  username: string
  password: string
  email: string
  site_name: string
}

export const useInstallStore = defineStore('install', {
  state: () => ({
    // 协议数据
    agreementData: null as AgreementData | null,
    // 环境检测数据
    environmentData: {
      check_items: [] as EnvironmentCheckItem[],
      directory_check_items: [] as DirectoryPermissionCheckResult[],
      passed: false,
      loading: false
    },
    // 数据库配置
    databaseConfig: {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'madong',
      prefix: 'md_'
    } as DatabaseConfig,
    // 管理员配置
    adminConfig: {
      username: 'admin',
      password: '123456',
      email: '405784684@qq.com',
      site_name: 'Madong管理系统'
    } as AdminConfig,
    // 安装进度
    install_progress: 0,
    // 安装日志
    install_logs: [] as string[],
    // 安装状态
    install_status: 'idle' as 'idle' | 'installing' | 'success' | 'error',
    // 安装开始时间
    install_start_time: null as Date | null,
    // 安装是否完成
    installation_completed: false,
    // 安装完成时间
    installation_completed_time: null as Date | null,
    // 安装结束时间
    install_end_time: null as Date | null
  }),

  getters: {
    // 计算安装耗时
    installDuration: (state) => {
      if (!state.install_start_time) return 0
      const endTime = state.install_end_time || new Date()
      return Math.floor((endTime.getTime() - state.install_start_time.getTime()) / 1000)
    },

    // 格式化安装时间
    formattedDuration: (state) => {
      const duration = state.install_end_time && state.install_start_time
        ? Math.floor((state.install_end_time.getTime() - state.install_start_time.getTime()) / 1000)
        : 0

      if (duration < 60) {
        return `${duration}秒`
      } else {
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        return `${minutes}分${seconds}秒`
      }
    },

    // 环境检测是否通过（考虑强制要求）
    environmentPassed: (state) => {
      if (state.environmentData.check_items.length === 0) return false

      const hasRequiredError = state.environmentData.check_items.some(
        item => item.is_required && item.status === false
      )

      return !hasRequiredError
    },

    // 前端使用的数据格式（驼峰命名）
    environmentCheckItems: (state) => {
      return state.environmentData.check_items.map(item => ({
        name: item.name,
        need: item.need,
        required: item.required,
        current: item.current,
        status: item.status,
        statusText: item.status_text,
        message: item.message,
        isRequired: item.is_required
      }))
    },
    // 目录权限检查项（前端使用的数据格式）
    directoryCheckItems: (state) => {
      return state.environmentData.directory_check_items.map(item => ({
        path: item.path,
        pathName: item.path_name,
        name: item.name,
        required: item.required,
        permissionType: item.permission_type,
        description: item.description,
        exists: item.exists,
        isReadable: item.is_readable,
        isWritable: item.is_writable,
        status: item.status,
        statusText: item.status_text,
        message: item.message
      }))
    }
  },

  actions: {
    // 检查安装状态
    async fetchInstallationStatus() {
      const res = await installApi.checkInstall()
      this.installation_completed = res.data?.installed || false
      return res.data?.installation_completed || false
    },

    // 模拟获取协议数据（后端格式）
    async fetchAgreementData() {
      const res = await installApi.getAgreement()
      this.agreementData = res.data || {}
      return res.data || {}
    },

    // 模拟环境检测
    async checkEnvironment() {
      this.environmentData.loading = true
      const res = await installApi.environment()
      this.environmentData.check_items = res.data?.check_items || []
      this.environmentData.directory_check_items = res.data?.directory_check_items || []
      this.environmentData.loading = false
      console.log(this.environmentData.loading)

    },

    
    async simulateInstallation() {
      try {
        // 开始安装
        this.startInstall()

        const config = getConfig()
        const params = new URLSearchParams()

        // 数据库配置参数
        params.append('db_host', this.databaseConfig.host || '')
        params.append('db_port', this.databaseConfig.port?.toString() || '')
        params.append('db_database', this.databaseConfig.database || '')
        params.append('db_username', this.databaseConfig.username || '')
        params.append('db_password', this.databaseConfig.password || '')
        params.append('db_prefix', this.databaseConfig.prefix || '')

        // 管理员配置参数
        params.append('admin_username', this.adminConfig.username || '')
        params.append('admin_password', this.adminConfig.password || '')
        params.append('admin_email', this.adminConfig.email || '')
        params.append('site_name', this.adminConfig.site_name || '')

        // 拼接完整的 SSE URL
        const sseUrl = `${config.apiBaseUrl}/install?${params.toString()}`.replace('//', '/')

        // 返回 Promise 以便外部可以等待安装完成
        return new Promise((resolve, reject) => {
          const eventSource = new EventSource(sseUrl)

          // 监听 progress 事件
          eventSource.addEventListener('progress', (event) => {
            try {
              const response = JSON.parse((event as MessageEvent).data)
              const data = response.data || {}

              console.log('进度消息:', response)

              // 更新进度和日志
              if (data.progress !== undefined) {
                this.updateProgress(data.progress, data.message || '安装进行中...')
              } else {
                // 如果没有进度值，只记录消息
                this.install_logs.push(`[${new Date().toLocaleTimeString()}] ${data.message || '安装进行中...'}`)
              }
            } catch (error) {
              console.error('解析进度消息失败:', error)
            }
          })

          // 监听 runtime_error 事件
          eventSource.addEventListener('runtime_error', (event) => {
            try {
              const response = JSON.parse((event as MessageEvent).data)
              const data = response.data || {}
              if (data.status === 'error') {
                this.updateProgress(100, data.message || '安装异常...')
              }
              this.installFailed(data.message || '安装异常...')
              eventSource.close()
              resolve(response)
            } catch (error) {
              eventSource.close()
              console.error('解析进度消息失败:', error)
            }
          })

          // 监听 completed 事件
          eventSource.addEventListener('completed', (event) => {
            try {
              const response = JSON.parse((event as MessageEvent).data)
              const data = response.data || {}
              this.installComplete()
              eventSource.close()
              resolve(response)
            } catch (error) {
              console.error('解析完成消息失败:', error)
              eventSource.close()
              reject(error)
            }
          })

          // 监听通用的 message 事件
          eventSource.onmessage = (event) => {
            try {
              const response = JSON.parse(event.data)
              const data = response.data || {}
              const message = data.message || response.message || '安装进行中...'
              this.install_logs.push(`[${new Date().toLocaleTimeString()}] ${message}`)
            } catch (error) {
              console.error('解析通用消息失败:', error)
            }
          }


          // 设置超时处理（10分钟）
          const timeout = setTimeout(() => {
            if (eventSource.readyState !== EventSource.CLOSED) {
              console.warn('SSE 连接超时')
              this.installFailed('安装超时')
              eventSource.close()
              reject(new Error('安装超时'))
            }
          }, 1000000)

          // 清理超时定时器
          eventSource.addEventListener('completed', () => {
            clearTimeout(timeout)
          })
        })

      } catch (error) {
        console.error('安装初始化失败:', error)
        this.installFailed('安装初始化失败')
        throw error
      }
    },

    // 更新数据库配置
    updateDatabaseConfig(config: Partial<DatabaseConfig>) {
      this.databaseConfig = { ...this.databaseConfig, ...config }
    },

    // 更新管理员配置
    updateAdminConfig(config: Partial<AdminConfig>) {
      this.adminConfig = { ...this.adminConfig, ...config }
    },

    // 开始安装
    startInstall() {
      this.install_status = 'installing'
      this.install_start_time = new Date()
      this.install_end_time = null
      this.install_progress = 0
      this.install_logs = ['开始安装...']
    },

    // 更新安装进度
    updateProgress(progress: number, log: string) {
      this.install_progress = progress
      this.install_logs.push(`[${new Date().toLocaleTimeString()}] ${log}`)
    },

    // 安装完成
    installComplete() {
      this.install_status = 'success'
      this.install_end_time = new Date()
      this.install_progress = 100
      this.install_logs.push(`安装完成，耗时: ${this.formattedDuration}`)
    },

    // 安装失败
    installFailed(error: string) {
      this.install_status = 'error'
      this.install_end_time = new Date()
      this.install_logs.push(`安装失败: ${error}`)
    },
    // 标记安装完成
    markInstallationCompleted() {
      this.installation_completed = true
      this.installation_completed_time = new Date()
    },
    // 检查安装状态
    checkInstallationStatus() {
      return this.installation_completed
    },

    // 重置安装状态
    resetInstall() {
      this.install_progress = 0
      this.install_logs = []
      this.install_status = 'idle'
      this.install_start_time = null
      this.install_end_time = null
    }
  }
})