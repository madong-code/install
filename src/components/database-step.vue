<template>
  <div class="database-step">
    <el-card class="step-card">
      <div class="database-content">
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" label-position="left">
          <el-form-item label="数据库主机" prop="host">
            <el-input v-model="formData.host" placeholder="localhost" />
          </el-form-item>

          <el-form-item label="数据库端口" prop="port">
            <el-input-number v-model="formData.port" :min="1" :max="65535" />
          </el-form-item>

          <el-form-item label="用户名" prop="username">
            <el-input v-model="formData.username" placeholder="root" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="数据库密码"
            />
          </el-form-item>

          <el-form-item label="数据库名" prop="database">
            <el-input v-model="formData.database" placeholder="madong" />
          </el-form-item>

          <el-form-item label="表前缀" prop="prefix">
            <el-input v-model="formData.prefix" placeholder="md_" />
          </el-form-item>
        </el-form>

        <div class="test-section">
          <div v-if="testResult" class="test-result">
            <el-alert
              :title="testResult.title"
              :type="testResult.type"
              :description="testResult.description"
              show-icon
            />
          </div>
        </div>
      </div>

      <div class="step-actions">
        <el-button @click="$emit('prev')">
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>

        <div>
          <el-button type="primary" @click="testConnection" :loading="testing">
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
          <el-button type="primary" :disabled="!formValid" @click="handleNext">
            下一步 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { DataBoard, ArrowLeft, ArrowRight, Connection } from "@element-plus/icons-vue";
import { useInstallStore } from "@/store/module/install";
import type { FormInstance, FormRules } from "element-plus";
import { publicConfig } from "@/utils/config";

const installStore = useInstallStore();
const formRef = ref<FormInstance>();
const testing = ref(false);

// 使用store中的数据库配置数据
const formData = reactive({ ...installStore.databaseConfig });

const testResult = ref<{
  title: string;
  type: "success" | "error";
  description: string;
} | null>(null);

const formValid = computed(() => {
  return (
    formData.host &&
    formData.port &&
    formData.username &&
    formData.database &&
    formData.prefix
  );
});

const rules: FormRules = {
  host: [{ required: true, message: "请输入数据库主机", trigger: "blur" }],
  port: [{ required: true, message: "请输入数据库端口", trigger: "blur" }],
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  database: [{ required: true, message: "请输入数据库名", trigger: "blur" }],
  prefix: [{ required: true, message: "请输入表前缀", trigger: "blur" }],
};

const testConnection = async () => {
  testing.value = true;
  testResult.value = null;

  // 模拟连接测试
  setTimeout(() => {
    testing.value = false;
    testResult.value = {
      title: "连接成功",
      type: "success",
      description: "数据库连接测试通过，可以继续安装",
    };

    // 更新store中的配置
    installStore.updateDatabaseConfig(formData);
  }, 1000);
};

const handleNext = async () => {
  if (formRef.value) {
    try {
      await formRef.value.validate();
      // 保存配置到store
      installStore.updateDatabaseConfig(formData);
      emit("next");
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  }
};

const emit = defineEmits<{
  prev: [];
  next: [];
}>();
</script>

<style lang="scss" scoped>
.database-step {
  .step-card {
    border: none !important;
    box-shadow: none !important;
    background: transparent;

    :deep(.el-card__header) {
      border-bottom: none;
      padding: 0 0 20px 0;
    }

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  // .test-section {
  //   margin-top: 20px;
  //   padding: 20px;
  //   background: #f8f9fa;
  //   border-radius: 4px;

  //   .test-result {
  //     margin-top: 15px;
  //   }
  // }

  .step-actions {
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
