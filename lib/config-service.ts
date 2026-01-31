// services/config-service.ts
import { PageConfig } from '@/lib/schemas/dynamic-page.types';

export class ConfigService {
  private static instance: ConfigService;
  private configs: Map<string, PageConfig> = new Map();
  private configPath = '/configs/pages';

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async loadConfig(pageId: string): Promise<PageConfig | null> {
    if (this.configs.has(pageId)) {
      return this.configs.get(pageId)!;
    }

    try {
      const config = await import(`@/${this.configPath}/${pageId}.json`);
      this.configs.set(pageId, config.default);
      return config.default;
    } catch (error) {
      console.error(`Failed to load config for ${pageId}:`, error);
      return null;
    }
  }

  async saveConfig(pageId: string, config: PageConfig): Promise<void> {
    // 实现配置保存逻辑，可以保存到数据库或文件系统
    this.configs.set(pageId, config);
    
    // 这里可以添加持久化逻辑
    // await db.configs.upsert({ id: pageId, config });
  }

  getFieldConfig(pageId: string, fieldId: string) {
    const config = this.configs.get(pageId);
    return config?.fields.find(f => f.id === fieldId);
  }
}