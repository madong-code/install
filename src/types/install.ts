// 协议数据
export interface AgreementData {
  title: string;
  content: string;
  version: string;
  update_time: string;
}

// 环境检测项
export interface EnvironmentCheckItem {
  name: string;
  need: string;
  required: string;
  current: string;
  status: boolean;
  status_text: string;
  message: string;
  is_required: boolean;
}

// 目录权限检查结果
export interface DirectoryPermissionCheckResult {
  path: string;
  path_name: string;
  name: string;
  required: boolean;
  permission_type: 'read_only' | 'read_write' | 'write_only';
  description: string;
  exists: boolean;
  is_readable: boolean;
  is_writable: boolean;
  status: boolean;
  status_text: string;
  message: string;
}

// 数据库配置
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  prefix: string;
  // Redis 配置
  redisHost: string;
  redisPort: number;
  redisPassword: string;
}

// 管理员配置
export interface AdminConfig {
  username: string;
  password: string;
  email: string;
  site_name: string;
  install_database: boolean;
  build_project: boolean;
  // 多租户配置
  enable_tenant: boolean;
  create_default_tenant?: boolean;
  default_tenant_name: string;
  tenant_admin_username: string;
  tenant_admin_password: string;
  tenant_admin_email: string;
}

// 当前场景（版本）：standard 标准版 | saas 多租户版
export type AppEdition = 'saas' | 'standard';

// 部署模式：none 单体部署 | manual 多租户部署（安装后在后台手动创建租户）
export type TenantMode = 'manual' | 'none';

// 前端模板安装模式（mono 大仓 / separated 多仓）
export type InstallTemplateMode = 'mono' | 'separated' | (string & {});

// 安装模式选项定义（由后端 /install/mode 下发）
export interface InstallModeOption {
  label: string;
  description: string;
  // 模板寻址目录，如 template/mono、template/web
  templates: string[];
  // 关联应用，如 admin、platform
  apps: string[];
}

// 安装模式定义
export interface InstallModeDefinition {
  default_mode: InstallTemplateMode;
  modes: Record<string, InstallModeOption>;
}

// 多租户配置
export interface TenantConfig {
  tenant_mode: TenantMode;
  enable_tenant: boolean;
  create_default_tenant: boolean;
  default_tenant_name: string;
  tenant_admin_username: string;
  tenant_admin_password: string;
  tenant_admin_email: string;
}

// 后端场景检测接口响应体（字段均可选，缺失时前端降级到环境变量）
export interface EditionInfo {
  edition?: string;
  saas_mode?: boolean;
}

// 框架元信息（多租户后端 /install/framework 下发）
export interface FrameworkMeta {
  name: string;
  version: string;
  // 支持租户能力：仅多租户版本为 true，前端据此解锁版本选择
  supports_tenant: boolean;
  // 支持多模板寻址（mono/separated 与平台端构建）
  supports_multi_template: boolean;
}

// 框架信息验证响应：verified 为 true 且 edition 为 saas 时，前端才允许进入非标准版流程
export interface FrameworkInfo extends EditionInfo {
  verified?: boolean;
  framework?: FrameworkMeta;
}
