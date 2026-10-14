import { useQuery } from "@tanstack/react-query";

export function useExchangeRates(base: string, targets: string[]) {
  const sortedTargets = [...targets].sort();

  return useQuery({
    queryKey: ["exchange-rates", base, sortedTargets.join(",")],
    queryFn: async () => {
      const res = await fetch(`/api/exchange-rates?base=${base}`);
      if (!res.ok) return {} as Record<string, number>;
      const json = await res.json();
      return json.rates as Record<string, number>;
    },
    enabled: sortedTargets.length > 0,
    staleTime: 1000 * 60 * 60, // 1h
  });
}
