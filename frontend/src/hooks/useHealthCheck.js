import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 60_000,
    retry: 1,
  })
}
