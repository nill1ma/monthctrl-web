export interface CurrencyEntry {
  currency: string;
  incoming_value: number;
  expense_value: number;
  net_income: number;
}

export interface ReferenceGroup {
  reference: string;
  currencies: CurrencyEntry[];
}

export type ReferenceGroupResponse = {
  data: ReferenceGroup[];
  totalElements: number;
}
