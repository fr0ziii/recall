export type Modality = 'text' | 'image';

export type FieldType = 'float' | 'int' | 'keyword' | 'bool' | 'text';

export interface EmbeddingConfig {
  model: string;
  modality: Modality;
}

export type IndexSchema = Record<string, FieldType>;

export interface Collection {
  name: string;
  embedding_config: EmbeddingConfig;
  index_schema: IndexSchema;
  created_at: string | null;
}

export interface CreateCollectionRequest {
  name: string;
  embedding_config: EmbeddingConfig;
  index_schema: IndexSchema;
}

export interface CollectionResponse {
  status: 'created' | 'exists' | 'deleted';
  name: string;
  message: string | null;
}

export type FilterOperator = 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'IN' | 'AND' | 'OR';

export interface BaseCondition {
  op: FilterOperator;
  field: string;
  value: string | number | boolean | (string | number)[];
}

export interface LogicalCondition {
  op: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export type FilterCondition = BaseCondition | LogicalCondition;

export interface SearchRequest {
  query: string;
  filter?: FilterCondition;
  limit?: number;
  with_payload?: boolean;
  with_vectors?: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown> | null;
  vector: number[] | null;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}

export interface Document {
  id: string;
  content_uri?: string;
  content_raw?: string;
  payload?: Record<string, unknown>;
}

export interface IngestRequest {
  documents: Document[];
}

export interface IngestResponse {
  task_id: string;
  documents_queued: number;
  status: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
