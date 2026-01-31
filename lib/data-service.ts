// services/data-service.ts
import { PageConfig } from '@/lib/schemas/dynamic-page.types';

export class DataService {
  private static instance: DataService;
  private apiBase = '/api';

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async fetchAll(modelName: string, params?: {
    page?: number;
    pageSize?: number;
    filter?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object') {
            query.set(key, JSON.stringify(value));
          } else {
            query.set(key, String(value));
          }
        }
      });
    }

    const response = await fetch(
      `${this.apiBase}/${modelName}?${query.toString()}`
    );
    return response.json();
  }

  async fetchOne(modelName: string, id: string) {
    const response = await fetch(`${this.apiBase}/${modelName}/${id}`);
    return response.json();
  }

  async create(modelName: string, data: any) {
    const response = await fetch(`${this.apiBase}/${modelName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async update(modelName: string, id: string, data: any) {
    const response = await fetch(`${this.apiBase}/${modelName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(modelName: string, id: string) {
    const response = await fetch(`${this.apiBase}/${modelName}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async executeAction(modelName: string, actionId: string, data?: any) {
    const response = await fetch(`${this.apiBase}/${modelName}/actions/${actionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}