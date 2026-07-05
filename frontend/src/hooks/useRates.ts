import { useQuery } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { apiClient } from '../api/apiClient';

interface RatesResponse {
  base: string;
  rates: Record<string, { rate: number; symbol: string; name: string }>;
  notes: Record<string, string>;
}

function fetchRates(): Promise<AxiosResponse<RatesResponse>> {
  return apiClient.get('/currency/rates');
}

export function useRates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['currency', 'rates'],
    queryFn: fetchRates,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });

  const rates: Record<string, number> = {};
  if (data?.data?.rates) {
    for (const [cur, info] of Object.entries(data.data.rates)) {
      rates[cur] = (info as { rate: number; symbol: string; name: string }).rate;
    }
  }

  return { rates, isLoading, error };
}
