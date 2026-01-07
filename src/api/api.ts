import { publicConfig } from '@/utils/config'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const api = axios.create({

    baseURL: publicConfig.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    ElMessage.error('请求失败，请检查网络连接')
    return Promise.reject(error)
  }
)

// 安装相关 API
export const installApi = {
  // 环境检测
  checkEnvironment: () => api.get('/install/environment/check'),
  
  // 测试数据库连接
  testDatabase: (data: any) => api.post('/install/database/test', data),
  
  // 创建数据库
  createDatabase: (data: any) => api.post('/install/database/create', data),
  
  // 开始安装
  startInstall: (data: any) => api.post('/install/start', data)
}

// SSE 服务
export class InstallProgressService {
  private eventSource: EventSource | null = null
  private onProgressCallback: ((data: any) => void) | null = null
  private onErrorCallback: ((error: any) => void) | null = null

  connect(onProgress: (data: any) => void, onError: (error: any) => void) {
    this.onProgressCallback = onProgress
    this.onErrorCallback = onError
    
    try {
      this.eventSource = new EventSource('/install/progress')
      
      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        onProgress(data)
      }
      
      this.eventSource.onerror = (error) => {
        onError(error)
      }
    } catch (error) {
      onError(error)
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

export default api