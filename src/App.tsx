/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  Save, 
  Sparkles, 
  CheckCircle, 
  HelpCircle,
  Database,
  TrendingUp,
  FolderPlus
} from 'lucide-react';
import { Transaction, IncomeMonth, Category, UserSession } from './types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_INCOME, 
  DEFAULT_CATEGORIES, 
  BG_IMAGE_CONTEXT_1 
} from './data';
import LoginRegister from './components/LoginRegister';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import ProcessExtratoModal from './components/ProcessExtratoModal';
import ProcessFaturaModal from './components/ProcessFaturaModal';
import NovaCategoriaModal from './components/NovaCategoriaModal';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  fetchDespesas,
  listarDespesasPorMes,
  somarDespesasPorMes,
  somarDespesasPorTrimestre,
  somarDespesasPorAno,
  somarDespesasPorCategoriaEmCadaMes,
  atualizarDespesa,
  eliminarDespesa,
  somarProventosPorMes,
  somarProventosPorTrimestre,
  somarProventosPorAno,
  type PeriodResponseItem,
  type DespesaCategoriaMesItem,
} from './services/api';


const formatCurrency = (val: number) => {
  return val.toFixed(2).replace('.', ',');
};

const formatDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);

  // Core Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeList, setIncomeList] = useState<IncomeMonth[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Navigation and UI States
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Modals visibility states
  const [showExtratoModal, setShowExtratoModal] = useState(false);
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);

  // Income Addition Drawer State
  const [newMonthName, setNewMonthName] = useState('');
  const [newMonthAmount, setNewMonthAmount] = useState('');

  // Setting Preferences States
  const [settingsName, setSettingsName] = useState('');
  const [settingsAvatar, setSettingsAvatar] = useState('');
  const [settingsApiUrl, setSettingsApiUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [selectedYear, setSelectedYear] = useState('2026');

  // Real Java Spring Boot API aggregated states
  const [backendDespesasMes, setBackendDespesasMes] = useState<PeriodResponseItem[]>([]);
  const [backendDespesasTrimestre, setBackendDespesasTrimestre] = useState<PeriodResponseItem[]>([]);
  const [backendDespesasAno, setBackendDespesasAno] = useState<PeriodResponseItem[]>([]);
  const [backendDespesasCategoriaMes, setBackendDespesasCategoriaMes] = useState<DespesaCategoriaMesItem[]>([]);
  const [backendProventosMes, setBackendProventosMes] = useState<PeriodResponseItem[]>([]);
  const [backendProventosTrimestre, setBackendProventosTrimestre] = useState<PeriodResponseItem[]>([]);
  const [backendProventosAno, setBackendProventosAno] = useState<PeriodResponseItem[]>([]);

  // Refs para evitar double-fetch no boot e race entre os efeitos.
  const hasBootstrapped = useRef(false);
  const hasInitialPersist = useRef({ tx: false, income: false, cat: false });


  // Synchronizer function with Java Backend API
  const syncJavaApiTransactions = async (silent = false) => {
    setIsSyncing(true);
    if (!silent) {
      triggerToast(`Sincronizando dados de ${selectedYear} com o backend Java...`, false);
    }

    // Lê o token diretamente do localStorage para evitar race com o setSession do boot.
    let token = session?.token;
    if (!token) {
      try {
        const raw = sessionStorage.getItem('fc_session');
        if (raw) token = JSON.parse(raw)?.token;
      } catch {
        /* ignore */
      }
    }

    try {
      // 1. Busca despesas de todos os 12 meses em paralelo.
      let allFetched: Transaction[] = [];
      try {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const results = await Promise.allSettled(
          months.map(m => listarDespesasPorMes(m, selectedYear, token)),
        );
        allFetched = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
      } catch (e: any) {
        console.warn('[listarDespesasPorMes Fallback]', e?.message || e);
      }


      // If we got items from listing despesas, store them
      if (allFetched.length > 0) {
        setTransactions(prev => {
          const fetchedIds = new Set(allFetched.map(item => item.id));
          const union = [...allFetched, ...prev.filter(p => !fetchedIds.has(p.id))];
          sessionStorage.setItem('fc_transactions', JSON.stringify(union));
          return union;
        });
      } else {
        // Otherwise, see if standard fetchDespesas works
        try {
          const generalApi = await fetchDespesas();
          if (generalApi && generalApi.length > 0) {
            setTransactions(generalApi);
            sessionStorage.setItem('fc_transactions', JSON.stringify(generalApi));
          }
        } catch (errApi) {}
      }

      // 2. Load all sum metrics for the selectedYear
      const despesasMes = await somarDespesasPorMes(selectedYear, token);
      setBackendDespesasMes(despesasMes);

      const despesasTrimestre = await somarDespesasPorTrimestre(selectedYear, token);
      setBackendDespesasTrimestre(despesasTrimestre);

      const despesasAno = await somarDespesasPorAno(selectedYear, token);
      setBackendDespesasAno(despesasAno);

      const despesasCatMes = await somarDespesasPorCategoriaEmCadaMes(selectedYear, token);
      setBackendDespesasCategoriaMes(despesasCatMes);

      const proventosMes = await somarProventosPorMes(selectedYear, token);
      setBackendProventosMes(proventosMes);

      if (proventosMes && proventosMes.length > 0) {
        const proventosNormalizados = proventosMes.map((item: any) => ({
          // Converte 'periodo' do back para 'month' do front
          month: item.periodo || item.período || 'Sem Referência',
          // Converte 'total' do back para 'amount' do front
          amount: Number(item.total) || 0,
          // Injeta o array fake que o componente de Sparkline/Gráfico exige para não quebrar
          pattern: [10, 15, 12, 18, 14, 20] 
        }));

        // Atualiza o estado que a Dashboard (Overview) e os gráficos usam!
        setIncomeList(proventosNormalizados);
      } else {
        setIncomeList([]);
      }

      const proventosTrimestre = await somarProventosPorTrimestre(selectedYear, token);
      setBackendProventosTrimestre(proventosTrimestre);

      const proventosAno = await somarProventosPorAno(selectedYear, token);
      setBackendProventosAno(proventosAno);

      setApiOnline(true);
      if (!silent) {
        triggerToast(`Conectado! Dados de ${selectedYear} sincronizados com sucesso.`, false);
      }
    } catch (err: any) {
      setApiOnline(false);
      if (!silent) {
        console.error('Erro de sincronização completa:', err);
        triggerToast('Erro de sincronização: Não foi possível obter todos os dados agregados da API Java.', true);
      } else {
        console.info('[API Java Spring Boot: Local Mode] Utilizando dados armazenados no LocalStorage à espera de conexão local.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial Load from LocalStorage or Data Template
  useEffect(() => {
    // Initialize API URL preference
    setSettingsApiUrl(getApiBaseUrl());

    // 1. Session load
    try {
      const savedSession = sessionStorage.getItem('fc_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.token) {
          setSession(parsed);
          setSettingsName(parsed.name);
          setSettingsAvatar(parsed.avatar);
        } else {
          sessionStorage.removeItem('fc_session');
        }
      }
    } catch {
      sessionStorage.removeItem('fc_session');
    }

    // 2. Transactions load
    try {
      const savedTransactions = sessionStorage.getItem('fc_transactions');
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []); // <-- Alterado para []
    } catch {
      setTransactions([]); // <-- Alterado para []
    }

    // 3. Income months load
    try {
      const savedIncome = sessionStorage.getItem('fc_income');
      setIncomeList(savedIncome ? JSON.parse(savedIncome) : []); // <-- Alterado para []
    } catch {
      setIncomeList([]); // <-- Alterado para []
    }

    // 4. Categories load
    try {
      const savedCategories = sessionStorage.getItem('fc_categories');
      setCategories(savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // Persistência local — grava SEMPRE após o primeiro carregamento,
  // inclusive listas vazias (assim deletar a última transação persiste).
  useEffect(() => {
    if (!hasInitialPersist.current.tx) {
      hasInitialPersist.current.tx = true;
      return;
    }
    if (session && transactions.length > 0) {
      sessionStorage.setItem('fc_transactions', JSON.stringify(transactions));
    }
  }, [transactions, session]);

  useEffect(() => {
    if (!hasInitialPersist.current.income) {
      hasInitialPersist.current.income = true;
      return;
    }
    sessionStorage.setItem('fc_income', JSON.stringify(incomeList));
  }, [incomeList]);

  useEffect(() => {
    if (!hasInitialPersist.current.cat) {
      hasInitialPersist.current.cat = true;
      return;
    }
    sessionStorage.setItem('fc_categories', JSON.stringify(categories));
  }, [categories]);

  // Sync com a API: roda uma vez no boot e quando ano ou sessão mudarem.
  // Usa ref para evitar double-fetch causado pelo StrictMode + setTimeout antigo.

  useEffect(() => {
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true;
    }
    syncJavaApiTransactions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, session?.token]);


  // Utility toast messenger
  const triggerToast = (text: string, isError: boolean = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Auth Operations

  const handleLoginSuccess = (userData: UserSession) => {
    setSession(userData);
    setSettingsName(userData.name);
    setSettingsAvatar(userData.avatar);
    sessionStorage.setItem('fc_session', JSON.stringify(userData));
    triggerToast(`Acesso concedido como ${userData.name}!`);
  };

  const handleLogout = () => {

  sessionStorage.removeItem('fc_session');
  sessionStorage.removeItem('fc_transactions');
  sessionStorage.removeItem('fc_income');
  sessionStorage.removeItem('fc_categories');
  
  // 3. Limpa o restante do sessionStorage por garantia
  sessionStorage.clear();

  // 4. Reseta os estados do React para o valor inicial
  setSession(null);
  setTransactions([]);
  setIncomeList([]);
  if (typeof setBackendDespesasMes === 'function') {
    setBackendDespesasMes([]);
  }
    triggerToast('Sessão encerrada com sucesso.');
  };

  // Export cumulative state download
  const handleExportData = () => {
    const backup = {
      transactions,
      incomeList,
      categories,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_core_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast('Backup financeiro gerado e baixado!');
  };

  // Modal Imports Handlers
  const handleImportFromExtrato = (newItems: Transaction[]) => {
    setTransactions(prev => [...newItems, ...prev]);
    triggerToast(`${newItems.length} transações importadas do extrato bancário!`);
  };

  const handleImportFromFatura = (newItems: Transaction[]) => {
    setTransactions(prev => [...newItems, ...prev]);
    triggerToast(`${newItems.length} transações importadas da fatura de cartão!`);
  };

  const handleAddCategory = (name: string) => {
    const cleanId = 'cat_' + name.toLowerCase().replace(/\s+/g, '_');
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      triggerToast('Esta categoria já existe!', true);
      return;
    }
    const newCatType = 'expense';
    const newCat: Category = { id: cleanId, name, type: newCatType };
    setCategories(prev => [...prev, newCat]);
    triggerToast(`Categoria "${name}" criada com sucesso!`);
  };

  // Manual transaction events
  const handleAddTransaction = (item: Omit<Transaction, 'id'>) => {
    const newItem: Transaction = {
      id: crypto.randomUUID(),
      ...item
    };
    setTransactions(prev => [newItem, ...prev]);
    triggerToast(`Despesa "${item.description}" adicionada!`);
  };

  const handleDeleteTransaction = async (id: string) => {
    const targetTx = transactions.find(t => t.id === id);
    // 1. Delete locally first or as fallback
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // 2. Clear from API if online
    if (apiOnline && session?.token) {
      try {
        await eliminarDespesa({
          id,
          categoria: targetTx?.category || '',
          data: targetTx?.date || '',
          descricao: targetTx?.description || '',
          valor: targetTx?.amount || 0
        }, session.token);
        triggerToast(`Transação ${id} excluída com sucesso da API!`);
        // Refresh metrics
        setTimeout(() => syncJavaApiTransactions(true), 120);
      } catch (err: any) {
        console.error('Erro ao excluir transação na API:', err);
        triggerToast('Excluída localmente. Não foi possível sincronizar a exclusão com a API.', true);
      }
    } else {
      triggerToast('Transação excluída localmente!');
    }
  };

  const handleUpdateCategory = async (transactionId: string, item: Transaction, newCategory: string) => {
    // 1. Update locally
    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, category: newCategory } : t));

    // 2. Update in API if online
    if (apiOnline && session?.token) {
      try {
        await atualizarDespesa({
          id: transactionId,
          categoria: newCategory,
          data: item.date,
          descricao: item.description,
          valor: item.amount.toString()
        }, session.token);
        triggerToast(`Categoria atualizada para "${newCategory}" com sucesso na API!`);
        // Refresh metrics
        setTimeout(() => syncJavaApiTransactions(true), 120);
      } catch (err: any) {
        console.error('Erro ao atualizar categoria na API:', err);
        triggerToast('Atualizada localmente. Erro ao persistir na API.', true);
      }
    } else {
      triggerToast(`Categoria atualizada localmente para "${newCategory}"!`);
    }
  };

  // Add Income Month Handler
  const handleAddIncomeMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthName.trim() || !newMonthAmount) return;

    const exists = incomeList.some(i => i.month.toLowerCase() === newMonthName.trim().toLowerCase());
    if (exists) {
      triggerToast('Este mês já possui proventos registrados!', true);
      return;
    }

    const newItem: IncomeMonth = {
      month: newMonthName.trim(),
      amount: parseFloat(newMonthAmount),
      pattern: [10, 15, 12, 18, 14, 20] // Default nice sparkline layout template
    };

    setIncomeList(prev => [...prev, newItem]);
    setNewMonthName('');
    setNewMonthAmount('');
    triggerToast(`Proventos do mês ${newItem.month} adicionados!`);
  };

  // Settings Save Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim() || !settingsAvatar.trim()) return;

    if (session) {
      const updated = { ...session, name: settingsName, avatar: settingsAvatar };
      setSession(updated);
      sessionStorage.setItem('fc_session', JSON.stringify(updated));
      
      // Update backend base URL and notify user
      setApiBaseUrl(settingsApiUrl.trim());
      triggerToast('Preferências e URL da API salvas com sucesso!');
    }
  };

  const handleResetData = () => {
    if (window.confirm("Aviso: Isso resetará todas as despesas e receitas para os valores padrão. Deseja continuar?")) {
      setTransactions(INITIAL_TRANSACTIONS);
      setIncomeList(INITIAL_INCOME);
      setCategories(DEFAULT_CATEGORIES);
      sessionStorage.removeItem('fc_transactions');
      sessionStorage.removeItem('fc_income');
      sessionStorage.removeItem('fc_categories');
      triggerToast('Dados redefinidos para os padrões de boot.', true);
    }
  };

  // Route/Tab visual render routing helper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview 
            userSession={session!}
            transactions={transactions}
            incomeList={incomeList}
            categories={categories}
            onTriggerExtrato={() => setShowExtratoModal(true)}
            onTriggerFatura={() => setShowFaturaModal(true)}
            onTriggerCategoria={() => setShowCategoriaModal(true)}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isSyncing={isSyncing}
            onSyncJavaApi={() => syncJavaApiTransactions(false)}
            apiOnline={apiOnline}
            selectedYear={selectedYear}
            onSelectedYearChange={setSelectedYear}
            backendDespesasMes={backendDespesasMes}
            backendDespesasTrimestre={backendDespesasTrimestre}
            backendDespesasAno={backendDespesasAno}
            backendDespesasCategoriaMes={backendDespesasCategoriaMes}
            backendProventosMes={backendProventosMes}
            backendProventosTrimestre={backendProventosTrimestre}
            backendProventosAno={backendProventosAno}
            onUpdateCategory={handleUpdateCategory}
          />
        );
      
      case 'income':
          return (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="font-display text-2xl font-bold uppercase text-[#a5e7ff] tracking-wider">Detalhamento de Proventos</h2>
                {/* Agora exibindo o total do backend */}
                <span className="font-mono text-xs text-slate-500">Total cadastrados: {backendProventosMes.length}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário (Esquerda) */}
                <div className="glass-card p-6 rounded-xl border border-sky-500/20">
                  <h3 className="font-display text-sm font-semibold mb-6 flex items-center gap-1.5 text-sky-400 uppercase tracking-widest leading-none">
                    <TrendingUp size={18} />
                    Adicionar Provento
                  </h3>
                  
                  <form onSubmit={handleAddIncomeMonth} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 tracking-wider">Selecione ou digite o Mês</label>
                      <input 
                        type="text"
                        placeholder="Ex: Junho"
                        required
                        value={newMonthName}
                        onChange={(e) => setNewMonthName(e.target.value)}
                        className="w-full bg-[#0a0e14] border border-sky-500/20 text-slate-200 rounded p-2.5 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1 tracking-wider">Valor do salário (R$)</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        required
                        step="0.01"
                        value={newMonthAmount}
                        onChange={(e) => setNewMonthAmount(e.target.value)}
                        className="w-full bg-[#0a0e14] border border-sky-500/20 text-slate-200 rounded p-2.5 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#00a8ff] hover:brightness-110 active:scale-95 text-slate-900 font-display font-bold py-2.5 rounded text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,168,255,0.25)] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Adicionar</span>
                    </button>
                  </form>
                </div>

                {/* Lista vinda do Backend (Direita) */}
                <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-slate-800">
                  <h3 className="font-display text-sm font-semibold mb-6 text-slate-400 uppercase tracking-wider">Histórico de Receitas (Backend)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                          <th className="py-3">Mês de Referência</th>
                          <th className="py-3 text-right">Provento</th>
                          <th className="py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backendProventosMes.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-900/10 transition-colors">
                            {/* Correção dos campos: item.periodo e item.total */}
                            <td className="py-3 font-semibold text-slate-300">{item.periodo || item.período}</td>
                            <td className="py-3 text-right font-mono text-cyan-400 font-semibold">R$ {formatCurrency(item.total)}</td>
                            <td className="py-3 text-center text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                              Sincronizado
                            </td>
                          </tr>
                        ))}
                        {backendProventosMes.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-500 font-mono">
                              Nenhum provento encontrado no backend para {selectedYear}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );

      case 'expenses':
        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h2 className="font-display text-2xl font-bold uppercase text-[#95ccff] tracking-wider">Fluxo de Despesas</h2>
              <span className="font-mono text-xs text-slate-500">Total transações: {transactions.length}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category distribution widgets */}
              <div className="glass-card p-6 rounded-xl border border-slate-800 col-span-4 lg:col-span-1 space-y-4">
                <h3 className="font-display text-xs font-semibold uppercase text-slate-500 tracking-wider">Análise por Mês</h3>
                <div className="space-y-3">
                  {Object.entries(
                    transactions.reduce((acc, t) => {
                      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                      const d = new Date(t.date);
                      const m = isNaN(d.getTime()) ? 'Outros' : months[d.getMonth()];
                      acc[m] = (acc[m] || 0) + t.amount;
                      return acc;
                    }, {} as { [key: string]: number })
                  ).map(([month, sum]) => (
                    <div key={month} className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
                      <span className="capitalize font-semibold">{month}</span>
                      <span className="font-mono text-sky-400 font-semibold">R$ {formatCurrency(sum as number)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions master table */}
              <div className="glass-card p-6 rounded-xl border border-slate-800 col-span-4 lg:col-span-3">
                <h3 className="font-display text-sm font-semibold mb-6 text-slate-300 uppercase tracking-widest">Todos Lançamentos de Despesa</h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1c2026] text-sky-400 font-mono text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Data</th>
                        <th className="p-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} className="border-b border-slate-800/40 hover:bg-slate-900/20 transition-colors">
                          <td className="p-3 font-mono text-slate-500">{t.id}</td>
                          <td className="p-3 font-semibold text-slate-200">{t.description}</td>
                          <td className="p-3 text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-850 border border-slate-700/60 font-semibold text-[10px]">
                              {t.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">{formatDate(t.date)}</td>
                          <td className="p-3 text-right font-mono text-sky-400 font-semibold">R$ {formatCurrency(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h2 className="font-display text-2xl font-bold uppercase text-[#95ccff] tracking-wider">Gestão de Categorias</h2>
              <span className="font-mono text-xs text-slate-500">Disponíveis: {categories.length}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="glass-card p-6 rounded-xl border border-sky-500/10">
                <h3 className="font-display text-sm font-semibold mb-6 text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FolderPlus size={18} />
                  Nova Categoria
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as HTMLFormElement;
                  const val = (target.elements.namedItem('category_name') as HTMLInputElement).value;
                  if (val.trim()) {
                    handleAddCategory(val.trim());
                    target.reset();
                  }
                }} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Nome da Categoria</label>
                    <input 
                      name="category_name"
                      type="text"
                      required
                      placeholder="Ex: Assinaturas Digitais"
                      className="w-full bg-[#0a0e14] border border-sky-500/20 text-slate-200 rounded p-2.5 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#00a8ff] hover:brightness-110 text-slate-900 font-display font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Criar Categoria
                  </button>
                </form>
              </div>

              {/* Grid cards displaying categories */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map(c => (
                  <div key={c.id} className="p-4 border border-slate-800 rounded-lg bg-[#10141a]/50 flex items-center justify-between hover:border-sky-500/30 transition-all font-mono">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
                      <span className="text-xs text-slate-300 uppercase tracking-wide font-medium">{c.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{c.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8 animate-in fade-in duration-200 uppercase">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-2xl font-bold text-[#95ccff] tracking-wider">Ajustes & Preferências</h2>
            </div>

            <div className="max-w-2xl glass-card p-6 rounded-xl border border-slate-800">
              <h3 className="font-display text-sm font-semibold mb-6 text-slate-400 tracking-wider">Configurar Conta</h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Nome Completo</label>
                  <input 
                    type="text"
                    required
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 text-slate-200 rounded p-2.5 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Link Direto do Avatar (URL)</label>
                  <input 
                    type="url"
                    required
                    value={settingsAvatar}
                    onChange={(e) => setSettingsAvatar(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 text-slate-200 rounded p-2.5 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">URL Completa da API Java Spring Boot</label>
                  <input 
                    type="url"
                    required
                    value={settingsApiUrl}
                    onChange={(e) => setSettingsApiUrl(e.target.value)}
                    placeholder="Ex: http://localhost:8080"
                    className="w-full bg-[#0a0e14] border border-slate-800 text-slate-200 rounded p-2.5 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1 lowercase">
                    Recurso para busca automatizada e dinâmica de despesas na rota "/despesas/listarDespesasPorMes"
                  </p>
                </div>

                <div className="flex gap-4 border-t border-slate-800 pt-5 mt-4 justify-between">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="px-4 py-2 bg-red-950/20 border border-red-500/30 text-red-400 font-mono text-xs font-bold rounded hover:bg-red-950/40 cursor-pointer"
                  >
                    Resetar Dados Gerais
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00a8ff] text-slate-900 font-display font-bold text-xs rounded hover:brightness-110 cursor-pointer"
                  >
                    Salvar Ajustes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Login Gate checking - Ensure valid session and successful token exists
  if (!session || !session.token) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative min-h-screen bg-[#0a0e14] text-[#dfe2eb] font-sans flex flex-col md:flex-row overflow-x-hidden">
      
      {/* Dynamic Background Image Context Panel (Opacity overlay) */}
      <div 
        className="fixed inset-0 w-full h-full z-0 opacity-15 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE_CONTEXT_1})` }}
      />
      <div className="fixed inset-0 w-full h-full z-0 opacity-30 bg-[radial-gradient(circle_at_center,_#111827_0%,_#0a0e14_100%)] pointer-events-none" />

      {/* Global Alert Notification Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border ${
          toast.isError 
            ? 'bg-red-950/90 border-red-500/50 text-red-200' 
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          <CheckCircle size={18} className={toast.isError ? 'text-red-400' : 'text-emerald-400'} />
          <span className="font-display text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onExport={handleExportData}
        isOpenOnMobile={isMobileSidebarOpen}
        setIsOpenOnMobile={setIsMobileSidebarOpen}
      />

      {/* Primary Dashboard Frame Wrapper */}
      <main className="flex-1 min-h-screen p-4 md:p-10 md:ml-64 relative z-10 overflow-y-auto pt-16 md:pt-10">
        <div className="max-w-7xl mx-auto">
          {renderTabContent()}
        </div>
      </main>

      {/* MODALS */}
      {showExtratoModal && (
        <ProcessExtratoModal 
          onClose={() => setShowExtratoModal(false)}
          onImportTransactions={handleImportFromExtrato}
          userToken={session?.token}
        />
      )}

      {showFaturaModal && (
        <ProcessFaturaModal 
          onClose={() => setShowFaturaModal(false)}
          onImportTransactions={handleImportFromFatura}
          userToken={session?.token}
        />
      )}

      {showCategoriaModal && (
        <NovaCategoriaModal 
          onClose={() => setShowCategoriaModal(false)}
          categories={categories}
          onAddCategory={handleAddCategory}
          userToken={session?.token}
        />
      )}

    </div>
  );
}
