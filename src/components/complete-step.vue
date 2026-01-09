<template>
  <div class="complete-step">
    <div class="complete-content">
      <div class="success-message">
        <div class="success-icon">
          <el-icon color="#67c23a" size="64"><SuccessFilled /></el-icon>
        </div>
        <h1 class="success-title">安装成功！</h1>
        <!-- <p class="success-subtitle">Madong 管理系统已成功安装</p> -->

        <div class="access-links">
          <el-button type="primary" size="default" @click="goToAdmin" class="flat-button primary">
            <el-icon><Monitor /></el-icon>
            进入后台
          </el-button>
          <el-button type="success" size="default" @click="goToFrontend" class="flat-button success">
            <el-icon><House /></el-icon>
            访问前端
          </el-button>
          <el-button type="warning" size="default" @click="goToCommunity" class="flat-button warning">
            <el-icon><ChatDotRound /></el-icon>
            访问社区
          </el-button>
          <el-button type="info" size="default" @click="goToConfig" class="flat-button info">
            <el-icon><Setting /></el-icon>
            参数配置
          </el-button>
        </div>

        <div class="security-notice">
          <el-alert
            title="安全提示"
            type="warning"
            description="为了系统安全，建议您删除 app/install目录或设置访问权限,如需重新安装,请删除 install.lock 跟config/database.php文件"
            show-icon
            :closable="false"
            class="flat-alert"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { 
  SuccessFilled, Monitor, ChatDotRound, House, Setting 
} from '@element-plus/icons-vue'
import { useInstallStore } from '@/store/module/install'
import { getConfig } from '@/utils/config'

const installStore = useInstallStore()

interface Props {
  installData: any
}

const props = defineProps<Props>()

// 使用ref来存储当前域名和配置信息
const currentOrigin = ref('')
const siteInfo = ref({
  name: '',
  officialWebsite: '',
  community: '',
  documentation: ''
})

const installTime = computed(() => {
  return new Date().toLocaleString('zh-CN')
})

const installDuration = computed(() => {
  return installStore.formattedDuration
})

// 在组件挂载后获取当前域名和配置信息
onMounted(() => {
  if (typeof window !== 'undefined') {
    currentOrigin.value = window.location.origin
  }
  // 动态获取配置信息
  const config = getConfig()
  siteInfo.value = config.siteInfo
})

const goToAdmin = () => {
  window.open('/admin', '_blank')
}

const goToCommunity = () => {
  window.open(siteInfo.value.community || 'https://madong.tech/question/', '_blank')
}

const goToFrontend = () => {
  window.open('/', '_blank')
}

const goToConfig = () => {
  window.open('/admin#/system/config', '_blank')
}

</script>

<style lang="scss" scoped>
.complete-step {
  .complete-content {
    padding: 40px;
    
    .success-message {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
      
      .success-icon {
        margin-bottom: 20px;
      }
      
      .success-title {
        font-size: 32px;
        color: #67c23a;
        margin-bottom: 8px;
        font-weight: 600;
      }
      
      .success-subtitle {
        font-size: 16px;
        color: #606266;
        margin-bottom: 40px;
      }
      
      .access-links {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin: 40px 0;
        flex-wrap: wrap;
        
        .flat-button {
          min-width: 140px;
          // height: 48px;
          font-size: 14px;
          
          &.success {
            background: #67c23a;
            border-color: #67c23a;
            
            &:hover {
              background: #85ce61;
              border-color: #85ce61;
            }
          }
          
          &.warning {
            background: #e6a23c;
            border-color: #e6a23c;
            
            &:hover {
              background: #ebb563;
              border-color: #ebb563;
            }
          }
          
          &.info {
            background: #909399;
            border-color: #909399;
            
            &:hover {
              background: #a6a9ad;
              border-color: #a6a9ad;
            }
          }
        }
      }
      
      .install-info {
        margin: 40px 0;
        text-align: left;
        background: #f8f9fa;
        padding: 24px;
        border-radius: 6px;
        
        h3 {
          margin-bottom: 16px;
          color: #303133;
          font-size: 18px;
          text-align: center;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e4e7ed;
            
            .label {
              color: #606266;
              font-weight: 500;
            }
            
            .value {
              color: #303133;
              font-weight: 600;
            }
          }
        }
      }
      
      .security-notice {
        margin-top: 24px;
      }
    }
  }
}
</style>