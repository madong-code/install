import { getConfig } from './config'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  showError?: boolean
  retryCount?: number
}

// 响应数据结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 单例axios实例
let axiosInstance: AxiosInstance | null = null
let isInitialized = false

// 初始化axios实例（延迟初始化）
function initializeAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    // 动态获取当前配置（确保配置已初始化）
    const config = getConfig()
    console.log('🚀 初始化axios实例，使用配置:', config.apiBaseUrl)
    
    axiosInstance = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // 请求拦截器
    axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`🚀 请求: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('❌ 请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )
    
    // 响应拦截器
    axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ 响应: ${response.status} ${response.config.url}`)
        return response.data
      },
      (error) => {
        console.error('❌ 响应拦截器错误:', error)
        
        // 统一错误处理
        if (error.response) {
          const { status, data } = error.response
          switch (status) {
            case 401:
              ElMessage.error('未授权，请重新登录')
              break
            case 403:
              ElMessage.error('拒绝访问')
              break
            case 404:
              ElMessage.error('请求的资源不存在')
              break
            case 500:
              ElMessage.error('服务器内部错误')
              break
            default:
              ElMessage.error(data?.message || '请求失败，请检查网络连接')
          }
        } else if (error.request) {
          ElMessage.error('网络错误，请检查网络连接')
        } else {
          ElMessage.error('请求配置错误')
        }
        
        return Promise.reject(error)
      }
    )
    
    isInitialized = true
  }
  return axiosInstance
}

// 检查并重新初始化（用于配置变更后）
export function reinitializeRequest() {
  if (axiosInstance) {
    axiosInstance = null
    isInitialized = false
    console.log('🔄 重新初始化request实例')
  }
}

// 统一的请求方法封装
export class RequestClient {
  private getInstance(): AxiosInstance {
    return initializeAxiosInstance()
  }
  
  // GET请求
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.getInstance().get(url, config)
  }
  
  // POST请求
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.getInstance().post(url, data, config)
  }
  
  // PUT请求
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.getInstance().put(url, data, config)
  }
  
  // DELETE请求
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.getInstance().delete(url, config)
  }
  
  // 上传文件
  async upload<T = any>(url: string, formData: FormData, config?: RequestConfig): Promise<T> {
    const uploadConfig: RequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    }
    return this.getInstance().post(url, formData, uploadConfig)
  }
  
  // 下载文件
  async download(url: string, config?: RequestConfig): Promise<Blob> {
    const downloadConfig: RequestConfig = {
      ...config,
      responseType: 'blob'
    }
    return this.getInstance().get(url, downloadConfig)
  }
}

// 创建默认请求客户端实例
export const request = new RequestClient()

// 快捷方法导出（延迟初始化版本）
export const get = (url: string, config?: RequestConfig) => request.get(url, config)
export const post = (url: string, data?: any, config?: RequestConfig) => request.post(url, data, config)
export const put = (url: string, data?: any, config?: RequestConfig) => request.put(url, data, config)
export const del = (url: string, config?: RequestConfig) => request.delete(url, config)

export default request