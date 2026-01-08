<template>
  <div class="environment-step">
    <div class="step-content">
      <div class="environment-content">
        <!-- 环境要求检测 -->
        <div class="section">
          <h4 class="step-title">系统环境要求</h4>
          <el-table :data="environmentCheckItems"  class="flat-table" v-loading="loading">
            <el-table-column prop="name" label="检测项目" width="200" />
            <el-table-column prop="need" label="要求" width="150" />
            <el-table-column prop="current" label="当前状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" class="flat-tag">
                  {{ row.statusText }}
                </el-tag>
              </template>
            </el-table-column>
          
            <el-table-column prop="message" label="详情状态" />
          </el-table>
        </div>

        <!-- 目录权限检测 -->
        <div class="section">
          <h4 class="step-title">权限要求</h4>
          <el-table :data="directoryCheckItems"  class="flat-table" v-loading="loading">
            <el-table-column prop="pathName" label="检查项目" width="150" />
            <el-table-column prop="path" label="路径" width="250">
              <template #default="{ row }">
                <span class="path-text">{{ row.path }}</span>
              </template>
            </el-table-column>
            <el-table-column label="要求" width="120">
              <template #default="{ row }">
                <el-tag :type="getPermissionType(row.permissionType)" class="flat-tag">
                  {{ getPermissionText(row.permissionType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status ? 'success' : 'danger'" class="flat-tag">
                  {{ row.status ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="详细状态" >
              <template #default="{ row }">
                <div class="status-details">
                  <span v-if="row.exists" class="status-item success">存在</span>
                  <span v-else class="status-item danger">不存在</span>
                  <span v-if="row.isReadable" class="status-item success">可读</span>
                  <span v-else class="status-item danger">不可读</span>
                  <span v-if="row.isWritable" class="status-item success">可写</span>
                  <span v-else class="status-item danger">不可写</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 检测结果汇总 -->
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
import { reactive, onMounted, computed } from "vue";
import { ArrowLeft, ArrowRight, Refresh } from "@element-plus/icons-vue";
import { useInstallStore } from "@/store/module/install";

const installStore = useInstallStore();

// 使用store中的环境检测数据
const loading = computed(() => installStore.environmentData.loading);
const environmentCheckItems = computed(() => installStore.environmentCheckItems);
const directoryCheckItems = computed(() => installStore.directoryCheckItems);
const environmentPassed = computed(() => installStore.environmentPassed);



// 计算目录权限检测结果
const directoryPassed = computed(() => {
  if (directoryCheckItems.value.length === 0) return false;
  
  const hasRequiredError = directoryCheckItems.value.some(
    item => item.required && !item.status
  );
  
  return !hasRequiredError;
});

const checkResult = reactive({
  title: computed(() => {
    if (loading.value) return "检测中...";
    const envPassed = environmentPassed.value;
    const dirPassed = directoryPassed.value;
    
    if (envPassed && dirPassed) return "环境检测通过";
    if (!envPassed && !dirPassed) return "环境检测未通过";
    if (!envPassed) return "系统环境未通过";
    return "目录权限未通过";
  }),
  type: computed(() => {
    if (loading.value) return "info";
    const envPassed = environmentPassed.value;
    const dirPassed = directoryPassed.value;
    return (envPassed && dirPassed) ? "success" : "danger";
  }) as any,
  description: computed(() => {
    if (loading.value) return "正在检测系统环境和目录权限...";

    const envPassed = environmentPassed.value;
    const dirPassed = directoryPassed.value;
    
    if (envPassed && dirPassed) {
      return "所有环境要求和目录权限都已满足，可以继续安装";
    } else {
      const envErrors = environmentCheckItems.value.filter(
        item => item.isRequired && item.status === false
      );
      const dirErrors = directoryCheckItems.value.filter(
        item => item.required && !item.status
      );
      
      const errors = [];
      if (envErrors.length > 0) errors.push(`${envErrors.length} 个系统环境要求`);
      if (dirErrors.length > 0) errors.push(`${dirErrors.length} 个目录权限要求`);
      
      return `有 ${errors.join(' 和 ')} 未达标，请解决后重新检测`;
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
  if (environmentPassed.value && directoryPassed.value) {
    emit("next");
  }
};

const getStatusType = (status: string): "success" | "warning" | "danger" => {
  if (status === "success" || status === "warning" || status === "error") {
    return status === "error" ? "danger" : status;
  }
  return "success";
};

const getPermissionType = (permissionType: string): "success" | "warning" | "info" => {
  switch (permissionType) {
    case 'read_write': return 'success';
    case 'read_only': return 'warning';
    case 'write_only': return 'info';
    default: return 'info';
  }
};

const getPermissionText = (permissionType: string): string => {
  switch (permissionType) {
    case 'read_write': return '读写';
    case 'read_only': return '只读';
    case 'write_only': return '只写';
    default: return permissionType;
  }
};

const emit = defineEmits<{
  prev: [];
  next: [];
}>();
</script>

<style lang="scss" scoped>
.environment-step {
  .step-content {
    min-height: 500px;

    .section {
      margin-bottom: 30px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    .step-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }
  }

  .flat-table {
    margin-bottom: 0;
    
    .path-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #666;
    }
    
    .status-details {
      display: flex;
      gap: 3px;
      
      .status-item {
        font-size: 11px;
        padding: 1px 4px;
        border-radius: 2px;
        
        &.success {
          background: #f0f9ff;
          color: #409eff;
        }
        
        &.danger {
          background: #fef0f0;
          color: #f56c6c;
        }
      }
    }

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