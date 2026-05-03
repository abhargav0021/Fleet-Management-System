import { useEffect } from 'react'
import { apiClient } from '@/api/client'
import { toast } from '@/components/ui/use-toast'
import axios from 'axios'

export function useGlobalApiErrorHandler() {
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (res) => res,
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const msg =
            (error.response?.data as { message?: string })?.message ??
            error.message ??
            'An unexpected error occurred.'
          toast({ variant: 'destructive', title: 'API Error', description: msg })
        }
        return Promise.reject(error)
      }
    )
    return () => apiClient.interceptors.response.eject(interceptor)
  }, [])
}
