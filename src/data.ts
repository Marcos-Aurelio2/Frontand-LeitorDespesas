/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, IncomeMonth, Category } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    description: 'Pizza',
    category: 'Alimentação',
    date: '2026-04-04',
    amount: 30.00,
    type: 'expense'
  },
  {
    id: '2',
    description: 'Corte cabelo',
    category: 'Cuidado pessoal',
    date: '2026-04-10',
    amount: 35.50,
    type: 'expense'
  },
  {
    id: '3',
    description: 'Faculdade',
    category: 'Educação',
    date: '2026-04-11',
    amount: 150.00,
    type: 'expense'
  },
  {
    id: '4',
    description: 'Aluguel',
    category: 'Aluguel',
    date: '2026-04-15',
    amount: 750.00,
    type: 'expense'
  },
  {
    id: '12',
    description: 'Corte cabelo',
    category: 'Cuidado pessoal',
    date: '2026-04-04',
    amount: 30.00,
    type: 'expense'
  },
  {
    id: '13',
    description: 'Faculdade',
    category: 'Educação',
    date: '2026-04-10',
    amount: 35.50,
    type: 'expense'
  }
];

export const INITIAL_INCOME: IncomeMonth[] = [
  { month: 'Janeiro', amount: 4500.00, pattern: [20, 15, 18, 10, 5, 2] },
  { month: 'Fevereiro', amount: 6000.00, pattern: [18, 10, 12, 5, 8, 0] },
  { month: 'Março', amount: 5000.00, pattern: [15, 18, 10, 12, 8, 5] },
  { month: 'Abril', amount: 4000.00, pattern: [20, 18, 15, 12, 10, 8] },
  { month: 'Maio', amount: 6000.00, pattern: [15, 10, 5, 8, 2, 0] },
  { month: 'Maio (Extra)', amount: 5000.00, pattern: [18, 15, 12, 10, 5, 2] }
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_fixa', name: 'Despesas Fixas', type: 'expense' },
  { id: 'cat_alimentacao', name: 'Alimentação', type: 'expense' },
  { id: 'cat_transporte', name: 'Transporte', type: 'expense' },
  { id: 'cat_lazer', name: 'Lazer', type: 'expense' },
  { id: 'cat_saude', name: 'Saúde', type: 'expense' },
  { id: 'cat_educacao', name: 'Educação', type: 'expense' },
  { id: 'cat_cuidado', name: 'Cuidado pessoal', type: 'expense' },
  { id: 'cat_aluguel', name: 'Aluguel', type: 'expense' }
];

export const AVATAR_DASHBOARD = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhpmqYmsk1PWHV8zNI0__kEZgYzezkwBTLg1NVGyZsw0mTl_tTNi0NwFkqRg-0GR6aNGkLUOKVeIVTjaoszVSwq56_frLpcC4VMD0E3dJD7_f4Qin076eXyK46nS3HRoD1CWcaWR1RsgCofFOJG9Z1RgJVl0H6HMvc05VcR34JQWSxY9ohyYJ9Dlx32ROKxSo3IzlJvdXUC2GzfaIJk6RaujoiZuG0D-pnKgRU5YJODbhMlmhDUo6jXT1rb01uti7bhCYVU-bgfyaq';
export const AVATAR_LOGIN = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF6d6DqkGpKWW7AMBmpP1fFOKOEtnISk3nhMy0geGp6bsroQqf94fE8GCSyDZi8VGjN-_w_YWv_wgnsniY0zNEEtvf2SdehzSlSPrBbAH0mY6enHEz7czeTXUfbIrbC7HvJjWimOz6559FvKM74GeJv-pQR66qtovWFdujtowfM1xLYCrl_VWb73nf3vR4GNaBGryIxuLOJln-DPL_Q6gkCyRhSRZxyirPjyH1UUIBLBqDGCgwti_GcTnJRhyY1Chkl9Dvldbmj4FL';
export const BG_IMAGE_CONTEXT_1 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv32hJz2MF1B35CrbgGRAew-TB_A5ljUfWTBHUz3ew_pqRq94MOv3bIYGE-W8TxXT5A3_ypVui3EPvAYxvhPjXzcI9vPhXmztSZj5C5rei6TVB65nhUKDLHEsGXW31FpOPn6G-Ocngkc9EVigEAKzpoQLUwPhiSuQWxaeQkrLfbtkz9OozH5hj0eYbxxADgOAkftMUt4WHNIdPktReKHidFi0QVVxqy2bQyihp-rFQnnvfx0OKEnVPs2fBPLten0nvJn9FefnYyWSh';
export const BG_IMAGE_CONTEXT_2 = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbYKQe5356e1vKlz_V6AhGnsw6p8EbbI-cre9ngqZ4IFJMOX5WoeXO-M0jbLt5MeH78wF9142UV1lQrDfEABqGwFwBvCu-BnsqX0k-aQKFSZK2T3X4m9Gs2-x5ObD37UZ35tVIe75ClvFg2lBx0y_2cpWtHfsht5qVRX975I57taKqZzrWFH4YRk3C89oWzL46UvGXON9aB46EixVEV4YZbB5SJvfdDbm1AWJeDiKghyNysNzkDaJeg57vYNd3K_8iza8YEyBfDy0z';
