import { NextResponse } from 'next/server';
import { getMenusFromConfig } from '@/lib/menu-service';

export async function GET() {
  try {
    const menus = await getMenusFromConfig();
    
    // Map to API response format if needed, or return as is depending on requirements.
    // The previous implementation returned { id, name, path, icon, order, isActive }.
    // getMenusFromConfig returns { title, url, icon, isActive, items, order }.
    // We should maintain the response format for the API.
    
    const response = menus.map((menu: any) => ({
        id: menu.url.replace(/\//g, '') || 'unknown', // Generate ID from URL if not present
        name: menu.title,
        path: menu.url,
        icon: menu.icon,
        order: menu.order,
        isActive: menu.isActive
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reading menu files:', error);
    return NextResponse.json({ error: 'Failed to load menus' }, { status: 500 });
  }
}
