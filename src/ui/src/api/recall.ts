import type {
  Collection,
  CollectionResponse,
  CreateCollectionRequest,
  IngestRequest,
  IngestResponse,
  SearchRequest,
  SearchResponse,
} from '../types/recall';

const API_BASE = '/v1';

class RecallApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RecallApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown',
      message: response.statusText,
    }));
    throw new RecallApiError(
      response.status,
      error.error,
      error.message,
      error.details
    );
  }
  return response.json();
}

export const recallApi = {
  async listCollections(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/collections`);
    return handleResponse<string[]>(response);
  },

  async getCollection(name: string): Promise<Collection> {
    const response = await fetch(`${API_BASE}/collections/${encodeURIComponent(name)}`);
    return handleResponse<Collection>(response);
  },

  async createCollection(data: CreateCollectionRequest): Promise<CollectionResponse> {
    const response = await fetch(`${API_BASE}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CollectionResponse>(response);
  },

  async deleteCollection(name: string): Promise<CollectionResponse> {
    const response = await fetch(`${API_BASE}/collections/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return handleResponse<CollectionResponse>(response);
  },

  async search(collectionName: string, data: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(
      `${API_BASE}/collections/${encodeURIComponent(collectionName)}/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return handleResponse<SearchResponse>(response);
  },

  async ingestDocuments(collectionName: string, data: IngestRequest): Promise<IngestResponse> {
    const response = await fetch(
      `${API_BASE}/collections/${encodeURIComponent(collectionName)}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return handleResponse<IngestResponse>(response);
  },

  async getSupportedModels(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/collections/models/supported`);
    return handleResponse<string[]>(response);
  },

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch('/health');
    return handleResponse<{ status: string }>(response);
  },
};

export { RecallApiError };
