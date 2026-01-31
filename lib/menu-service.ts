import fs from 'fs';
import path from 'path';

export interface MenuItem {
  id: string; // Added id to track filename
  title: string;
  url: string;
  icon?: string;
  isActive?: boolean;
  items?: MenuItem[];
  order?: number;
}

export async function getMenusFromConfig(): Promise<MenuItem[]> {
  const menusDir = path.join(process.cwd(), 'config', 'data', 'menus');
  
  try {
    if (!fs.existsSync(menusDir)) {
      return [];
    }

    const files = await fs.promises.readdir(menusDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const menus = await Promise.all(jsonFiles.map(async (file) => {
      const filePath = path.join(menusDir, file);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      const id = path.basename(file, '.json');
      
      return {
        ...data,
        id,
        order: data.order || 999
      };
    }));

    menus.sort((a, b) => a.order - b.order);

    return menus;
  } catch (error) {
    console.error('Error reading menu files:', error);
    return [];
  }
}
