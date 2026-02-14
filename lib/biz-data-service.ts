// services/data-service.ts
export class BizDataService {
  private static instance: BizDataService;
  // Default to the new REST API structure
  private defaultApiBase = '/api/rest';

  static getInstance(): BizDataService {
    if (!BizDataService.instance) {
      BizDataService.instance = new BizDataService();
    }
    return BizDataService.instance;
  }

  /**
   * Construct the URL.
   * If `basePath` is provided (e.g. "/api/v2/orders"), use it directly.
   * Otherwise, fall back to default convention: "/api/rest/{modelName}"
   */
  private getUrl(modelName: string, path: string = '', basePath?: string, params?: Record<string, any>) {
    let url = '';
    if (basePath) {
      // Ensure no trailing slash
      const cleanBase = basePath.replace(/\/$/, '');
      url = `${cleanBase}${path}`;
    } else {
      url = `${this.defaultApiBase}/${modelName}${path}`;
    }

    // Path parameter substitution
    if (params && url.includes('{')) {
      url = url.replace(/\{(\w+)\}/g, (match, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          const val = params[key];
          // Mark param as used so it doesn't end up in query string?
          // Actually, fetchAll constructs query string separately. 
          // We need a way to tell caller which params were used, OR caller handles it.
          // But getUrl returns a string. 
          // Let's modify fetchAll to handle this.
          // For now, just substitution. 
          return String(val);
        }
        return match;
      });
    }
    return url;
  }

  async fetchAll(modelName: string, params?: {
    page?: number;
    pageSize?: number;
    filter?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    [key: string]: any;
  }, basePath?: string) {
    // 1. Identify path parameters needed by the URL (if basePath is dynamic)
    const pathParams: string[] = [];
    if (basePath && basePath.includes('{')) {
      const matches = basePath.match(/\{(\w+)\}/g);
      if (matches) {
        matches.forEach(m => pathParams.push(m.slice(1, -1)));
      }
    }

    // 2. Construct Query Params (excluding path params)
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Skip if this key is consumed by path substitution
        if (pathParams.includes(key)) return;

        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            query.set(key, JSON.stringify(value));
          } else {
            query.set(key, String(value));
          }
        }
      });
    }

    const urlStr = this.getUrl(modelName, '', basePath, params);
    const url = `${urlStr}?${query.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${modelName}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async fetchOne(modelName: string, id: string, basePath?: string) {
    const url = this.getUrl(modelName, `/${id}`, basePath);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${modelName} ${id}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async create(modelName: string, data: any, basePath?: string) {
    const url = this.getUrl(modelName, '', basePath);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${modelName}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async update(modelName: string, id: string, data: any, basePath?: string) {
    const url = this.getUrl(modelName, `/${id}`, basePath);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${modelName} ${id}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async delete(modelName: string, id: string, basePath?: string) {
    const url = this.getUrl(modelName, `/${id}`, basePath);
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${modelName} ${id}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async executeAction(modelName: string, actionId: string, data?: any, basePath?: string) {
    const url = this.getUrl(modelName, `/actions/${actionId}`, basePath);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute action ${actionId}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
}
