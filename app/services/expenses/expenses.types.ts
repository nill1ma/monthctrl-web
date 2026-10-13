export interface Expense {
  id: string;
  destination: string;
  value: number;
  payment_day: string | null;
  due_date: string | null;
  user_id: string;
  reference: string;
  currency: string;
}
export type DetailsIncomingData = Pick<Expense, 'id' | 'value' | 'destination' | 'currency'>
export type CreateExpense = Pick<Expense, 'value' | 'destination' | 'reference'>
export type UpdateExpense = Pick<Expense, 'id' | 'value' | 'destination' | 'reference'>
