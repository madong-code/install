<template>
  <div class="agreement-step">
    <div class="step-content">
      <div class="check-status" v-loading="loading">
        <el-result
          icon="info"
          title="安装状态检测"
          sub-title="正在检测系统安装状态..."
        >
          <template #extra>
            <el-card class="status-card" shadow="hover">
              <div class="status-item">
                <span class="status-label">安装状态：</span>
                <el-tag :type="isInstalled ? 'success' : 'warning'" size="large">
                  {{ isInstalled ? '已安装' : '未安装' }}
                </el-tag>
              </div>
              <div class="status-item" v-if="installStatus">
                <span class="status-label">安装时间：</span>
                <span class="status-value">{{ installStatus }}</span>
              </div>
              <div class="status-item" v-if="!isInstalled">
                <el-alert
                  title="系统未安装，将引导您完成安装"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
            </el-card>
          </template>
        </el-result>
      </div>
    </div>

    <div class="step-actions">
      <el-button 
        v-if="!isInstalled" 
        type="primary" 
        @click="handleContinue" 
        class="flat-button primary"
      >
        开始安装 <el-icon><ArrowRight /></el-icon>
      </el-button>
      <el-button 
        v-else 
        type="primary" 
        @click="handleGoToAdmin" 
        class="flat-button primary"
      >
        访问后台 <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { useInstallStore } from '@/store/module/install'

const installStore = useInstallStore()
const loading = ref(false)
const installStatus = ref('') as any

// 使用store中的安装状态
const isInstalled = computed(() => installStore.checkInstallationStatus())

onMounted(async () => {
  await checkInstallStatus()
})

const checkInstallStatus = async () => {
  try {
    loading.value = true
    await installStore.fetchInstallationStatus()
    // 从 store 获取安装时间
    installStatus.value = installStore.install_end_time || ''
  } catch (error) {
    console.error('检测安装状态失败:', error)
  } finally {
    loading.value = false
  }
}

const handleContinue = () => {
  emit('next')
}

const handleGoToAdmin = () => {
  window.location.href = '/admin'
}

const emit = defineEmits<{
  next: []
}>()
</script>

<style lang="scss" scoped>
.agreement-step {
  .step-content {
    min-height: 400px;
    
    .check-status {
      padding: 20px;
    }
    
    .status-card {
      max-width: 400px;
      margin: 0 auto;
      
      .status-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .status-label {
          font-weight: 500;
          color: #606266;
        }
        
        .status-value {
          color: #909399;
        }
      }
    }
  }

  .step-actions {
    margin-top: 30px;
    display: flex;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>
