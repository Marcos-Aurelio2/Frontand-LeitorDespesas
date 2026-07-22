/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react';
import { Transaction, IncomeMonth, Category } from '../types';

interface OverviewProps {
  userSession: { name: string; username: string; avatar: string };
  transactions: Transaction[];
  incomeList: IncomeMonth[];
  categories: Category[];
  onTriggerExtrato: () => void;
  onTriggerFatura: () => void;
  onTriggerCategoria: () => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  isSyncing?: boolean;
  onSyncJavaApi?: () => void;
  apiOnline?: boolean | null;
  selectedYear?: string;
  onSelectedYearChange?: (year: string) => void;
  backendDespesasMes?: any[];
  backendDespesasTrimestre?: any[];
  backendDespesasAno?: any[];
  backendDespesasCategoriaMes?: any[];
  backendProventosMes?: any[];
  backendProventosTrimestre?: any[];
  backendProventosAno?: any[];
  onUpdateCategory?: (transactionId: string, item: Transaction, newCategory: string) => void;
}

export default function Overview({
  userSession,
  transactions,
  incomeList,
  categories,
  onTriggerExtrato,
  onTriggerFatura,
  onTriggerCategoria,
  onAddTransaction,
  onDeleteTransaction,
  isSyncing = false,
  onSyncJavaApi,
  apiOnline = null,
  selectedYear = '2026',
  onSelectedYearChange,
  backendDespesasMes = [],
  backendDespesasTrimestre = [],
  backendDespesasAno = [],
  backendDespesasCategoriaMes = [],
  backendProventosMes = [],
  backendProventosTrimestre = [],
  backendProventosAno = [],
  onUpdateCategory
}: OverviewProps) {
  
  // Search state for transactions table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // New manual transaction input states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('2026-06-09');

  // Search/Filter transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, selectedCategoryFilter]);

  // Trimestre computation for Receipts (Local)
  const localQuarterlyIncome = useMemo(() => {
    let t1 = 0; // Jan, Feb, Mar
    let t2 = 0; // Apr, May, Jun
    let t3 = 0; // Jul, Aug, Sep
    let t4 = 0; // Oct, Nov, Dec

    incomeList.forEach(item => {
      const name = item.month.toLowerCase();
      if (name.includes('janeiro') || name.includes('fevereiro') || name.includes('março')) {
        t1 += item.amount;
      } else if (name.includes('abril') || name.includes('maio') || name.includes('junho')) {
        t2 += item.amount;
      } else if (name.includes('julho') || name.includes('agosto') || name.includes('setembro')) {
        t3 += item.amount;
      } else {
        t4 += item.amount;
      }
    });

    return { t1, t2, t3, t4 };
  }, [incomeList]);

  // Dynamic selector for quarterly income: uses API if online
  const quarterlyIncome = useMemo(() => {
    if (apiOnline && backendProventosTrimestre && backendProventosTrimestre.length > 0) {
      let t1 = 0, t2 = 0, t3 = 0, t4 = 0;
      backendProventosTrimestre.forEach(item => {
        const period = (item.período || item.periodo || '').toLowerCase();
        if (period.includes('1') || period.includes('primeiro')) t1 = item.total;
        else if (period.includes('2') || period.includes('segundo')) t2 = item.total;
        else if (period.includes('3') || period.includes('terceiro')) t3 = item.total;
        else if (period.includes('4') || period.includes('quarto')) t4 = item.total;
      });
      return { t1, t2, t3, t4 };
    }
    return localQuarterlyIncome;
  }, [apiOnline, backendProventosTrimestre, localQuarterlyIncome]);

  // Annual total computation
  const totalAnnualIncome = useMemo(() => {
    if (apiOnline && backendProventosAno && backendProventosAno.length > 0) {
      const match = backendProventosAno.find(item => (item.período || item.periodo || '').includes(selectedYear));
      if (match) return match.total;
      return backendProventosAno.reduce((acc, item) => acc + item.total, 0);
    }
    return incomeList.reduce((acc, item) => acc + item.amount, 0);
  }, [apiOnline, backendProventosAno, incomeList, selectedYear]);

  // Trimestre computation for Expenses
  const localQuarterlyExpenses = useMemo(() => {
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;
    let t4 = 0;

    transactions.forEach(item => {
      if (item.type === 'expense') {
        const monthNum = new Date(item.date).getMonth() + 1; // 1-indexed
        if (monthNum >= 1 && monthNum <= 3) {
          t1 += item.amount;
        } else if (monthNum >= 4 && monthNum <= 6) {
          t2 += item.amount;
        } else if (monthNum >= 7 && monthNum <= 9) {
          t3 += item.amount;
        } else {
          t4 += item.amount;
        }
      }
    });

    return { t1, t2, t3, t4 };
  }, [transactions]);

  const quarterlyExpenses = useMemo(() => {
    if (apiOnline && backendDespesasTrimestre && backendDespesasTrimestre.length > 0) {
      let t1 = 0, t2 = 0, t3 = 0, t4 = 0;
      backendDespesasTrimestre.forEach(item => {
        const period = (item.período || item.periodo || '').toLowerCase();
        if (period.includes('1') || period.includes('primeiro')) t1 = item.total;
        else if (period.includes('2') || period.includes('segundo')) t2 = item.total;
        else if (period.includes('3') || period.includes('terceiro')) t3 = item.total;
        else if (period.includes('4') || period.includes('quarto')) t4 = item.total;
      });
      return { t1, t2, t3, t4 };
    }
    return localQuarterlyExpenses;
  }, [apiOnline, backendDespesasTrimestre, localQuarterlyExpenses]);

  // Month-by-month sums for expenses table
  const localMonthlyExpensesSums = useMemo(() => {
    const sums: { [key: string]: number } = {
      'Janeiro': 0,
      'Fevereiro': 0,
      'Março': 0,
      'Abril': 0,
      'Maio': 0
    };

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const dateObj = new Date(t.date);
        const monthIndex = dateObj.getMonth(); // 0 is January
        const monthMap = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];
        if (monthIndex >= 0 && monthIndex < monthMap.length) {
          sums[monthMap[monthIndex]] += t.amount;
        }
      }
    });

    // Removidas as linhas de fallback (4500, 6000, 5000) 
    // para garantir que retorne R$ 0,00 se estiver vazio.

    return sums;
  }, [transactions]);

  const monthlyExpensesSums = useMemo(() => {
    if (apiOnline && backendDespesasMes && backendDespesasMes.length > 0) {
      const sums: { [key: string]: number } = {
        'Janeiro': 0,
        'Fevereiro': 0,
        'Março': 0,
        'Abril': 0,
        'Maio': 0,
        'Junho': 0,
        'Julho': 0,
        'Agosto': 0,
        'Setembro': 0,
        'Outubro': 0,
        'Novembro': 0,
        'Dezembro': 0
      };

      const portugueseToLocalMap: { [key: string]: string } = {
        'janeiro': 'Janeiro', 'fevereiro': 'Fevereiro', 'março': 'Março', 'abril': 'Abril',
        'maio': 'Maio', 'junho': 'Junho', 'julho': 'Julho', 'agosto': 'Agosto',
        'setembro': 'Setembro', 'outubro': 'Outubro', 'novembro': 'Novembro', 'dezembro': 'Dezembro'
      };

      backendDespesasMes.forEach(item => {
        const period = (item.período || item.periodo || '').toLowerCase();
        const mappedName = portugueseToLocalMap[period] || period;
        if (sums[mappedName] !== undefined) {
          sums[mappedName] = item.total;
        }
      });
      return sums;
    }
    return localMonthlyExpensesSums;
  }, [apiOnline, backendDespesasMes, localMonthlyExpensesSums]);

  // Fallback stacked bar chart
  const localMonthlyChartData = useMemo(() => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const grouped: { [month: string]: { [category: string]: number } } = {};
    const categoriesSet = new Set<string>();
    const defaultMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];
    
    defaultMonths.forEach(m => {
      grouped[m] = {};
    });

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const dateObj = new Date(t.date);
        const mIndex = isNaN(dateObj.getTime()) ? -1 : dateObj.getMonth();
        const monthName = mIndex === -1 ? 'Outros' : monthNames[mIndex];
        
        if (!grouped[monthName]) {
          grouped[monthName] = {};
        }
        
        const cat = t.category || 'Outros';
        categoriesSet.add(cat);
        grouped[monthName][cat] = (grouped[monthName][cat] || 0) + t.amount;
      }
    });

    const activeMonths = Object.keys(grouped).filter(m => {
      const catSums = Object.values(grouped[m]);
      if (catSums.length === 0) return defaultMonths.includes(m);
      return catSums.reduce((s, v) => s + v, 0) > 0 || defaultMonths.includes(m);
    });

    activeMonths.sort((a, b) => {
      const idxA = monthNames.indexOf(a);
      const idxB = monthNames.indexOf(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    let maxTotal = 1;
    activeMonths.forEach(m => {
      const total = Object.values(grouped[m]).reduce((s, v) => s + v, 0);
      if (total > maxTotal) {
        maxTotal = total;
      }
    });

    return {
      activeMonths,
      grouped,
      maxTotal,
      allCategories: Array.from(categoriesSet)
    };
  }, [transactions]);

  // Stacked chart with Category & Months from real API endpoint
  const monthlyChartData = useMemo(() => {
    if (apiOnline && backendDespesasCategoriaMes && backendDespesasCategoriaMes.length > 0) {
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const grouped: { [month: string]: { [category: string]: number } } = {};
      const categoriesSet = new Set<string>();
      const defaultMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];

      defaultMonths.forEach(m => {
        grouped[m] = {};
      });

      backendDespesasCategoriaMes.forEach((item: any) => {
        const mesAnoStr = item.MesAno || item.mesAno || '';
        const parts = mesAnoStr.split('/');
        if (parts.length >= 1) {
          const mesIndex = parseInt(parts[0], 10) - 1;
          const monthName = (mesIndex >= 0 && mesIndex < 12) ? monthNames[mesIndex] : 'Outros';
          
          if (!grouped[monthName]) {
            grouped[monthName] = {};
          }

          const cats = item.categoria || item.categorias || [];
          cats.forEach((catObj: any) => {
            const catName = catObj.categoria || 'Outros';
            const catTotal = Number(catObj.total) || 0;
            categoriesSet.add(catName);
            grouped[monthName][catName] = (grouped[monthName][catName] || 0) + catTotal;
          });
        }
      });

      const activeMonths = Object.keys(grouped).filter(m => {
        const catSums = Object.values(grouped[m]);
        if (catSums.length === 0) return defaultMonths.includes(m);
        return catSums.reduce((s, v) => s + v, 0) > 0 || defaultMonths.includes(m);
      });

      activeMonths.sort((a, b) => {
        const idxA = monthNames.indexOf(a);
        const idxB = monthNames.indexOf(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      let maxTotal = 1;
      activeMonths.forEach(m => {
        const total = Object.values(grouped[m]).reduce((s, v) => s + v, 0);
        if (total > maxTotal) {
          maxTotal = total;
        }
      });

      return {
        activeMonths,
        grouped,
        maxTotal,
        allCategories: Array.from(categoriesSet)
      };
    }
    return localMonthlyChartData;
  }, [apiOnline, backendDespesasCategoriaMes, localMonthlyChartData]);

  // Color mapping presets matching high-gloss tech aesthetics
  const categoryColors: { [key: string]: string } = {
    'Alimentação': 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    'Alimentacao': 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    'Transporte': 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
    'Lazer': 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.3)]',
    'Saúde': 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    'Saude': 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    'Educação': 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    'Educacao': 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    'Cuidado pessoal': 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
    'Aluguel': 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.3)]',
    'Despesas Fixas': 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]',
  };

  const colorPool = [
    'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.3)]',
    'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]',
    'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.3)]',
    'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]',
    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  ];

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount || !newCategory) return;

    onAddTransaction({
      description: newDesc.trim(),
      category: newCategory,
      date: newDate,
      amount: parseFloat(newAmount),
      type: 'expense'
    });

    // Reset fields
    setNewDesc('');
    setNewAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="flex-1 min-h-screen text-[#dfe2eb] font-sans pb-16">
      
      {/* Header Matches Screen 1 TopAppBar exactly with high-gloss terminal panel */}
      <header className="w-full top-0 py-4 flex flex-col md:flex-row justify-between items-center mb-10 border-b border-[#3e4852] bg-[#181c22]/90 shadow-[0px_0px_15px_rgba(0,168,255,0.25)] rounded-lg px-6 gap-4 z-10 relative">
        <div className="flex items-center gap-4 p-2 rounded-lg bg-[#0a0e14] border border-[#3e4852] hover:shadow-[0px_0px_12px_rgba(0,210,255,0.3)] transition-all">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#95ccff] bg-slate-800">
            <img 
              alt="User avatar" 
              className="w-full h-full object-cover" 
              src={userSession.avatar}
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="font-mono text-xs text-[#95ccff] tracking-widest font-semibold">DADOS DO USUÁRIO</h2>
            <p className="font-display text-sm font-bold text-slate-200">({userSession.name})</p>
          </div>
        </div>

        {/* Header Modals Triggers Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {apiOnline !== null && (
            <div 
              className={`px-3 py-2 text-[9px] font-mono font-bold tracking-wider rounded border uppercase flex items-center gap-1.5 ${
                apiOnline 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]'
              }`} 
              title={apiOnline ? 'Conectado com sucesso ao backend Java Spring Boot' : 'Servidor Java offline. Seus dados estão salvos e simulados localmente de forma segura (LocalStorage).'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400'}`} />
              <span>{apiOnline ? 'API Spring Boot: Online' : 'API Spring Boot: Offline (Modo Local)'}</span>
            </div>
          )}
          {onSelectedYearChange && (
            <div className="flex items-center gap-1.5 bg-[#0a0e14] border border-[#3e4852] rounded px-2.5 py-1.5 hover:border-[#00d2ff]/50 transition-all">
              <span className="font-mono text-[10px] text-slate-400 font-medium uppercase tracking-wider">Ano:</span>
              <select
                value={selectedYear}
                onChange={(e) => onSelectedYearChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-sky-400 font-mono outline-none cursor-pointer focus:text-sky-300"
              >
                <option value="2026" className="bg-[#10141a]">2026</option>
                <option value="2025" className="bg-[#10141a]">2025</option>
                <option value="2024" className="bg-[#10141a]">2024</option>
              </select>
            </div>
          )}
          {onSyncJavaApi && (
            <button 
              type="button"
              onClick={onSyncJavaApi}
              disabled={isSyncing}
              className="px-4 py-2 text-xs rounded border border-[#00d2ff] bg-[#00d2ff]/10 text-[#00d2ff] font-mono hover:bg-[#00d2ff]/20 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,210,255,0.15)] uppercase cursor-pointer flex items-center gap-1.5 font-bold disabled:opacity-50"
              title="Obter dados em tempo real da API Java Spring Boot"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar API'}</span>
            </button>
          )}
          <button 
            type="button"
            onClick={onTriggerExtrato}
            className="px-4 py-2 text-xs rounded border border-[#a5e7ff] text-[#a5e7ff] font-display hover:bg-[#a5e7ff]/10 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,210,255,0.15)] uppercase cursor-pointer"
          >
            Processar extrato
          </button>
          <button 
            type="button"
            onClick={onTriggerFatura}
            className="px-4 py-2 text-xs rounded border border-[#a5e7ff] text-[#a5e7ff] font-display hover:bg-[#a5e7ff]/10 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,210,255,0.15)] uppercase cursor-pointer"
          >
            Processar fatura
          </button>
          <button 
            type="button"
            onClick={onTriggerCategoria}
            className="px-4 py-2 text-xs rounded bg-[#00a8ff] hover:bg-[#00a8ff]/95 text-slate-900 font-display hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,168,255,0.35)] uppercase font-bold tracking-wide cursor-pointer"
          >
            Nova categoria
          </button>
        </div>
      </header>

      {/* RECEITAS Section */}
      <section className="mb-12">
        <div className="flex items-baseline gap-4 mb-6">
          <h3 className="font-display text-2xl text-[#a5e7ff] uppercase tracking-widest font-bold">RECEITAS</h3>
          <span className="font-sans text-xs text-slate-400 font-medium">(Proventos recebidos)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Proventos por mês table matches mockup Screen 1 */}
          <div className="lg:col-span-7 glass-card p-6 rounded-xl border border-[#3e4852] hover:border-[#00a8ff]/40 hover:shadow-[0_0_15px_rgba(0,168,255,0.1)] transition-all">
            <h4 className="font-display text-base text-center mb-6 text-slate-400 font-semibold uppercase tracking-wider">Proventos por mês</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* First Column of Month Income */}
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono text-[11px] text-slate-500 pb-2 border-b border-[#3e4852] uppercase tracking-widest font-bold">
                  <span>Mês</span>
                  <span>Salário</span>
                </div>
                {incomeList.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 hover:bg-slate-950/20 px-1 rounded transition-colors group">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#00d2ff] font-semibold">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      {/* Inline neon-glowing SVG mini Sparkline */}
                      <svg className="w-12 h-6" viewBox="0 0 50 20">
                        <polyline 
                          points={item.pattern.map((p, i) => `${i * 10},${p}`).join(' ')}
                          className="stroke-[#00d2ff] stroke-2 fill-none filter drop-shadow-[0_0_2px_rgba(0,210,255,0.6)]"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Second Column of Month Income */}
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono text-[11px] text-slate-500 pb-2 border-b border-[#3e4852] uppercase tracking-widest font-bold">
                  <span>Mês</span>
                  <span>Salário</span>
                </div>
                {incomeList.slice(3, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 hover:bg-slate-950/20 px-1 rounded transition-colors group">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#00d2ff] font-semibold">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <svg className="w-12 h-6" viewBox="0 0 50 20">
                        <polyline 
                          points={item.pattern.map((p, i) => `${i * 10},${p}`).join(' ')}
                          className="stroke-[#00d2ff] stroke-2 fill-none filter drop-shadow-[0_0_2px_rgba(0,210,255,0.6)]"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Receipts Summary tables */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            
            {/* Proventos por Trimestre */}
            <div className="glass-card p-5 rounded-xl border border-[#3e4852] hover:border-[#00a8ff]/40 transition-all">
              <h4 className="font-display text-sm text-center mb-4 text-slate-400 font-semibold uppercase tracking-wider">Proventos por trimestre</h4>
              <table className="w-full text-left font-sans text-xs">
                <thead className="border-b border-[#3e4852] font-mono text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-2 font-bold select-none">Trimestre</th>
                    <th className="py-2 text-right font-bold select-none">Total recebido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">1º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#00d2ff] font-semibold">R$ {quarterlyIncome.t1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">2º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#00d2ff] font-semibold">R$ {quarterlyIncome.t2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">3º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#00d2ff] font-semibold">R$ {quarterlyIncome.t3.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">4º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#00d2ff] font-semibold">R$ {quarterlyIncome.t4.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Proventos por Ano Card */}
            <div className="glass-card p-5 rounded-xl border border-[#3e4852] hover:border-[#00a8ff]/40 transition-all">
              <h4 className="font-display text-sm text-center mb-3 text-slate-400 font-semibold uppercase tracking-wider">Proventos por ano</h4>
              <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] pb-2 border-b border-[#3e4852] uppercase font-bold mb-3">
                <span>Ano</span>
                <span>Total recebido</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold">2026</span>
                <span className="font-display text-xl text-[#00d2ff] font-bold tracking-tight shadow-glow animate-pulse">
                  R$ {totalAnnualIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DESPESAS Section */}
      <section className="mb-12">
        <div className="flex justify-end gap-4 mb-6 border-b border-[#3e4852] pb-2">
          <h3 className="font-display text-2xl text-[#95ccff] uppercase tracking-widest font-bold">DESPESAS</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Centered Stacks Bar Graph matches screen 1 */}
          <div className="lg:col-span-8 glass-card p-6 rounded-xl border border-[#3e4852] hover:border-[#95ccff]/40 transition-all flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h4 className="font-display text-sm text-slate-400 font-semibold uppercase tracking-wider">Despesa por categoria por mês</h4>
              
              {/* Micro interactive filters dropdowns matching mock Screen 1 */}
              <div className="flex gap-2">
                <div className="relative">
                  <select 
                    className="bg-[#1c2026] border border-[#3e4852] text-slate-300 font-mono text-[11px] rounded px-3 py-1 outline-none focus:border-[#95ccff] cursor-pointer"
                    onChange={(e) => alert('Filtrado por: ' + e.target.value)}
                  >
                    <option value="mes">mês</option>
                    <option value="trimestre">trimestre</option>
                  </select>
                </div>
                <div>
                  <select 
                    className="bg-[#1c2026] border border-[#3e4852] text-slate-300 font-mono text-[11px] rounded px-3 py-1 outline-none focus:border-[#a5e7ff] cursor-pointer"
                    onChange={(e) => alert('Agrupado por: ' + e.target.value)}
                  >
                    <option value="soma">soma de valor</option>
                    <option value="media">média de valor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Layout representation of the stacked bar chart */}
            <div className="overflow-x-auto mt-2 pb-2">
              {(() => {
                const todosOsMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                
                return (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#3e4852] text-slate-500 font-mono text-[10px] uppercase">
                        <th className="py-3 font-semibold sticky left-0 bg-[#1c2026] z-10">Categoria</th>
                        {todosOsMeses.map(month => (
                          <th key={month} className="py-3 px-4 text-right">{month.substring(0, 3)}</th>
                        ))}
                        <th className="py-3 pl-4 text-right text-[#95ccff] font-bold sticky right-0 bg-[#1c2026] z-10">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyChartData.allCategories.map(category => {
                        const categoryTotal = todosOsMeses.reduce((sum, month) => {
                          const monthData = monthlyChartData.grouped[month] || {};
                          return sum + (monthData[category] || 0);
                        }, 0);

                        if (categoryTotal === 0) return null;

                        return (
                          <tr key={category} className="border-b border-[#3e4852]/40 hover:bg-slate-900/30 transition-colors">
                            <td className="py-3 font-semibold text-slate-300 uppercase text-[10px] whitespace-nowrap sticky left-0 bg-[#181c22] z-10 group-hover:bg-[#1c2026]">
                              {category}
                            </td>
                            {todosOsMeses.map(month => {
                              const val = (monthlyChartData.grouped[month] || {})[category] || 0;
                              return (
                                <td key={month} className="py-3 px-4 text-right font-mono text-slate-400">
                                  {val > 0 ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : <span className="text-slate-700">-</span>}
                                </td>
                              );
                            })}
                            <td className="py-3 pl-4 text-right font-mono text-[#95ccff] font-bold sticky right-0 bg-[#181c22] z-10 group-hover:bg-[#1c2026]">
                              R$ {categoryTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>

          {/* Despesas summaries tables on the right side matches Screen 1 */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-6">
            
            {/* Table Despesas Mês */}
            <div className="glass-card p-5 rounded-xl border border-[#3e4852] hover:border-[#95ccff]/40 transition-all">
  <h4 className="font-display text-sm text-center mb-4 text-slate-400 font-semibold uppercase tracking-wider">Despesas</h4>
  
  {/* Container de rolagem dinâmica */}
  <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
    {/* CORREÇÃO AQUI: Mudado de 'collapse' para 'border-collapse' */}
    <table className="w-full text-left font-sans text-xs border-collapse">
      {/* sticky top-0 mantém o cabeçalho visível durante o scroll */}
      <thead className="border-b border-[#3e4852] font-mono text-[10px] text-slate-500 uppercase sticky top-0 bg-[#181c22] z-10">
        <tr>
          <th className="py-2 font-bold select-none">Mês</th>
          <th className="py-2 text-right font-bold select-none">Despesas</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(monthlyExpensesSums).map(([month, sum]) => (
          <tr key={month} className="hover:bg-slate-900/15 transition-colors border-b border-[#3e4852]/10 last:border-none">
            <td className="py-2 font-medium capitalize">{month}</td>
            <td className="py-2 text-right font-mono text-[#95ccff] font-semibold">
              R$ {sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
            {/* Table Despesas Trimestre */}
            <div className="glass-card p-5 rounded-xl border border-[#3e4852] hover:border-[#95ccff]/40 transition-all">
              <h4 className="font-display text-sm text-center mb-4 text-slate-400 font-semibold uppercase tracking-wider">Despesas</h4>
              <table className="w-full text-left font-sans text-xs">
                <thead className="border-b border-[#3e4852] font-mono text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-2 font-bold select-none">Trimestre</th>
                    <th className="py-2 text-right font-bold select-none">Total recebido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">1º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#95ccff] font-semibold">R$ {quarterlyExpenses.t1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">2º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#95ccff] font-semibold">R$ {quarterlyExpenses.t2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">3º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#95ccff] font-semibold">R$ {quarterlyExpenses.t3.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/15 transition-colors">
                    <td className="py-2 font-medium">4º Trimestre</td>
                    <td className="py-2 text-right font-mono text-[#95ccff] font-semibold">R$ {quarterlyExpenses.t4.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </section>

      {/* Lista de Despesas matches Screen 1 bottom layout */}
      <section className="mb-6">
        <div className="glass-card rounded-xl border border-[#3e4852] overflow-hidden hover:shadow-[0_0_15px_rgba(0,168,255,0.08)] transition-all">
          <div className="p-4 border-b border-[#3e4852] bg-[#181c22]/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h4 className="font-display text-sm text-slate-400 font-semibold uppercase tracking-wider">Lista de despesas do mês</h4>
            
            {/* Search/Filter UI for pristine usability */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search size={15} />
                </span>
                <input 
                  type="text" 
                  placeholder="Buscar despesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-[#3e4852] rounded py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-[#0a0e14] border border-[#3e4852] text-xs text-slate-300 rounded px-3 py-1.5 outline-none focus:border-sky-500 w-full sm:w-auto cursor-pointer"
              >
                <option value="ALL">Todas as Categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 border border-sky-400/40 px-3 py-1.5 rounded text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer"
              >
                <Plus size={14} />
                <span>Registrar</span>
              </button>
            </div>
          </div>

          {/* New manual expense registration panel */}
          {showAddForm && (
            <form onSubmit={handleManualAddSubmit} className="p-5 bg-slate-950/40 border-b border-[#3e4852] grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Descrição</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Pizza do Fim de Semana"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-[#3e4852] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Categoria</label>
                <select
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-[#3e4852] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Selecione...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Valor (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-[#3e4852] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Data</label>
                  <input 
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-[#3e4852] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#00a8ff] hover:brightness-110 active:scale-95 text-slate-900 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider font-display max-h-[38px] cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* List of expenses custom scrollbar matches mockup Screen 1 */}
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
              <thead className="sticky top-0 bg-[#1c2026] text-sky-400 font-mono text-[10px] sm:text-xs uppercase z-10">
                <tr>
                  <th className="p-4 border-r border-[#3e4852]/30 select-none">ID</th>
                  <th className="p-4 border-r border-[#3e4852]/30 select-none">Descrição</th>
                  <th className="p-4 border-r border-[#3e4852]/30 select-none">Categoria</th>
                  <th className="p-4 border-r border-[#3e4852]/30 select-none">Data</th>
                  <th className="p-4 border-r border-[#3e4852]/30 select-none">Valor</th>
                  <th className="p-4 text-center select-none">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                      Nenhuma despesa registrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-[#3e4852]/20 hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 border-r border-[#3e4852]/30 font-mono text-slate-400 font-semibold">{t.id}</td>
                      <td className="p-4 border-r border-[#3e4852]/30 font-semibold text-slate-200">{t.description}</td>
                      <td className="p-4 border-r border-[#3e4852]/30 text-slate-400">
                        <select
                          value={t.category}
                          onChange={(e) => onUpdateCategory?.(t.id, t, e.target.value)}
                          className="bg-[#0a0e14] border border-[#3e4852]/40 text-slate-300 text-[11px] font-semibold rounded px-2 py-0.5 outline-none focus:border-sky-500 cursor-pointer hover:border-[#00d2ff]/40 transition-colors"
                          title="Clique para redefinir categoria"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name} className="bg-[#10141a]">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 border-r border-[#3e4852]/30 font-mono text-xs text-slate-400">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 border-r border-[#3e4852]/30 font-mono text-[#00d2ff] font-semibold">
                        R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 cursor-pointer transition-all active:scale-90"
                          title="Excluir Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
