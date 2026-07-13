/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
}

export interface IncomeMonth {
  month: string;
  amount: number;
  pattern: number[]; // points for mini inline sparkline chart
}

export interface ExpenseMonthSum {
  month: string;
  amount: number;
}

export interface QuarterlySummary {
  quarter: string;
  amount: number;
}

export interface AnnualSummary {
  year: string;
  amount: number;
}

export interface UserSession {
  name: string;
  username: string;
  avatar: string;
  token?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}
