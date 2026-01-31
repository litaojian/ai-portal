import fs from 'fs/promises';
import path from 'path';
import { PageConfig, PageConfigSchema } from '@/lib/schemas/page-config';

const CONFIG_DIR = path.join(process.cwd(), 'config', 'pages');

export async function getPageConfig(modelName: string): Promise<PageConfig | null> {
  try {
    const filePath = path.join(CONFIG_DIR, `${modelName}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rawConfig = JSON.parse(fileContent);
    
    // Validate with Zod
    const result = PageConfigSchema.safeParse(rawConfig);
    
    if (!result.success) {
      console.error(`Invalid config for ${modelName}:`, result.error.format());
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error(`Failed to load config for ${modelName}:`, error);
    return null;
  }
}

export type { PageConfig };
