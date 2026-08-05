<script setup lang="ts">
import type { Component } from 'vue';

import type { TenantMode } from '@/types/install';

import { ref } from 'vue';

import { useInstallStore } from '@/store/module/install';
import {
  ArrowLeft,
  ArrowRight,
  OfficeBuilding,
  Monitor,
} from '@element-plus/icons-vue';

const emit = defineEmits<{ next: []; prev: [] }>();
const installStore = useInstallStore();

interface DeployOption {
  color: string;
  desc: string;
  icon: Component;
  title: string;
  value: TenantMode;
}

const options: DeployOption[] = [
  {
    value: 'none',
    icon: Monitor,
    color: '#8e8ea0',
    title: '单体部署',
    desc: '不启用租户隔离，所有用户共享同一数据空间',
  },
  {
    value: 'manual',
    icon: OfficeBuilding,
    color: '#409eff',
    title: '多租户部署',
    desc: '启用平台端与多租户能力，安装后可创建管理多个租户',
  },
];

const activeMode = ref<TenantMode>(installStore.tenantConfig.tenant_mode);

const handleNext = () => {
  installStore.updateTenantConfig({ tenant_mode: activeMode.value });
  emit('next');
};
</script>

<template>
  <div class="deploy-step">
    <div class="section-title">
      <el-icon><OfficeBuilding /></el-icon> 部署模式
    </div>

    <div class="mode-list">
      <div
        v-for="opt in options"
        :key="opt.value"
        class="mode-card"
        :class="{ active: activeMode === opt.value }"
        @click="activeMode = opt.value"
      >
        <div class="mc-radio">
          <div class="mc-dot" :class="{ 'dot-active': activeMode === opt.value }">
            <div v-if="activeMode === opt.value" class="mc-inner"></div>
          </div>
        </div>
        <div class="mc-body">
          <div class="mc-icon" :style="{ '--ic': opt.color }">
            <el-icon :size="18"><component :is="opt.icon" /></el-icon>
          </div>
          <div>
            <h4>{{ opt.title }}</h4>
            <p>{{ opt.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <button class="btn btn-ghost" @click="$emit('prev')">
        <el-icon><ArrowLeft /></el-icon> 上一步
      </button>
      <button class="btn btn-primary" @click="handleNext">
        下一步 <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);

  .el-icon {
    font-size: 15px;
    color: var(--el-color-primary);
  }
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.mode-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px 18px;
  cursor: pointer;
  background: var(--btn-ghost-bg);
  border: 1.5px solid transparent;
  border-radius: 10px;
  transition: all 0.2s;

  &:hover {
    background: var(--btn-ghost-hover);
  }

  &.active {
    background: rgb(64 158 255 / 4%);
    border-color: var(--info-color);
    box-shadow: 0 0 0 1px rgb(64 158 255 / 10%);
  }

  .mc-radio {
    flex-shrink: 0;
  }

  .mc-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 2px solid var(--text-muted);
    border-radius: 50%;
    transition: border-color 0.2s;

    &.dot-active {
      border-color: var(--info-color);

      .mc-inner {
        width: 8px;
        height: 8px;
        background: var(--info-color);
        border-radius: 50%;
      }
    }
  }

  .mc-body {
    display: flex;
    flex: 1;
    gap: 12px;
    align-items: center;
  }

  .mc-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    color: var(--ic);
    background: color-mix(in srgb, var(--ic) 12%, transparent);
    border-radius: 8px;
  }

  h4 {
    margin-bottom: 2px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--text-tertiary);
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
  margin-left: 8px;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #6366f1);
  box-shadow: 0 3px 12px rgb(64 158 255 / 25%);

  &:hover {
    box-shadow: 0 5px 18px rgb(64 158 255 / 35%);
  }
}
</style>
