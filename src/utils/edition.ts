import type { AppEdition, EditionInfo, FrameworkInfo } from '@/types/install';

import { installApi } from '@/api/install';

/** 默认场景：标准版 */
const DEFAULT_EDITION: AppEdition = 'standard';

/** 合法场景取值 */
const VALID_EDITIONS: AppEdition[] = ['standard', 'saas'];

/** 模块级缓存：解析结果 */
let cachedEdition: AppEdition = DEFAULT_EDITION;

/** 模块级缓存：正在进行的解析 Promise，避免并发重复请求 */
let resolvingPromise: null | Promise<AppEdition> = null;

/** 模块级缓存：框架信息验证结果（null 表示未验证或验证未通过） */
let cachedFramework: FrameworkInfo | null = null;

/** 模块级缓存：框架验证是否通过（仅 saas 场景下可能为 true） */
let frameworkVerified = false;

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
 * 读取环境变量中配置的版本模式（三态）。
 *
 * - 'standard'：强制标准版（构建期锁定，运行时接口不可翻转）
 * - 'saas'：强制多租户版（构建期锁定，按前端 env 为准，不因后端接口异常回退）
 * - 'auto'（或未配置，兼容旧变量 VITE_ENABLE_TENANT=true 视为 saas）：自动识别，
 *   依赖框架信息验证接口，验证失败/异常时自动回退标准版
 */
export function resolveEditionFromEnv():
  | 'auto'
  | 'saas'
  | 'standard' {
  const raw = String(import.meta.env.VITE_APP_EDITION ?? '').trim().toLowerCase();
  if (raw === 'standard') return 'standard';
  if (raw === 'saas') return 'saas';

  // 显式 auto 或未配置 → 自动识别
  if (raw !== 'auto') {
    // 向后兼容：老配置只有 VITE_ENABLE_TENANT，开启即视为强制 saas
    if (normalizeBoolEnv(import.meta.env.VITE_ENABLE_TENANT)) {
      return 'saas';
    }
  }
  return 'auto';
}

/**
 * SaaS 场景下「多租户」的默认选中值，取自 VITE_ENABLE_TENANT。
 */
export function getDefaultTenantEnabled(): boolean {
  return normalizeBoolEnv(import.meta.env.VITE_ENABLE_TENANT);
}

/**
 * 标准版构建是否已强制锁定（VITE_APP_EDITION === 'standard'）。
 *
 * 锁定后运行时后端接口不可翻转场景（标准版产物不出现多租户参数）。
 */
export function isEditionLocked(): boolean {
  return resolveEditionFromEnv() === 'standard';
}

/**
 * 是否为强制模式（VITE_APP_EDITION = 'standard' | 'saas'）。
 *
 * 强制模式按前端 env 为准，运行时后端接口不可翻转；
 * 仅 'auto'（或未配置）走自动识别并允许接口异常回退。
 */
export function isEditionForced(): boolean {
  return resolveEditionFromEnv() !== 'auto';
}

/**
 * 框架信息验证：调用多租户后端验证接口，校验场景与租户能力。
 *
 * 校验规则（全部满足才算验证通过，返回框架信息）：
 *  1. 接口在超时时间内正常响应（5 秒，异常/无响应视为验证失败）
 *  2. verified === true（后端自校验通过）
 *  3. 场景为 saas（edition/saas_mode 任一字段）
 *  4. 框架声明支持租户能力（framework.supports_tenant === true）
 *
 * 任一条件不满足返回 null，调用方自动回退标准版（无需重新构建或页面跳转）。
 */
async function verifyFramework(): Promise<FrameworkInfo | null> {
  try {
    const res: any = await installApi.getFramework();
    const payload = (res?.data ?? res) as FrameworkInfo | undefined;
    const pass =
      !!payload &&
      typeof payload === 'object' &&
      payload.verified === true &&
      pickEditionFromPayload(payload) === 'saas' &&
      payload.framework?.supports_tenant === true;
    if (pass) {
      return payload as FrameworkInfo;
    }
    console.warn('[edition] 框架信息验证未通过，自动回退标准版');
    return null;
  } catch {
    // 接口异常或无响应：无感知回退标准版
    console.warn('[edition] 框架信息接口异常或无响应，自动回退标准版');
    return null;
  }
}

/**
 * 解析当前场景（版本），带自动回退机制。
 *
 * 三态语义（VITE_APP_EDITION）：
 *  1. 'standard'：强制标准版，直接锁定，不发起任何验证请求
 *  2. 'saas'：强制多租户版，按前端 env 锁定，跳过框架验证（后端接口不可降级）
 *  3. 'auto'（或未配置）：通过框架信息验证接口自动识别；
 *     验证失败 / 接口异常 / 无响应时自动回退标准版（静默完成，用户无感知）
 *
 * 全程静默容错，不会抛出异常中断安装向导。
 */
export function resolveEdition(force = false): Promise<AppEdition> {
  if (!force && resolvingPromise) {
    return resolvingPromise;
  }

  resolvingPromise = (async (): Promise<AppEdition> => {
    const mode = resolveEditionFromEnv();

    // 强制标准版：直接锁定
    if (mode === 'standard') {
      cachedEdition = DEFAULT_EDITION;
      cachedFramework = null;
      frameworkVerified = false;
      return cachedEdition;
    }

    // 强制多租户版：按前端 env 锁定，跳过框架验证
    if (mode === 'saas') {
      cachedEdition = 'saas';
      cachedFramework = null;
      frameworkVerified = true;
      return cachedEdition;
    }

    // auto：框架验证自动识别
    const framework = await verifyFramework();
    if (framework) {
      cachedEdition = 'saas';
      cachedFramework = framework;
      frameworkVerified = true;
      return cachedEdition;
    }

    // 验证失败自动回退标准版
    cachedEdition = DEFAULT_EDITION;
    cachedFramework = null;
    frameworkVerified = false;
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
 * 框架验证是否通过。仅 saas 场景且验证接口校验通过时为 true；
 * 前端据此解锁版本切换与选择操作（部署模式、前端模板模式等）。
 */
export function isFrameworkVerified(): boolean {
  return frameworkVerified;
}

/**
 * 同步读取框架信息验证结果，未验证或验证未通过时返回 null。
 */
export function getFrameworkInfo(): FrameworkInfo | null {
  return cachedFramework;
}

/**
 * 手动写入场景（供 /install/check 等兼容通道命中时同步缓存）。
 *
 * 强制模式（standard/saas env）下拒绝覆盖——场景按前端 env 为准；
 * auto 模式下允许接口来源更新。写入非 saas 场景时同步清空框架验证状态，
 * 保证场景与选择状态一致（避免降级后残留 saas 选择）。
 */
export function setEdition(value: unknown): AppEdition {
  if (isEditionForced()) {
    return cachedEdition;
  }
  const normalized = normalizeEdition(value);
  if (normalized) {
    cachedEdition = normalized;
    // 状态一致性：非 saas 场景不允许持有验证通过的框架状态
    if (cachedEdition !== 'saas') {
      cachedFramework = null;
      frameworkVerified = false;
    }
  }
  return cachedEdition;
}
