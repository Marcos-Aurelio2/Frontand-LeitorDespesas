/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { Transaction } from '../types';

export interface BackendDespesa {
  id: number;
  descricao: string;
  categoria: string;
  data: string;
  valor: number;
  tipo: 'DESPESA' | 'RECEITA' | string;
}

const DEFAULT_API_URL = 'http://localhost:8080';

/**
 * Returns the currently configured API Java URL from localStorage,
 * falling back to VITE_API_BASE_URL env or standard localhost.
 */
export function getApiBaseUrl(): string {
  const saved = localStorage.getItem('fc_api_url');
  if (saved) return saved;
  
  // Also check if process or import.meta has an env var
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  return envUrl || DEFAULT_API_URL;
}

/**
 * Persists a new base URL to localStorage.
 */
export function setApiBaseUrl(url: string) {
  if (url) {
    localStorage.setItem('fc_api_url', url.trim());
  } else {
    localStorage.removeItem('fc_api_url');
  }
}

/**
 * Fetches expenses from the Java Backend endpoint and maps them to our application model.
 */
export async function fetchDespesas(): Promise<Transaction[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/listarDespesasPorMes`;
  
  try {
    const response = await axios.get<BackendDespesa[]>(url);
    const data = response.data || [];
    
    return data.map(item => {
      // Clean category mapping to support accentuation
      const categoryMapping: { [key: string]: string } = {
        'Alimentacao': 'Alimentação',
        'Saude': 'Saúde',
        'Educacao': 'Educação'
      };
      
      const mappedCategory = categoryMapping[item.categoria] || item.categoria;
      
      return {
        id: item.id.toString(),
        description: item.descricao,
        category: mappedCategory,
        date: item.data,
        amount: item.valor,
        type: item.tipo === 'RECEITA' ? 'income' : 'expense'
      };
    });
  } catch (error: any) {
    console.warn(`[Java Backend Connection] Servidor em ${url} indisponível. Detalhe: ${error.message || error}`);
    throw error;
  }
}

export interface BackendRegistroRequest {
  nome: string;
  usuario: string;
  senha: string;
}

export interface BackendRegistroResponse {
  id: string;
  usuario: string;
}

export interface BackendLoginRequest {
  usuario: string;
  senha: string;
}

export interface BackendLoginResponse {
  token?: string;
  id?: string;
  usuario?: string;
}

/**
 * Performs a user login on the Java Backend
 * Route: /auth/login
 * Body: { "usuario": string, "senha": string }
 * Response: token (stored in session)
 */
export async function loginUsuario(data: BackendLoginRequest): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/auth/login`;
  
  try {
    const response = await axios.post<any>(url, data);
    const responseData = response.data;

    // Aceita { token: "..." } ou uma string crua. Sem token => erro real.
    if (responseData && typeof responseData === 'object' && typeof responseData.token === 'string' && responseData.token.trim()) {
      return responseData.token.trim();
    }
    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData.trim();
    }

    throw new Error('Servidor não retornou um token de acesso válido.');

  } catch (error: any) {
    console.warn(`[Java Backend Login] Erro na rota /auth/login em ${url}. Detalhe: ${error.message || error}`);
    throw error;
  }
}

/**
 * Registers a new user on the Java Backend
 * Route: /auth/registrarUsuario
 * Body: { "nome": string, "usuario": string, "senha": string }
 * Response: { "id": string, "usuario": string }
 */
export async function registrarUsuario(data: BackendRegistroRequest): Promise<BackendRegistroResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/auth/registrarUsuario`;
  
  try {
    const response = await axios.post<BackendRegistroResponse>(url, data);
    return response.data;
  } catch (error: any) {
    console.warn(`[Java Backend Register] Erro na rota /auth/registrarUsuario em ${url}. Detalhe: ${error.message || error}`);
    throw error;
  }
}

/**
 * Uploads a bank statement (extrato) to the Java Backend for processing.
 * Route: /programa/salvarExtrato
 * Method: POST
 * Body: FormData with standard single parameter: 'arquivo'
 */
export async function registrarExtrato(file: File, token?: string): Promise<{ message: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/programa/salvarExtrato`;
  
  const formData = new FormData();
  formData.append('arquivo', file);

  // Do NOT set Content-Type manually for FormData — axios precisa adicionar o
  // boundary do multipart automaticamente.
  const headers: Record<string, string> = {};



  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const response = await axios.post<any>(url, formData, { headers });
    const data = response.data;
    
    // Check if the server returned an explicit success message or string
    let messageText = 'Processamento concluído com sucesso!';
    if (data) {
      if (typeof data === 'string') {
        messageText = data;
      } else if (typeof data === 'object') {
        messageText = data.message || data.msg || data.retorno || JSON.stringify(data);
      }
    }
    return { message: messageText };
  } catch (error: any) {
    console.warn(`[Java Backend Extrato] Erro ao enviar extrato para ${url}. Detalhe: ${error.message || error}`);
    throw error;
  }
}

/**
 * Uploads a credit card bill/invoice (fatura) to the Java Backend for processing.
 * Route: /programa/salvarFatura
 * Method: POST
 * Body: FormData with standard single parameter: 'arquivo'
 */
