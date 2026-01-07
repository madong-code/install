import { defineStore } from 'pinia'

export interface AgreementData {
  title: string
  content: string
  version: string
  update_time: string
}

export interface EnvironmentCheckItem {
  name: string
  required: string
  current: string
  status: 'success' | 'warning' | 'danger'|'error'
  status_text: string
  message: string
  is_required: boolean
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
      passed: false,
      loading: false
    },
    // 数据库配置
    databaseConfig: {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'madong',
      prefix: 'md_'
    } as DatabaseConfig,
    // 管理员配置
    adminConfig: {
      username: 'admin',
      password: '123456',
      email: 'admin@madong.tech',
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
        item => item.is_required && item.status === 'error'
      )

      return !hasRequiredError
    },

    // 前端使用的数据格式（驼峰命名）
    environmentCheckItems: (state) => {
      return state.environmentData.check_items.map(item => ({
        name: item.name,
        required: item.required,
        current: item.current,
        status: item.status,
        statusText: item.status_text,
        message: item.message,
        isRequired: item.is_required
      }))
    }
  },

  actions: {
    // 模拟获取协议数据（后端格式）
    async fetchAgreementData() {
      const mockAgreementData: AgreementData = {
        title: 'Madong 管理系统许可协议',
        version: 'v1.0.0',
        update_time: '2024-01-01',
        content: `
          <p>欢迎使用 Madong 管理系统！</p>
          <p>在安装和使用本系统前，请仔细阅读以下协议：</p>
          <h3>1. 许可范围</h3>
          <p>本系统采用开源协议，允许个人和企业免费使用。</p>
          <h3>2. 使用限制</h3>
          <p>禁止用于非法用途，禁止恶意攻击系统。</p>
          <h3>3. 技术支持</h3>
          <p>官方提供技术支持和文档服务。</p>
          <h3>4. 免责声明</h3>
          <p>使用本系统产生的风险由用户自行承担。</p>
        `
      }
      this.agreementData = mockAgreementData
      return mockAgreementData
    },

    // 模拟环境检测（后端格式）
    async checkEnvironment() {
      this.environmentData.loading = true

      // 模拟异步检测
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          this.environmentData.check_items = [
            {
              name: 'PHP版本',
              required: '>= 7.4',
              current: '8.1.0',
              status: 'success',
              status_text: '通过',
              message: 'PHP版本符合要求',
              is_required: true
            },
            {
              name: 'MySQL扩展',
              required: '已安装',
              current: '已安装',
              status: 'success',
              status_text: '通过',
              message: 'MySQL扩展已安装',
              is_required: true
            },
            {
              name: '文件权限',
              required: '可写',
              current: '可写',
              status: 'success',
              status_text: '通过',
              message: '文件权限设置正确',
              is_required: true
            },
            {
              name: 'GD库',
              required: '已安装',
              current: '已安装',
              status: 'success',
              status_text: '通过',
              message: 'GD库已安装',
              is_required: false
            },
            {
              name: '内存限制',
              required: '>= 128M',
              current: '256M',
              status: 'success',
              status_text: '通过',
              message: '内存限制设置正确',
              is_required: false
            }
          ]

          this.environmentData.passed = this.environmentPassed
          this.environmentData.loading = false
          resolve()
        }, 1500)
      })
    },

    // 模拟SSE安装进度
    async simulateInstallation() {
      this.startInstall()

      const steps = [
        { progress: 10, log: '检查安装环境...' },
        { progress: 20, log: '创建数据库表结构...' },
        { progress: 40, log: '导入基础数据...' },
        { progress: 60, log: '配置管理员账户...' },
        { progress: 80, log: '初始化系统设置...' },
        { progress: 90, log: '清理临时文件...' },
        { progress: 100, log: '安装完成!' }
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.updateProgress(step.progress, step.log)

        // 模拟控制台输出
        console.log(`[${new Date().toLocaleTimeString()}] ${step.log}`)
      }

      this.installComplete()
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
      // 这里可以添加从后端检查安装状态的逻辑
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