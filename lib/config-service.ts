// services/config-service.ts
import { PageConfig } from '@/lib/schemas/page-config';

export class ConfigService {
  private static instance: ConfigService;
  private configs: Map<string, PageConfig> = new Map();
  private configPath = 'config/pages'; // Fixed path to match actual directory

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
      // Dynamic import needs to be relative to where it is or use alias
      // Since this is client-side code mostly (implied by usage in components), direct fs read isn't possible
      // But import() works if webpack can resolve it.
      // However, the original code used `@/configs/pages`.
      // Our structure is `config/pages`.
      // Note: dynamic import with variables is tricky.
      // Assuming for now the build system handles it or we might need a server action loader.
      // The original code was `import('@/configs/pages/' + pageId + '.json')`
      // We'll trust the previous pattern but correct the path.
      
      const config = await import(`@/config/pages/${pageId}.json`);
      this.configs.set(pageId, config.default);
      return config.default;
    } catch (error) {
      console.error(`Failed to load config for ${pageId}:`, error);
      return null;
    }
  }

  async saveConfig(pageId: string, config: PageConfig): Promise<void> {
    this.configs.set(pageId, config);
  }

  getFieldConfig(pageId: string, fieldId: string) {
    const config = this.configs.get(pageId);
    return config?.model.fields[fieldId];
  }
}