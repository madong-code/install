<template>
  <div class="install-app">
    <!-- 头部导航栏 -->
    <header class="install-header">
      <div class="header-container">
        <div class="logo-section">
          <el-image :src="logoUrl" class="logo" fit="contain" />
          <span class="logo-text">{{
            siteInfo.name || "MD-Admin 极速后台开发框架"
          }}</span>
        </div>
        <div class="nav-links">
          <el-link
            :icon="ChatDotRound"
            :href="siteInfo.officialWebsite"
            target="_blank"
            type="primary"
          >
            官方网站
          </el-link>
          <el-link
            :icon="ChatDotRound"
            :href="siteInfo.community"
            target="_blank"
            type="primary"
          >
            技术论坛
          </el-link>
          <el-link
            :icon="Document"
            :href="siteInfo.documentation"
            target="_blank"
            type="primary"
          >
            开发文档
          </el-link>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="install-container">
        <!-- 步骤条 -->
        <el-steps :active="currentStep" align-center class="install-steps">
          <el-step title="许可协议" />
          <el-step title="环境检测" />
          <el-step title="数据库配置" />
          <el-step title="参数配置" />
          <el-step title="安装完成" />
        </el-steps>

        <!-- 步骤内容 -->
        <div class="step-content">
          <!-- 步骤1：许可协议 -->
          <agreement-step v-if="currentStep === 1" @next="handleNextStep" />

          <!-- 步骤2：环境检测 -->
          <environment-step
            v-else-if="currentStep === 2"
            @prev="handlePrevStep"
            @next="handleNextStep"
          />

          <!-- 步骤3：数据库配置 -->
          <database-step
            v-else-if="currentStep === 3"
            @prev="handlePrevStep"
            @next="handleNextStep"
          />

          <!-- 步骤4：参数配置 -->
          <config-step
            v-else-if="currentStep === 4"
            @prev="handlePrevStep"
            @start-install="startInstallation"
          />

          <!-- 步骤5：安装完成 -->
          <complete-step v-else-if="currentStep === 5" :install-data="installData" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { ChatDotRound, Document } from "@element-plus/icons-vue";
import { useInstallStore } from "./store/module/install";
import AgreementStep from "./components/agreement-step.vue";
import EnvironmentStep from "./components/environment-step.vue";
import DatabaseStep from "./components/database-step.vue";
import ConfigStep from "./components/config-step.vue";
import CompleteStep from "./components/complete-step.vue";
import { initConfig, getConfig } from "./utils/config";
import { p } from "vue-router/dist/router-CWoNjPRp.mjs";



const currentStep = ref(1);
const installData = reactive({
  agreementAccepted: false,
  environmentChecked: false,
  databaseConfig: {},
  adminConfig: {},
});

const installStore = useInstallStore();
const logoUrl = ref("./public/logo.png");
const siteInfo = ref({
  name: "",
  officialWebsite: "",
  community: "",
  documentation: "",
});


// 动态设置页面标题
function setDocumentTitle(title?: string) {
  const config = getConfig() // 动态获取配置
  const defaultTitle = 'MDAdmin 安装向导'
  const finalTitle = title || config.installInfo.title || defaultTitle
  document.title = finalTitle
}


// 组件挂载时检查安装状态
onMounted(async () => {
  // 初始化配置
  await initConfig();
  await installStore.fetchInstallationStatus();
  const config= getConfig()
  logoUrl.value=  config.siteInfo.logo||'./logo.png'
  siteInfo.value = config.siteInfo;
  setDocumentTitle(config.installInfo.title)

  if (installStore.checkInstallationStatus()) {
    currentStep.value = 5; // 如果已安装，直接跳转到完成页面
  }
});

const handleNextStep = () => {
  if (currentStep.value < 5) {
    currentStep.value++;
  }
};

const handlePrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const startInstallation = (config: any) => {
  installData.adminConfig = config;
  // 不再立即跳转，等待安装完成
};

// 监听安装状态变化，安装完成后自动跳转
watch(
  () => installStore.install_status,
  (newStatus) => {
    if (newStatus === "success" && currentStep.value === 4) {
      // 标记安装完成
      installStore.markInstallationCompleted();
      // 安装完成后跳转到完成页面
      setTimeout(() => {
        handleNextStep();
      }, 5000);
    }
  }
);
</script>

<style lang="scss" scoped>
.install-app {
  min-height: 100vh;
  background: #f5f7fa;
}

.install-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    padding: 0 20px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;

    .logo {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: #409eff;
    }
  }

  .nav-links {
    display: flex;
    gap: 24px;

    .el-link {
      font-size: 14px;
    }
  }
}

.main-content {
  margin-top: 60px;
  padding: 20px;
}

.install-container {
  max-width: 1000px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.install-steps {
  margin-top: 20px;
  margin-bottom: 20px;
}

.step-content {
  min-height: 400px;
  padding-left: 50px;
  padding-right: 50px;
}
</style>
