import type { AppEdition, EditionInfo } from '@/types/install';

import { installApi } from '@/api/install';

/** 默认场景：标准版 */
const DEFAULT_EDITION: AppEdition = 'standard';

/** 合法场景取值 */
const VALID_EDITIONS: AppEdition[] = ['standard', 'saas'];

/** 模块级缓存：解析结果 */
let cachedEdition: AppEdition = DEFAULT_EDITION;

/** 模块级缓存：正在进行的解析 Promise，避免并发重复请求 */
let resolvingPromise: null | Promise<AppEdition> = null;

/**
 * 归一化字符串型环境变量为布尔值。
 *
 * Vite 的 import.meta.env.* 恒为字符串，直接用 `=== true` 比较永远为 false，
 * 该函数统一处理 'true' / '1' / 'yes' / 'on' 等常见写法。
 */
export function normalizeBoolEnv(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  const text = String(value).trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes' || text === 'on';
}

/**
 * 校验并归一化为合法的场景值。
 *
 * @returns 合法时返回 'standard' | 'saas'，非法或缺失时返回 undefined
 */
export function normalizeEdition(value: unknown): AppEdition | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const text = String(value).trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  // 兼容后端可能返回的别名写法
  if (text === 'multi-tenant' || text === 'multi_tenant' || text === 'tenant') {
    return 'saas';
  }
  if (text === 'single' || text === 'mono' || text === 'basic') {
    return 'standard';
  }
  return VALID_EDITIONS.includes(text as AppEdition)
    ? (text as AppEdition)
    : undefined;
}

/**
 * 从后端检测接口的响应体中提取场景。
 *
 * 兼容两种字段：显式的 `edition` 字符串，或布尔型的 `saas_mode`。
 * 两者都缺失时返回 undefined，由调用方降级到环境变量。
 */
export function pickEditionFromPayload(
  payload: EditionInfo | null | undefined,
): AppEdition | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const fromEdition = normalizeEdition(payload.edition);
  if (fromEdition) {
    return fromEdition;
  }

  if (typeof payload.saas_mode === 'boolean') {
    return payload.saas_mode ? 'saas' : 'standard';
  }

  return undefined;
}

/**
 * 读取环境变量中配置的场景。
 *
 * 优先读 VITE_APP_EDITION；未配置时兼容旧变量 VITE_ENABLE_TENANT。
 */
export function resolveEditionFromEnv(): AppEdition | undefined {
  const fromEdition = normalizeEdition(import.meta.env.VITE_APP_EDITION);
  if (fromEdition) {
    return fromEdition;
  }

  // 向后兼容：老配置只有 VITE_ENABLE_TENANT，开启即视为 saas 场景
  if (normalizeBoolEnv(import.meta.env.VITE_ENABLE_TENANT)) {
    return 'saas';
  }

  return undefined;
}

/**
 * SaaS 场景下「多租户」的默认选中值，取自 VITE_ENABLE_TENANT。
 */
export function getDefaultTenantEnabled(): boolean {
  return normalizeBoolEnv(import.meta.env.VITE_ENABLE_TENANT);
}

/**
 * 三级降级解析当前场景：后端检测接口 → 环境变量 → 标准版。
 *
 * 全程静默容错：接口 404、网络异常、返回空、字段未定义，
 * 均不会抛出异常，只会降级到下一级来源。
 */
export function resolveEdition(force = false): Promise<AppEdition> {
  if (!force && resolvingPromise) {
    return resolvingPromise;
  }

  resolvingPromise = (async (): Promise<AppEdition> => {
    // 第一级：后端检测接口
    try {
      const res: any = await installApi.getEdition();
      const fromApi = pickEditionFromPayload(res?.data ?? res);
      if (fromApi) {
        cachedEdition = fromApi;
        return cachedEdition;
      }
      console.warn('[edition] 检测接口未返回有效场景字段，降级使用环境变量');
    } catch {
      console.warn('[edition] 检测接口不可用，降级使用环境变量');
    }

    // 第二级：环境变量
    const fromEnv = resolveEditionFromEnv();
    if (fromEnv) {
      cachedEdition = fromEnv;
      return cachedEdition;
    }

    // 第三级：默认标准版
    cachedEdition = DEFAULT_EDITION;
    return cachedEdition;
  })();

  return resolvingPromise;
}

/**
 * 同步读取已解析并缓存的场景，未解析完成时返回默认标准版。
 */
export function getEdition(): AppEdition {
  return cachedEdition;
}

/**
 * 手动写入场景（供 /install/check 等兼容通道命中时同步缓存）。
 */
export function setEdition(value: unknown): AppEdition {
  const normalized = normalizeEdition(value);
  if (normalized) {
    cachedEdition = normalized;
  }
  return cachedEdition;
}
