<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { Check, Moon, Sunny } from '@element-plus/icons-vue';

import AgreementStep from './components/agreement-step.vue';
import CompleteStep from './components/complete-step.vue';
import ConfigStep from './components/config-step.vue';
import DatabaseStep from './components/database-step.vue';
import EnvironmentStep from './components/environment-step.vue';
import { useInstallStore } from './store/module/install';
import { getConfig, initConfig } from './utils/config';

const currentStep = ref(1);
const installData = reactive({
  agreementAccepted: false,
  environmentChecked: false,
  databaseConfig: {},
  adminConfig: {},
});
const installStore = useInstallStore();
/** 获取 public/logo.png 的正确路径 */
function getPublicLogoUrl() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}logo.png`;
}
const logoUrl = ref(getPublicLogoUrl());
const siteInfo = ref({
  name: '',
  officialWebsite: '',
  community: '',
  documentation: '',
});

const isDark = ref(false);
const htmlEl = document.documentElement;
htmlEl.dataset.theme = 'light';
htmlEl.classList.remove('dark');

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const html = document.documentElement;
  html.dataset.theme = isDark.value ? 'dark' : 'light';
  // Element Plus 暗黑模式需要切换 html.dark 类
  if (isDark.value) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

const steps = [
  { id: 1, title: '许可协议' },
  { id: 2, title: '环境检测' },
  { id: 3, title: '数据库配置' },
  { id: 4, title: '参数配置' },
  { id: 5, title: '安装完成' },
];

onMounted(async () => {
  await initConfig();
  await installStore.fetchInstallationStatus();
  const config = getConfig();
  const configLogo = config.siteInfo?.logo;
  logoUrl.value = configLogo || getPublicLogoUrl();
  siteInfo.value = config.siteInfo || {};
  if (installStore.checkInstallationStatus()) currentStep.value = 5;
});

const handleNextStep = () => { if (currentStep.value < 5) currentStep.value++; };
const handlePrevStep = () => { if (currentStep.value > 1) currentStep.value--; };
const startInstallation = (config: any) => { installData.adminConfig = config; };

watch(
  () => installStore.install_status,
  (s) => {
    if (s === 'success' && currentStep.value === 4) {
      installStore.markInstallationCompleted();
      setTimeout(() => handleNextStep(), 5000);
    }
  },
);
</script>

<template>
  <div class="install-app">
    <!-- 顶部导航 -->
    <header class="top-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-logo"><img :src="logoUrl" alt="logo" class="logo-img" /></div>
          <span class="brand-name">{{ siteInfo.name || 'Madong' }}</span>
        </div>
        <nav class="top-nav">
          <el-link :href="siteInfo.officialWebsite" target="_blank" class="nav-item">官方网站</el-link>
          <el-link :href="siteInfo.community" target="_blank" class="nav-item">技术论坛</el-link>
          <el-link :href="siteInfo.documentation" target="_blank" class="nav-item">开发文档</el-link>
          <div class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到明亮模式' : '切换到暗黑模式'">
            <el-icon :size="16"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
          </div>
        </nav>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="main-area">
      <div class="install-card">
        <!-- 步骤进度 -->
        <div class="steps-bar">
          <div v-for="(step, i) in steps" :key="step.id" class="step-node" :class="{ 'is-active': currentStep === step.id, 'is-done': currentStep > step.id, 'is-last': i === steps.length - 1 }">
            <div class="sn-indicator">
              <div class="sn-dot">
                <el-icon v-if="currentStep > step.id" :size="14"><Check /></el-icon>
                <span v-else class="sn-num">{{ step.id }}</span>
              </div>
              <div class="sn-label">{{ step.title }}</div>
            </div>
            <div v-if="i < steps.length - 1" class="sn-line" :class="{ 'line-done': currentStep > step.id }"></div>
          </div>
        </div>

        <!-- 步骤内容 -->
        <div class="step-wrap">
          <transition name="slide-up" mode="out-in">
            <AgreementStep v-if="currentStep === 1" key="s1" @next="handleNextStep" />
            <EnvironmentStep v-else-if="currentStep === 2" key="s2" @prev="handlePrevStep" @next="handleNextStep" />
            <DatabaseStep v-else-if="currentStep === 3" key="s3" @prev="handlePrevStep" @next="handleNextStep" />
            <ConfigStep v-else-if="currentStep === 4" key="s4" @prev="handlePrevStep" @start-install="startInstallation" />
            <CompleteStep v-else-if="currentStep === 5" key="s5" :install-data="installData" />
          </transition>
        </div>
      </div>
    </main>

    <!-- 底部版权 -->
    <footer class="bottom-footer">
      <span>&copy; {{ new Date().getFullYear() }} madong.tech. All rights reserved.</span>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.install-app { position: relative; display: flex; flex-direction: column; min-height: 100vh; background: var(--bg-body); transition: background 0.3s; }
.install-app::before { position: fixed; inset: 0; z-index: 0; pointer-events: none; content: ''; background: radial-gradient(ellipse 700px 500px at 20% 50%, var(--glow-blue) 0%, transparent 70%), radial-gradient(ellipse 600px 600px at 80% 30%, var(--glow-purple) 0%, transparent 70%); transition: background 0.3s; }
.install-app::after { position: fixed; inset: 0; z-index: 0; pointer-events: none; content: ''; background-image: linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, rgb(0 0 0 / 12%) 0%, transparent 80%); }
.top-header { position: sticky; top: 0; z-index: 100; background: var(--bg-nav); border-bottom: 1px solid var(--border-subtle); backdrop-filter: blur(16px); transition: background 0.3s, border-color 0.3s;
  .header-inner { display: flex; align-items: center; justify-content: space-between; max-width: 1200px; height: 56px; padding: 0 24px; margin: 0 auto; }
  .brand { display: flex; gap: 10px; align-items: center;
    .brand-logo { display: flex; align-items: center; width: 28px; height: 28px; .logo-img { width: auto; height: 100%; } }
    .brand-name { font-size: 16px; font-weight: 700; color: var(--text-primary); transition: color 0.3s; } }
  .top-nav { display: flex; gap: 16px; align-items: center;
    .nav-item { font-size: 13px; color: var(--text-tertiary); transition: color 0.2s; &:hover { color: #409eff; } }
    .theme-toggle { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; color: var(--text-tertiary); cursor: pointer; background: var(--btn-ghost-bg); border-radius: 8px; transition: all 0.2s; &:hover { color: #409eff; background: var(--btn-ghost-hover); } } } }
.main-area { position: relative; z-index: 10; display: flex; flex: 1; align-items: center; justify-content: center; padding: 36px 24px 24px; }
.install-card { width: 100%; max-width: 960px; padding: 0; background: transparent; }
.steps-bar { display: flex; align-items: center; padding: 0; margin-bottom: 24px;
  .step-node { display: flex; flex: 1; align-items: center; &.is-last { flex: none; }
    .sn-indicator { display: flex; gap: 8px; align-items: center;
      .sn-dot { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-size: 12px; font-weight: 600; color: var(--text-muted); background: var(--btn-ghost-bg); border-radius: 50%; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); .el-icon { color: #fff; } }
      .sn-label { font-size: 13px; font-weight: 500; color: var(--text-muted); white-space: nowrap; transition: color 0.35s; } }
    .sn-line { flex: 1; height: 2px; margin: 0 14px; background: var(--border-subtle); transition: background 0.4s; }
    &.is-active { .sn-dot { color: #fff; background: linear-gradient(135deg, #409eff, #6366f1); box-shadow: 0 0 18px rgb(64 158 255 / 30%); } .sn-label { font-weight: 600; color: var(--text-primary); } }
    &.is-done { .sn-dot { color: #fff; background: #34d399; } .sn-label { color: var(--text-secondary); } .sn-line { background: #34d399; } } } }
.step-wrap { min-height: 360px; padding: 32px 36px 28px; background: var(--bg-content); border-radius: 12px; transition: background 0.3s; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(14px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-14px); }
.bottom-footer { position: relative; z-index: 10; padding: 18px; font-size: 12px; color: var(--text-muted); text-align: center; background: var(--bg-nav); border-top: 1px solid var(--border-subtle); transition: color 0.3s, background 0.3s; }
@media (max-width: 768px) { .step-wrap { padding: 20px 16px; } .steps-bar { .step-node { .sn-label { display: none; } } } }
</style>
