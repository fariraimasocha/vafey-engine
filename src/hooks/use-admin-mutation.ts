import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import toast from 'react-hot-toast'

/**
 * Wraps an admin server function in a mutation: refreshes the given query keys (plus the
 * dashboard) on success, and toasts errors. Every admin write in the UI goes through this.
 */
export function useAdminMutation<TInput, TResult>(
  fn: (opts: { data: TInput }) => Promise<TResult>,
  { invalidate, success }: { invalidate: QueryKey[]; success?: string },
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TInput) => fn({ data }),
    onSuccess: async () => {
      await Promise.all(
        [...invalidate, ['dashboard']].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
      if (success) toast.success(success)
    },
    onError: (e) => toast.error(e.message || 'Something went wrong'),
  })
}
