<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { useInstallStore } from '@/store/module/install';
import {
  ArrowLeft,
  Loading,
  Refresh,
  Setting,
  User,
  VideoPlay,
} from '@element-plus/icons-vue';

defineEmits<{ prev: [] }>();
const installStore = useInstallStore();
const formRef = ref<FormInstance>();
const terminalRef = ref<HTMLElement>();
const installing = ref(false);

const formData = reactive({
  username: installStore.adminConfig.username,
  password: installStore.adminConfig.password,
  confirmPassword: installStore.adminConfig.password,
  email: installStore.adminConfig.email,
  siteName: installStore.adminConfig.site_name,
  installDatabase: installStore.adminConfig.install_database,
  buildProject: installStore.adminConfig.build_project,
});

const installProgress = computed(() => installStore.install_progress);
const installStatus = computed(() => installStore.install_status);
const installLogs = computed(() => installStore.install_logs);
// 前端模板模式（mono 大仓 / separated 多仓）：读写安装 store
const templateMode = computed({
  get: () => installStore.template_mode,
  set: (value) => installStore.updateTemplateMode(value),
});
const modeOptions = computed(() => installStore.mode_options);
const activeModeOption = computed(() => installStore.activeModeOption);
// 构建范围提示：多租户 admin/platform/web 全量，单租户仅 admin、web
const buildScopeText = computed(() =>
  installStore.buildScopeApps.map((app) => `public/${app}`).join('、'),
);
// 实际部署形态以最终选择为准（标准版恒为单体部署；SaaS 版取「部署模式」步骤的选择结果）
// 用于开始安装时向 SSE 透传 enable_tenant
const isMultiTenant = computed(() => installStore.isMultiTenant);
// 标准版只读展示「单体部署」；SaaS 版（通用型框架）展示用户在「部署模式」步骤的实际选择
const installTarget = computed(() => installStore.isMultiTenant);
const tenantMode = computed(() =>
  installTarget.value ? '多租户模式' : '单体部署模式',
);

const scrollT = () => {
  nextTick(() => {
    if (terminalRef.value)
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
  });
};
onMounted(() => scrollT());
watch(
  () => installLogs.value.length,
  () => scrollT(),
);

const rules: FormRules = {
  username: [
    { required: true, trigger: 'blur' },
    { min: 3, max: 20, message: '3~20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_, v, cb) =>
        v === formData.password ? cb() : cb(new Error('密码不一致')),
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, trigger: 'blur' },
    { type: 'email', message: '邮箱格式错误', trigger: 'blur' },
  ],
  siteName: [{ required: true, message: '请输入网站名称', trigger: 'blur' }],
};

const startInstallation = async () => {
  installing.value = true;
  if (formRef.value) {
    try {
      await formRef.value.validate();
      installStore.updateAdminConfig({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        site_name: formData.siteName,
        install_database: formData.installDatabase,
        build_project: formData.buildProject,
        enable_tenant: isMultiTenant.value,
      });
      await installStore.simulateInstallation();
    } catch {
      // 只有表单验证失败时恢复表单，安装错误保留进度视图
      if (installStore.install_status === 'idle') {
        installing.value = false;
      }
    }
  }
};

/** 返回配置表单（重置安装状态） */
const goBackForm = () => {
  installStore.resetInstall();
  installing.value = false;
};

/** 重试安装 */
const retryInstallation = async () => {
  installStore.resetInstall();
  installing.value = false;
  await nextTick();
  startInstallation();
};

onUnmounted(() => {
  if (installStore.install_status === 'installing') {
    installStore.resetInstall();
  }
});
</script>

