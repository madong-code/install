<template>
  <div class="environment-step">
    <div class="step-content">
      <div class="environment-content">
        <el-table :data="environmentCheckItems" v-loading="loading" class="flat-table">
          <el-table-column prop="name" label="项目" width="200" />
          <el-table-column prop="required" label="要求" width="150" />
          <el-table-column prop="current" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" class="flat-tag">
                {{ row.statusText }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="要求" width="100">
            <template #default="{ row }">
              <span v-if="row.isRequired" class="flat-tag required-tag"> 必须 </span>
              <span v-else class="optional-text">可选</span>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" />
        </el-table>

        <div class="check-result" v-if="!loading">
          <el-alert
            :title="checkResult.title"
            :type="checkResult.type"
            :description="checkResult.description"
            show-icon
            :closable="false"
            class="flat-alert"
          />
        </div>
      </div>
    </div>

    <div class="step-actions">
      <el-button @click="$emit('prev')" class="flat-button">
        <el-icon><ArrowLeft /></el-icon>
        上一步
      </el-button>

      <div>
        <el-button @click="recheckEnvironment" :loading="loading" class="flat-button">
          <el-icon><Refresh /></el-icon>
          重新检测
        </el-button>
        <el-button
          type="primary"
          :disabled="!environmentPassed"
          @click="handleNext"
          class="flat-button primary"
        >
          下一步 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {  reactive, onMounted, computed } from "vue";
import { ArrowLeft, ArrowRight, Refresh } from "@element-plus/icons-vue";
import { useInstallStore } from "@/store/module/install";
import { publicConfig } from '@/utils/config'

const installStore = useInstallStore();

// 使用store中的环境检测数据
const loading = computed(() => installStore.environmentData.loading);
const environmentCheckItems = computed(() => installStore.environmentCheckItems);
const environmentPassed = computed(() => installStore.environmentPassed);

const checkResult = reactive({
  title: computed(() => {
    if (loading.value) return "检测中...";
    return environmentPassed.value ? "环境检测通过" : "环境检测未通过";
  }),
  type: computed(() => {
    if (loading.value) return "info";
    return environmentPassed.value ? "success" : "danger";  // 修改为 danger
  }) as any,
  description: computed(() => {
    if (loading.value) return "正在检测系统环境...";

    if (environmentPassed.value) {
      return "所有环境要求都已满足，可以继续安装";
    } else {
      //@ts-ignore
      const requiredErrors = environmentCheckItems.value.filter((item) => item.isRequired && item.status === "error"
      );
      return `有 ${requiredErrors.length} 个强制要求未达标，请解决后重新检测`;
    }
  }),
});

onMounted(() => {
  checkEnvironment();
});

const checkEnvironment = async () => {
  await installStore.checkEnvironment();
};

const recheckEnvironment = () => {
  checkEnvironment();
};

const handleNext = () => {
  if (environmentPassed.value) {
    emit("next");
  }
};


const getStatusType = (status: string): "success" | "warning" | "danger" => {
  if (status === 'success' || status === 'warning' || status === 'error') {
    return status === 'error' ? 'danger' : status;
  }
  // 默认返回 success 类型
  return 'success';
};


const emit = defineEmits<{
  prev: [];
  next: [];
}>();
</script>

<style lang="scss" scoped>
.environment-step {
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

  .flat-table {
    .required-tag {
      background: #fef0f0;
      color: #f56c6c;
      border: none;
      font-size: 12px;
    }

    .optional-text {
      color: #909399;
      font-size: 12px;
    }
  }

  .check-result {
    margin-top: 20px;
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
