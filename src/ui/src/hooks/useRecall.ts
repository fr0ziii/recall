import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recallApi } from '../api/recall';
import type { CreateCollectionRequest, IngestRequest, SearchRequest } from '../types/recall';

export const queryKeys = {
  collections: ['collections'] as const,
  collection: (name: string) => ['collections', name] as const,
  models: ['models'] as const,
  health: ['health'] as const,
};

export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections,
    queryFn: () => recallApi.listCollections(),
  });
}

export function useCollection(name: string) {
  return useQuery({
    queryKey: queryKeys.collection(name),
    queryFn: () => recallApi.getCollection(name),
    enabled: !!name,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionRequest) => recallApi.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => recallApi.deleteCollection(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });
}

export function useSearch(collectionName: string) {
  return useMutation({
    mutationFn: (data: SearchRequest) => recallApi.search(collectionName, data),
  });
}

export function useIngestDocuments(collectionName: string) {
  return useMutation({
    mutationFn: (data: IngestRequest) => recallApi.ingestDocuments(collectionName, data),
  });
}

export function useSupportedModels() {
  return useQuery({
    queryKey: queryKeys.models,
    queryFn: () => recallApi.getSupportedModels(),
    staleTime: Infinity,
  });
}

// Task status polling with auto-stop when complete
export function useTaskStatus(taskId: string | null) {
  return useQuery({
    queryKey: ['task', taskId] as const,
    queryFn: () => recallApi.getTaskStatus(taskId!),
    enabled: !!taskId,
    // SWR-style automatic deduplication via TanStack Query
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000;
      // Stop polling when all jobs are complete or failed
      const { complete, failed, total } = data.summary;
      return complete + failed >= total ? false : 1000;
    },
  });
}

// Paginated document fetching
export function useDocuments(collectionName: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['documents', collectionName, limit, offset] as const,
    queryFn: () => recallApi.listDocuments(collectionName, limit, offset),
    enabled: !!collectionName,
    // Narrow dependencies: only refetch when primitives change
    staleTime: 30000,
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => recallApi.healthCheck(),
    refetchInterval: 30000,
  });
}