<template>
  <div class="config-step">
    <!-- 安装进度 -->
    <div v-if="installing" class="progress-view">
      <div class="console-box">
        <div class="console-bar">
          <span class="cb-dot"></span><span class="cb-dot" style="background: #e6a23c"></span><span class="cb-dot" style="background: #67c23a"></span>
          <span class="cb-title">安装进程</span>
        </div>
        <div class="console-body" ref="terminalRef">
          <div v-for="(log, i) in installLogs" :key="i" class="cl-line">
            <span class="cl-ts">{{ log.split(']')[0] }}]</span>
            <span class="cl-msg">{{ log.split(']')[1] }}</span>
          </div>
          <div v-if="installStatus === 'installing'" class="cl-cursor">_</div>
        </div>
      </div>

      <div class="progress-block">
        <div class="pb-info">
          <span>安装进度</span>
          <span
            :class="
              installStatus === 'success'
                ? 'c-green'
                : installStatus === 'error'
                  ? 'c-red'
                  : 'c-blue'
            "
          >
            <template v-if="installStatus === 'installing'"><el-icon class="spin"><Loading /></el-icon> 安装中...</template>
            <template v-else-if="installStatus === 'success'">✓ 完成</template>
            <template v-else-if="installStatus === 'error'">✗ 失败</template>
            <template v-else>{{ installProgress }}%</template>
          </span>
        </div>
        <div class="pb-track">
          <div
            class="pb-fill"
            :style="{ width: `${installProgress}%` }"
            :class="
              installStatus === 'success'
                ? 'f-green'
                : installStatus === 'error'
                  ? 'f-red'
                  : 'f-blue'
            "
          ></div>
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <div v-else class="config-form">
      <div class="form-row">
        <div class="form-card">
          <div class="fc-title">
            <el-icon color="#409eff"><User /></el-icon> 管理员信息
          </div>
          <el-form
            :model="formData"
            :rules="rules"
            ref="formRef"
            label-width="80px"
            class="inner-form"
          >
            <el-form-item label="账号" prop="username">
              <el-input v-model="formData.username" placeholder="admin" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="至少6位"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认" prop="confirmPassword">
              <el-input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="再次输入"
                show-password
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="formData.email"
                placeholder="admin@madong.tech"
              />
            </el-form-item>
            <el-form-item label="网站" prop="siteName">
              <el-input
                v-model="formData.siteName"
                placeholder="Madong管理系统"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="form-card">
          <div class="fc-title">
            <el-icon color="#e6a23c"><Setting /></el-icon> 安装选项
          </div>
          <!-- 前端模板安装模式（mono 大仓 / separated 多仓）：
               模板寻址属于多租户版的多端构建能力，标准版固定默认 mono，不展示 -->
          <div v-if="installStore.isSaas" class="mode-block">
            <div class="mode-title">前端模板模式</div>
            <el-radio-group v-model="templateMode" class="mode-group">
              <el-radio-button
                v-for="(option, key) in modeOptions"
                :key="key"
                :value="key"
              >
                {{ option.label }}
              </el-radio-button>
            </el-radio-group>
            <p v-if="activeModeOption?.description" class="mode-desc">
              {{ activeModeOption.description }}
            </p>
            <p
              v-if="activeModeOption?.templates?.length"
              class="mode-meta"
            >
              模板寻址：{{ activeModeOption.templates.join('、') }}
            </p>
          </div>
          <!-- SaaS 版为通用型框架，支持「单体 / 多租户」两种部署形态，
               在此只读展示用户在「部署模式」步骤的选择；标准版固定为单体部署，不展示 -->
          <div v-if="installStore.isSaas" class="mode-list">
            <div class="mode-card active">
              <strong>
                {{ tenantMode }}
                <span class="target-badge">部署模式</span>
              </strong>
              <small>
                {{
                  installTarget
                    ? '启用平台端与多租户能力，支持创建和管理多个租户'
                    : '单体部署，适用于单一组织独立运行，不启用租户隔离'
                }}
              </small>
            </div>
          </div>
          <div class="opt-list">
            <label class="opt-item">
              <span class="opt-text"><strong>安装数据库</strong><small>创建并导入数据表</small></span>
              <el-switch v-model="formData.installDatabase" />
            </label>
            <label class="opt-item">
              <span class="opt-text">
                <strong>构建打包</strong>
                <small>编译前端资源（耗时较长，默认关闭；可安装后单独构建）</small>
                <small v-if="formData.buildProject" class="scope-hint">
                  产物输出：backend/public → {{ buildScopeText }}
                </small>
              </span>
              <el-switch v-model="formData.buildProject" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 安装中/安装结果按钮 -->
    <div v-if="installing" class="step-actions">
      <button
        v-if="installStatus === 'error'"
        class="btn btn-ghost"
        @click="goBackForm"
      >
        <el-icon><ArrowLeft /></el-icon> 返回表单
      </button>
      <div v-else></div>
      <div class="btn-group">
        <button
          v-if="installStatus === 'error'"
          class="btn btn-warning"
          @click="retryInstallation"
        >
          <el-icon><Refresh /></el-icon> 重试安装
        </button>
      </div>
    </div>

    <!-- 配置表单按钮 -->
    <div class="step-actions" v-if="!installing">
      <button class="btn btn-ghost" @click="$emit('prev')">
        <el-icon><ArrowLeft /></el-icon> 上一步
      </button>
      <button class="btn btn-primary" @click="startInstallation">
        <el-icon><VideoPlay /></el-icon> 开始安装
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 280px;
}

