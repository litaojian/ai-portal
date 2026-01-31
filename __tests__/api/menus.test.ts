import { GET } from '@/app/api/data/menus/route';
import { describe, it, expect } from 'vitest';

describe('Menus API', () => {
    it('should return sorted menus', async () => {
        const response = await GET();
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        // Verify sorting by order
        expect(data[0].order).toBeLessThanOrEqual(data[1].order);
        
        // Verify structure
        data.forEach((item: any) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('path');
            expect(item).toHaveProperty('icon');
            expect(item).toHaveProperty('order');
        });
        
        // Check specific data (optional, based on what we seeded)
        const appsMenu = data.find((m: any) => m.id === 'apps');
        expect(appsMenu).toBeDefined();
        expect(appsMenu.order).toBe(1);
    });
});
