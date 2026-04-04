import fs from "fs/promises";
import path from "path";

/**
 * Generic JSON based persistence helper to mimic a DB table for REST operations.
 * Data is stored in config/[model].json (e.g. config/cms/topics.json)
 */
export class JsonStore {
    private filePath: string;

    constructor(modelKey: string) {
        // Normalize path: cms/topics -> config/data/cms/topics.json
        this.filePath = path.join(process.cwd(), "config", "data",`${modelKey}.json`);
    }

    private async ensureDirectory() {
        const dir = path.dirname(this.filePath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    private async read(): Promise<any[]> {
        try {
            await this.ensureDirectory();
            const raw = await fs.readFile(this.filePath, "utf-8");
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private async write(data: any[]) {
        await this.ensureDirectory();
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    }

    async findMany(options: {
        page?: number;
        pageSize?: number;
        where?: Record<string, any>
    } = {}) {
        let data = await this.read();
        const { page = 1, pageSize = 10, where = {} } = options;

        // Simple filtering (fuzzy search for strings)
        Object.entries(where).forEach(([key, value]) => {
            if (!value) return;
            data = data.filter(item => {
                const itemVal = item[key];
                if (typeof itemVal === 'string' && typeof value === 'string') {
                    return itemVal.toLowerCase().includes(value.toLowerCase());
                }
                return itemVal === value;
            });
        });

        const total = data.length;
        const start = (page - 1) * pageSize;
        const paginatedData = data.slice(start, start + pageSize);

        return { data: paginatedData, total, page, pageSize };
    }

    async findOne(id: string) {
        const data = await this.read();
        return data.find(item => item.id === id);
    }

    async create(body: any) {
        const data = await this.read();
        const newItem = {
            id: crypto.randomUUID(),
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.unshift(newItem);
        await this.write(data);
        return newItem;
    }

    async update(id: string, body: any) {
        const data = await this.read();
        const index = data.findIndex(item => item.id === id);
        if (index === -1) return null;

        data[index] = {
            ...data[index],
            ...body,
            id: id, // Ensure ID is immutable
            updatedAt: new Date().toISOString()
        };
        await this.write(data);
        return data[index];
    }

    async delete(id: string) {
        const data = await this.read();
        const newData = data.filter(item => item.id !== id);
        if (newData.length === data.length) return false;
        await this.write(newData);
        return true;
    }
}