.form-card {
  padding: 20px;
  background: rgb(255 255 255 / 3%);
  border-radius: 10px;

  .fc-title {
    display: flex;
    gap: 6px;
    align-items: center;
    padding-bottom: 12px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

/* 前端模板安装模式 */
.mode-block {
  padding-bottom: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);

  .mode-title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .mode-group {
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
    }
  }

  .mode-desc {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-tertiary);
  }

  .mode-meta {
    margin-top: 4px;
    font-family: monospace;
    font-size: 12px;
    color: var(--text-muted);
  }
}

.scope-hint {
  display: block;
  margin-top: 2px;
  font-family: monospace;
  color: var(--info-color);
}

.inner-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }

  :deep(.el-input__inner) {
    height: 36px;
  }
}

.opt-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mode-list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.mode-card {
  padding: 12px;
  text-align: left;
  cursor: default;
  background: var(--btn-ghost-bg);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  transition: all 0.2s;

  strong,
  small {
    display: block;
  }

  strong {
    margin-bottom: 4px;
    font-size: 13px;
    color: var(--text-primary);
  }

  small {
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-tertiary);
  }

  &.active {
    background: rgb(64 158 255 / 10%);
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgb(64 158 255 / 8%);
  }
}

.target-badge {
  display: inline-block;
  padding: 1px 5px;
  margin-left: 4px;
  font-size: 10px;
  font-weight: 500;
  color: #409eff;
  vertical-align: 1px;
  background: rgb(64 158 255 / 12%);
  border-radius: 4px;
}

.opt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  .opt-text {
    strong {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    small {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }
}

/* 终端 */
.progress-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.console-box {
  display: flex;
  flex-direction: column;
  min-height: 220px;
  max-height: calc(100vh - 390px);
  overflow: hidden;
  background: #1e1e1e;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.console-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 14px;
  background: #252526;
  border-bottom: 1px solid #333;

  .cb-dot {
    width: 10px;
    height: 10px;
    background: #f56c6c;
    border-radius: 50%;
  }

  .cb-title {
    margin-left: auto;
    font-family: monospace;
    font-size: 11px;
    color: #888;
  }
}

.console-body {
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  flex: 1;
  padding: 12px 14px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;

  .cl-line {
    display: flex;
  }

  .cl-ts {
    flex-shrink: 0;
    margin-right: 8px;
    color: #6a9955;
  }

  .cl-msg {
    color: #d4d4d4;
  }

  .cl-cursor {
    color: #67c23a;
    animation: blink 1s step-end infinite;
  }
}

.console-body::-webkit-scrollbar {
  width: 4px;
}

.console-body::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 8%);
  border-radius: 4px;
}

.progress-block {
  padding: 14px 18px;
  background: var(--btn-ghost-bg);
  border-radius: 8px;
}

.pb-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-tertiary);

  .c-green {
    display: flex;
    gap: 4px;
    align-items: center;
    font-weight: 600;
    color: #67c23a;
  }

  .c-red {
    font-weight: 600;
    color: #f56c6c;
  }

  .c-blue {
    display: flex;
    gap: 4px;
    align-items: center;
    font-weight: 600;
    color: #409eff;
  }
}

.pb-track {
  height: 6px;
  overflow: hidden;
  background: var(--border-subtle);
  border-radius: 3px;
}

.pb-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;

  &.f-blue {
    background: linear-gradient(90deg, #409eff, #6366f1);
  }

  &.f-green {
    background: #67c23a;
  }

  &.f-red {
    background: #f56c6c;
  }
}

.step-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
}

.btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: all 0.2s;

  .el-icon {
    font-size: 14px;
  }
}

.btn-ghost {
  color: var(--btn-ghost-color);
  background: var(--btn-ghost-bg);

  &:hover {
    color: var(--btn-ghost-hover-color);
    background: var(--btn-ghost-hover);
  }
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #409eff, #6366f1);
  box-shadow: 0 3px 12px rgb(64 158 255 / 25%);

  &:hover {
    box-shadow: 0 5px 18px rgb(64 158 255 / 35%);
  }
}

.btn-warning {
  color: #fff;
  background: linear-gradient(135deg, #e6a23c, #f56c6c);
  box-shadow: 0 3px 12px rgb(230 162 60 / 25%);

  &:hover {
    box-shadow: 0 5px 18px rgb(230 162 60 / 35%);
  }
}

.btn-group {
  display: flex;
  gap: 8px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