export async function registrarFatura(file: File, token?: string): Promise<{ message: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/programa/salvarFatura`;
  
  const formData = new FormData();
  formData.append('arquivo', file);

  // Mesma regra do extrato: axios define Content-Type + boundary a partir do FormData.
  const headers: Record<string, string> = {};



  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const response = await axios.post<any>(url, formData, { headers });
    const data = response.data;
    
    // Check if the server returned an explicit success message or string
    let messageText = 'Processamento da fatura concluído com sucesso!';
    if (data) {
      if (typeof data === 'string') {
        messageText = data;
      } else if (typeof data === 'object') {
        messageText = data.message || data.msg || data.retorno || JSON.stringify(data);
      }
    }
    return { message: messageText };
  } catch (error: any) {
    console.warn(`[Java Backend Fatura] Erro ao enviar fatura para ${url}. Detalhe: ${error.message || error}`);
    throw error;
  }
}

export interface BackendCategoriaRequest {
  descricao: string;
  categoria: string;
}

export interface BackendCategoriaResponse {
  id: string;
  descricao: string;
  categoria: string;
}

/**
 * Creates a new category on the Java Backend
 * Route: /programa/categoria/lancarCategoria
 * Body: { "descricao": string, "categoria": string }
 * Response: { "id": string, "descricao": string, "categoria": string }
 */
export async function lancarCategoria(data: BackendCategoriaRequest, token?: string): Promise<BackendCategoriaResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/programa/categoria/lancarCategoria`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const response = await axios.post<BackendCategoriaResponse>(url, data, { headers });
    return response.data;
  } catch (error: any) {
    console.warn(`[Java Backend lancarCategoria] Erro ao enviar categoria para ${url}. Detalhe: ${error.message || error}`);
    throw error;
  }
}

export interface PeriodResponseItem {
  período?: string;
  periodo?: string;
  total: number;
}

export interface CategoriaDespesaItem {
  categoria: string;
  total: number;
}

export interface DespesaCategoriaMesItem {
  MesAno: string;
  categoria: CategoriaDespesaItem[];
}

export interface BackendAtualizarDespesaRequest {
  id: string | number;
  categoria: string;
  data: string;
  descricao: string;
  valor: string | number;
}

export interface BackendAtualizarDespesaResponse {
  mensagem: string;
  detalheUpdate?: string;
  dadosAtualizados: {
    id: number;
    categoria: string;
    data: string;
    descricao: string;
    valor: number;
  };
}

/**
 * Lists expenses from the Java Backend filtered by year and month.
 */
export async function listarDespesasPorMes(mes: number | string, ano: number | string, token?: string): Promise<Transaction[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/listarDespesasPorMes`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const response = await axios.get<any[]>(url, {
      params: { mes, ano },
      headers
    });
    
    const data = response.data || [];
    return data.map(item => {
      // Map category accents representation
      const categoryMapping: { [key: string]: string } = {
        'Alimentacao': 'Alimentação',
        'Alimento': 'Alimentação',
        'Saude': 'Saúde',
        'Educacao': 'Educação',
        'Lazer': 'Lazer',
        'Transporte': 'Transporte'
      };
      const rawCat = item.categoria || 'Outros';
      const mappedCategory = categoryMapping[rawCat] || rawCat;
      
      return {
        id: (item.id !== undefined && item.id !== null) ? item.id.toString() : crypto.randomUUID(),
        description: item.descricao || '',
        id_backend: item.id, // preserve actual backend ID for deletes/updates
        category: mappedCategory,
        date: item.data || new Date().toISOString().split('T')[0],
        amount: Number(item.valor) || 0,
        type: 'expense'
      };
    });
  } catch (error: any) {
    console.warn(`[Java Backend listarDespesasPorMes] Erro em ${url}:`, error.message || error);
    throw error;
  }
}

/**
 * Sums expenses month-by-month for a specified year.
 */
export async function somarDespesasPorMes(ano: number | string, token?: string): Promise<PeriodResponseItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/somarDespesasPorMes`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<PeriodResponseItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}

/**
 * Sums expenses quarterly for a specified year.
 */
export async function somarDespesasPorTrimestre(ano: number | string, token?: string): Promise<PeriodResponseItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/somarDespesasPorTrimestre`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<PeriodResponseItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}

/**
 * Sums total expenses for a specified year.
 */
export async function somarDespesasPorAno(ano: number | string, token?: string): Promise<PeriodResponseItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/somarDespesasPorAno`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<PeriodResponseItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}

/**
 * Returns grouped expenditures by category inside each month.
 */
export async function somarDespesasPorCategoriaEmCadaMes(ano: number | string, token?: string): Promise<DespesaCategoriaMesItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/somarDespesasPorCategoriaEmCadaMes`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<DespesaCategoriaMesItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}

/**
 * Updates an existing despesa's content/category.
 */
export async function atualizarDespesa(data: BackendAtualizarDespesaRequest, token?: string): Promise<BackendAtualizarDespesaResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/atualizarDespesa`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.put<BackendAtualizarDespesaResponse>(url, data, { headers });
  return response.data;
}

/**
 * Deletes/eliminates a despesa item.
 */
export async function eliminarDespesa(data: BackendAtualizarDespesaRequest, token?: string): Promise<BackendAtualizarDespesaResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/despesas/eliminarDespesa`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  //data,

  const response = await axios.delete<BackendAtualizarDespesaResponse>(url,  { headers: headers,
    data: data
   });
  return response.data;
}

/**
 * Sums incomes (proventos) monthly for a specified year.
 */
export async function somarProventosPorMes(ano: number | string, token?: string): Promise<PeriodResponseItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/proventos/somarProventosPorMes`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<PeriodResponseItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}

/**
 * Sums incomes (proventos) quarterly for a specified year.
 */
export async function somarProventosPorTrimestre(ano: number | string, token?: string): Promise<PeriodResponseItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/proventos/somarProventosPorTrimestre`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<PeriodResponseItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}

/**
 * Sums total incomes (proventos) for a specified year.
 */
export async function somarProventosPorAno(ano: number | string, token?: string): Promise<PeriodResponseItem[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/proventos/somarProventosPorAno`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.get<PeriodResponseItem[]>(url, {
    params: { ano },
    headers
  });
  return response.data || [];
}



