/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, X, CheckSquare, Layers, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Category } from '../types';
import { lancarCategoria } from '../services/api';

interface NovaCategoriaModalProps {
  onClose: () => void;
  onAddCategory: (categoryName: string) => void;
  categories: Category[];
  userToken?: string;
}

export default function NovaCategoriaModal({ onClose, onAddCategory, categories, userToken }: NovaCategoriaModalProps) {
  const [description, setDescription] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [customClassification, setCustomClassification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const finalClassification = selectedParent === '__custom__' ? customClassification : selectedParent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMessage({ text: 'Por favor, preencha a descrição.', isError: true });
      return;
    }
    
    const classificationValue = finalClassification.trim();
    if (!classificationValue) {
      setStatusMessage({ text: 'Por favor, selecione ou digite a classificação da categoria.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ text: 'Enviando categoria para o servidor Java Spring Boot...', isError: false });

    try {
      // POST on route /programa/categoria/lancarCategoria
      // Request structure: {"descricao": string, "categoria": string}
      const response = await lancarCategoria({
        descricao: description.trim(),
        categoria: classificationValue
      }, userToken);

      setStatusMessage({ 
        text: `Categoria criada com sucesso no servidor Java! ID: ${response.id || 'N/A'}.`, 
        isError: false 
      });

      // Keep user updated and append locally on parent list
      setTimeout(() => {
        onAddCategory(description.trim());
        onClose();
      }, 1200);

    } catch (err: any) {
      console.warn('[Java Backend lance Categoria Offline Fallback]', err.message || err);
      
      // Fallback fallback creation
      setStatusMessage({ 
        text: `Modo local: Categoria "${description}" adicionada offline. (Erro de conexão com o servidor Java)`, 
        isError: false 
      });

      setTimeout(() => {
        onAddCategory(description.trim());
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique category names for the helper list
  const existingCategoryNames = Array.from(new Set(categories.map(c => c.name))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e14]/85 backdrop-blur-md px-4">
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-sky-500/30 to-transparent rounded-lg blur-sm opacity-50"></div>
        
        <div className="relative bg-[#10141a] rounded-lg border border-sky-500/30 shadow-[0px_0px_25px_rgba(0,168,255,0.25)] flex flex-col overflow-hidden">
          
          {/* Subtle neon top indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-70"></div>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-sky-500/10 flex justify-between items-center bg-slate-900/30">
            <div className="flex items-center gap-2">
              <PlusCircle className="text-sky-400" size={20} />
              <h2 className="font-display text-lg text-sky-400 tracking-wide font-semibold">Nova Categoria</h2>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-red-400 transition-colors rounded-full p-1 hover:bg-slate-800/50 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            
            {statusMessage && (
              <div className={`p-3 rounded text-xs flex gap-2 items-start ${
                statusMessage.isError 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                  : 'bg-sky-500/10 border border-sky-500/20 text-sky-400 animate-pulse'
              }`}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Description Input */}
            <div className="relative group">
              <label htmlFor="description" className="block font-mono text-xs text-slate-400 mb-2 uppercase tracking-widest">
                Descrição
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  <Layers size={18} />
                </span>
                <input 
                  id="description"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-sky-500/20 rounded py-2.5 pl-10 pr-4 text-slate-200 font-sans focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_12px_rgba(0,168,255,0.3)] transition-all placeholder:text-slate-600 sm:text-sm disabled:opacity-55"
                  placeholder="Ex: Comida, Combustível, Livros"
                />
              </div>
            </div>

            {/* Parent Category / Classification Selection */}
            <div className="relative group">
              <label htmlFor="parentCat" className="block font-mono text-xs text-slate-400 mb-2 uppercase tracking-widest">
                Classificação da Categoria
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 group-focus-within:text-sky-400 transition-colors">
                  <CheckSquare size={18} />
                </span>
                <select 
                  id="parentCat"
                  required
                  disabled={isSubmitting}
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-sky-500/20 rounded py-2.5 pl-10 pr-4 text-slate-200 font-sans focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_12px_rgba(0,168,255,0.3)] transition-all cursor-pointer sm:text-sm disabled:opacity-55"
                >
                  <option value="" className="text-slate-600">Selecione uma categoria principal...</option>
                  {existingCategoryNames.map((catName) => (
                    <option key={catName} value={catName} className="bg-[#10141a]">
                      {catName}
                    </option>
                  ))}
                  <option value="__custom__" className="bg-[#10141a] text-sky-400 font-semibold">
                    + Digitar outra categoria...
                  </option>
                </select>
              </div>
            </div>

            {/* Custom Input when "__custom__" is selected */}
            {selectedParent === '__custom__' && (
              <div className="relative group animate-in slide-in-from-top-2 duration-150">
                <label htmlFor="customCat" className="block font-mono text-xs text-sky-400 mb-2 uppercase tracking-widest">
                  Digite a Categoria Principal (Ex: Alimentação)
                </label>
                <input 
                  id="customCat"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={customClassification}
                  onChange={(e) => setCustomClassification(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-sky-500/30 rounded py-2.5 px-4 text-slate-200 font-sans focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_12px_rgba(0,168,255,0.3)] transition-all placeholder:text-slate-600 sm:text-sm"
                  placeholder="Ex: Alimentação, Lazer, Transporte..."
                />
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-4 flex justify-end gap-3 border-t border-sky-500/10 pt-4">
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded border border-sky-500/20 text-slate-400 font-mono text-xs uppercase tracking-widest hover:bg-slate-800/40 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded bg-gradient-to-r from-sky-600 to-sky-400 hover:brightness-115 text-slate-900 font-mono text-xs uppercase font-bold tracking-widest shadow-[0_0_15px_rgba(0,168,255,0.3)] hover:shadow-[0_0_20px_rgba(0,168,255,0.5)] transition-all border border-sky-300/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw size={14} className="animate-spin text-slate-900" />
                ) : (
                  <Sparkles size={14} className="text-slate-900" />
                )}
                <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
