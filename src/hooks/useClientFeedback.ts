import { useQuery } from '@tanstack/react-query';
import { listClientFeedback } from '../services/clientFeedback';
import { ClientFeedback } from '../types';

export const useClientFeedback = () => useQuery({
  queryKey: ['clientFeedback'],
  queryFn: listClientFeedback,
  staleTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
