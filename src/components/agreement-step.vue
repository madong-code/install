<template>
  <div class="agreement-step">
    <div class="step-content">
      <div class="agreement-content" v-loading="loading">
        <div v-if="agreementData" class="agreement-text">
          <div class="agreement-body" @mouseenter="showScrollbar" @mouseleave="hideScrollbar">
            <div v-html="agreementData.content"></div>
          </div>
        </div>
        <div v-else class="agreement-empty">
          <el-empty description="协议加载失败" />
        </div>

        <div class="agreement-actions">
          <el-checkbox v-model="agreed" :disabled="!agreementData">
            我已阅读并同意以上协议
          </el-checkbox>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <el-button type="primary" :disabled="!agreed" @click="handleAgree" class="flat-button primary">
        同意并继续 <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {  ArrowRight } from '@element-plus/icons-vue'
import { useInstallStore } from '@/store/module/install'
import { publicConfig } from '@/utils/config'

const installStore = useInstallStore()
const loading = ref(false)
const agreed = ref(false)

// 使用store中的协议数据
const agreementData = computed(() => installStore.agreementData)

onMounted(async () => {
  await loadAgreement()
})

const loadAgreement = async () => {
  try {
    loading.value = true
    // 从store获取模拟数据
    await installStore.fetchAgreementData()
  } catch (error) {
    console.error('加载协议失败:', error)
  } finally {
    loading.value = false
  }
}

const showScrollbar = (event: Event) => {
  const target = event.target as HTMLElement
  target.style.overflowY = 'auto'
}

const hideScrollbar = (event: Event) => {
  const target = event.target as HTMLElement
  target.style.overflowY = 'hidden'
}

const handleAgree = () => {
  if (agreed.value) {
    emit('next')
  }
}

const emit = defineEmits<{
  next: []
}>()
</script>

<style lang="scss" scoped>
.agreement-step {
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

  .agreement-content {
    .agreement-text {
      h2 {
        margin-bottom: 16px;
        color: #409eff;
        text-align: center;
      }
      
      .agreement-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        color: #666;
        font-size: 14px;
        justify-content: center;
      }
      
      .agreement-body {
        max-height: 400px;
        overflow-y: hidden;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 4px;
        line-height: 1.6;
        transition: overflow-y 0.3s ease;
        
        &:hover {
          overflow-y: auto;
        }
        
        h3 {
          margin: 16px 0 8px 0;
          color: #333;
        }
        
        p {
          margin-bottom: 12px;
        }
      }
    }
    
    .agreement-actions {
      margin-top: 20px;
      padding: 20px;
      background: #f0f7ff;
      border-radius: 4px;
      text-align: center;
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