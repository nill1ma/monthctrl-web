export const CURRENCY_FLAGS: Record<string, string> = {
  // América do Norte
  USD: "🇺🇸",
  CAD: "🇨🇦",
  MXN: "🇲🇽",
  // América do Sul
  BRL: "🇧🇷",
  ARS: "🇦🇷",
  COP: "🇨🇴",
  CLP: "🇨🇱",
  PEN: "🇵🇪",
  UYU: "🇺🇾",
  BOB: "🇧🇴",
  PYG: "🇵🇾",
  VES: "🇻🇪",
  // Europa
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  CHF: "🇨🇭",
  NOK: "🇳🇴",
  SEK: "🇸🇪",
  DKK: "🇩🇰",
  PLN: "🇵🇱",
  CZK: "🇨🇿",
  HUF: "🇭🇺",
  RON: "🇷🇴",
  // Ásia / Oceania
  JPY: "🇯🇵",
  CNY: "🇨🇳",
  KRW: "🇰🇷",
  INR: "🇮🇳",
  AUD: "🇦🇺",
  NZD: "🇳🇿",
  SGD: "🇸🇬",
  HKD: "🇭🇰",
  THB: "🇹🇭",
  // Outros
  ZAR: "🇿🇦",
  AED: "🇦🇪",
  ILS: "🇮🇱",
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_FLAGS);

export function getCurrencyFlag(currencyCode: string): string {
  return CURRENCY_FLAGS[currencyCode] ?? "💱";
}

/**
 * Converte `amount` de `fromCurrency` para `displayCurrency`.
 * `rates` é o objeto retornado pela API com base = displayCurrency.
 * Ex: base=USD, rates={ BRL: 5.5 } → 1 USD = 5.5 BRL, então BRL→USD = amount / 5.5
 */
export function convertToDisplayCurrency(
  amount: number,
  fromCurrency: string,
  displayCurrency: string,
  rates: Record<string, number>
): number | null {
  if (fromCurrency === displayCurrency) return amount;

  const rate = rates[fromCurrency];
  if (!rate) return null;

  return amount / rate;
}

export function formatCurrency(
  value: number,
  currencyCode: string,
  locale = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}
