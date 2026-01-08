<template>
  <div class="config-step">
    <div class="step-content">
      <!-- 安装进度显示 -->
      <div v-if="installing" class="install-progress">
        <div class="console-output">
          <div class="console-logs">
            <div v-for="(log, index) in installLogs" :key="index" class="log-line">
              <span class="timestamp">{{ log.split(']')[0] }}]</span>
              <span class="message">{{ log.split(']')[1] }}</span>
            </div>
          </div>
        </div>
        <div class="progress-section">
          <el-progress 
            :percentage="installProgress" 
            :status="installStatus === 'error' ? 'exception' : installStatus === 'success' ? 'success' : undefined"
            :stroke-width="6"
          />
          <div class="progress-text">
            安装进度: {{ installProgress }}%
            <span v-if="installStatus === 'success'" class="success-text">✓ 安装完成</span>
            <span v-else-if="installStatus === 'error'" class="error-text">✗ 安装失败</span>
            <span v-else class="installing-text">● 安装中...</span>
          </div>
        </div>
      </div>

      <!-- 配置表单（安装前显示） -->
      <div v-else class="config-form">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" class="flat-form" label-position="left">
          <el-form-item label="管理员账号" prop="username">
            <el-input v-model="formData.username" placeholder="admin" class="flat-input" />
          </el-form-item>
          
          <el-form-item label="管理员密码" prop="password">
            <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password class="flat-input" />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="formData.confirmPassword" type="password" placeholder="请再次输入密码" show-password class="flat-input" />
          </el-form-item>
          
          <el-form-item label="邮箱地址" prop="email">
            <el-input v-model="formData.email" placeholder="admin@madong.tech" class="flat-input" />
          </el-form-item>
          
          <el-form-item label="网站名称" prop="siteName">
            <el-input v-model="formData.siteName" placeholder="Madong管理系统" class="flat-input" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="step-actions">
      <el-button @click="$emit('prev')" class="flat-button">
        <el-icon><ArrowLeft /></el-icon>
        上一步
      </el-button>
 
        

      <el-button 
        type="primary" 
        :loading="installStatus === 'installing'"
        @click="startInstallation"
        class="flat-button primary"
        :disabled="installStatus !== 'idle'"
      >
        <el-icon><VideoPlay /></el-icon>
        {{ installing ? '安装中...' : '开始安装' }}
      </el-button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import { ArrowLeft, VideoPlay } from '@element-plus/icons-vue'
import { useInstallStore } from '@/store/module/install'
import type { FormInstance, FormRules } from 'element-plus'
import { f } from 'vue-router/dist/router-CWoNjPRp.mjs'

const installStore = useInstallStore()
const formRef = ref<FormInstance>()

  

const installing = ref(false)

// 使用store中的管理员配置数据
const formData = reactive({
  username: installStore.adminConfig.username,
  password: installStore.adminConfig.password,
  confirmPassword: installStore.adminConfig.password,
  email: installStore.adminConfig.email,
  siteName: installStore.adminConfig.site_name
})

// 安装相关数据
const installProgress = computed(() => installStore.install_progress)
const installStatus = computed(() => installStore.install_status) 
const installLogs = computed(() => installStore.install_logs)

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  siteName: [
    { required: true, message: '请输入网站名称', trigger: 'blur' }
  ]
}


const startInstallation = async () => {
  installing.value = true
  if (formRef.value) {
    try {
      await formRef.value.validate()
      
    
      // 保存配置到store
      installStore.updateAdminConfig({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        site_name: formData.siteName
      })
      
      await installStore.simulateInstallation()
    
    } catch (error) {
      installing.value = false
    }
  }
}


// 清理
onUnmounted(() => {
  if (installing.value) {
    installStore.resetInstall()
  }
})

const emit = defineEmits<{
  prev: []
  'start-install': [config: any]
}>()
</script>

<style lang="scss" scoped>
.config-step {
  .step-content {
    min-height: 400px;
    
    .step-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e4e7ed;
    }
  }

  .config-form {
    .flat-form {
      .el-form-item {
        margin-bottom: 20px;
        
        .el-form-item__label {
          font-weight: 500;
          color: #606266;
        }
      }
    }
  }

  .install-progress {
    .console-output {
      margin-bottom: 20px;
      
      h4 {
        margin-bottom: 10px;
        color: #303133;
        font-size: 14px;
      }
      
      .console-logs {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 15px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-height: 300px;
        overflow-y: auto;
        
        .log-line {
          line-height: 1.5;
          margin-bottom: 4px;
          display: flex;
          
          .timestamp {
            color: #6a9955;
            margin-right: 8px;
          }
          
          .message {
            color: #d4d4d4;
          }
        }
      }
    }
    
    .progress-section {
      .progress-text {
        margin-top: 10px;
        text-align: center;
        color: #606266;
        font-size: 14px;
        
        .success-text {
          color: #67c23a;
          margin-left: 10px;
        }
        
        .error-text {
          color: #f56c6c;
          margin-left: 10px;
        }
        
        .installing-text {
          color: #409eff;
          margin-left: 10px;
        }
      }
    }
  }

  .step-actions {
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }

  .flat-button {
    border: 1px solid #dcdfe6;
    background: #fff;
    color: #606266;
    
    &:hover {
      border-color: #c0c4cc;
      background: #f5f7fa;
    }
    
    &.primary {
      background: #409eff;
      border-color: #409eff;
      color: #fff;
      
      &:hover {
        background: #66b1ff;
        border-color: #66b1ff;
      }
      
      &:disabled {
        background: #a0cfff;
        border-color: #a0cfff;
      }
    }
  }
}
</style>