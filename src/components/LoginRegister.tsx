/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, AtSign, Lock, HelpCircle, UserPlus, LogIn, Sparkles, RefreshCw } from 'lucide-react';
import { AVATAR_LOGIN, BG_IMAGE_CONTEXT_2 } from '../data';
import { registrarUsuario, loginUsuario } from '../services/api';

interface LoginRegisterProps {
  onLoginSuccess: (userData: { name: string; username: string; avatar: string; token?: string }) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  // Toggle between register mode and login mode (or show both side-by-side as in Screen 3)
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerUsername || !registerPassword) {
      setStatusMessage({ text: 'Por favor, preencha todos os campos de cadastro.', isError: true });
      return;
    }

    const cleanUsername = registerUsername.startsWith('@') ? registerUsername : `@${registerUsername}`;
    
    // Save locally first for robust fallback
    const users = JSON.parse(sessionStorage.getItem('fc_registered_users') || '[]');
    const userExists = users.some((u: any) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.username.toLowerCase() === registerUsername.toLowerCase());
    
    if (userExists) {
      setStatusMessage({ text: 'Este usuário já está cadastrado localmente!', isError: true });
      return;
    }

    setIsRegistering(true);
    setStatusMessage({ text: 'Cadastrando usuário no servidor Java Spring Boot...', isError: false });

    try {
      // Perform HTTP request with exact payload structured schema
      const response = await registrarUsuario({
        nome: registerName,
        usuario: registerUsername,
        senha: registerPassword
      });

      // Cache local APENAS de metadados não-sensíveis (sem senha) para casar
      // username -> display name após login. Senhas nunca são persistidas.
      const newUser = {
        name: registerName,
        username: registerUsername,
        avatar: AVATAR_LOGIN,
        backendId: response.id,
      };

      users.push(newUser);
      users.push({
        name: registerName,
        username: cleanUsername,
        avatar: AVATAR_LOGIN,
        backendId: response.id,
      });

      sessionStorage.setItem('fc_registered_users', JSON.stringify(users));


      setStatusMessage({ 
        text: `Cadastro concluído com sucesso na API Java! Usuário cadastrado: ${response.usuario} (ID: ${response.id}). Faça login abaixo.`, 
        isError: false 
      });

      // Reset fields
      setRegisterName('');
      setRegisterUsername('');
      setRegisterPassword('');
    } catch (err: any) {
      console.warn('Backend offline — cadastro não pôde ser concluído:', err);
      setStatusMessage({
        text: `Não foi possível cadastrar: servidor Java indisponível (${err.message || 'sem conexão'}). Tente novamente quando a API estiver online.`,
        isError: true,
      });


      // Reset fields
      setRegisterName('');
      setRegisterUsername('');
      setRegisterPassword('');
    } finally {
      setIsRegistering(false);
    }
  };


  const handleLoginSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setStatusMessage({ text: 'Por favor, preencha com o seu usuário e senha.', isError: true });
      return;
    }

    const cleanUsername = loginUsername.startsWith('@') ? loginUsername : `@${loginUsername}`;
    const apiUsername = loginUsername.replace(/^@/, ''); // exact string for backend input
    
    setIsLoggingIn(true);
    setStatusMessage({ text: 'Autenticando com o servidor Java Spring Boot...', isError: false });

    try {
      // 1. Attempt API authenticating
      const receivedToken = await loginUsuario({
        usuario: apiUsername,
        senha: loginPassword
      });

      if (!receivedToken) {
        throw new Error('Servidor não retornou um token de acesso válido.');
      }

      // Check if we have registered name locally
      const users = JSON.parse(sessionStorage.getItem('fc_registered_users') || '[]');
      const matchedUser = users.find(
        (u: any) => u.username.toLowerCase() === apiUsername.toLowerCase() || u.username.toLowerCase() === cleanUsername.toLowerCase()
      );

      const displayName = matchedUser ? matchedUser.name : (apiUsername === 'm.aurelio' ? 'Marcos Aurelio' : apiUsername);

      setStatusMessage({ text: 'Login bem-sucedido na API Java! Redirecionando...', isError: false });

      // Save token in the session object
      onLoginSuccess({
        name: displayName,
        username: cleanUsername,
        avatar: AVATAR_LOGIN,
        token: receivedToken
      });
    } catch (err: any) {
      console.warn('[Login] Falha na autenticação:', err.message || err);
      setStatusMessage({
        text: `Falha no login: ${err?.response?.data?.message || err.message || 'usuário inválido ou servidor offline.'}`,
        isError: true,
      });


    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginAsDemo = () => {
    onLoginSuccess({
      name: 'Nome / User',
      username: '@user_demo',
      avatar: AVATAR_LOGIN,
      token: `token-demo-mock-${Date.now()}`
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#0a0e14] overflow-x-hidden font-sans">
      {/* Background Graphic Grid/Radial */}
      <div 
        className="fixed inset-0 w-full h-full z-0 opacity-20 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE_CONTEXT_2})` }}
      />
      <div className="fixed inset-0 w-full h-full z-0 opacity-40 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0a0e14_100%)] pointer-events-none" />

      {/* Header Section */}
      <header className="z-10 w-full max-w-6xl mb-12 flex flex-col md:flex-row justify-between items-center gap-6" id="top-navigation-bar">
        {/* User Card Placeholder */}
        <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/80 border border-sky-500/20 flex items-center p-3 rounded-lg w-full md:w-auto" id="user-info-container">
          <div className="w-12 h-12 rounded bg-slate-700 overflow-hidden mr-4 border border-sky-500/30">
            <img 
              alt="Avatar do Usuário" 
              className="w-full h-full object-cover" 
              src={AVATAR_LOGIN}
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">Dados do usuário</h3>
            <p className="text-sm font-medium font-display">(Nome / User)</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-6" id="header-actions">
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={loginAsDemo}
              className="border-2 border-sky-500/60 bg-sky-500/10 hover:bg-sky-500/20 hover:border-sky-500 shadow-[0_0_20px_rgba(0,168,255,0.4)] text-sky-400 px-6 py-2 rounded text-sm font-semibold tracking-wider font-display uppercase transition-all duration-300 transform active:scale-95"
              id="dashboard-link"
            >
              Acessar Dashboard (DEV)
            </button>
          )}
          <a
            className="text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1"
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              setStatusMessage({
                text: 'Cadastre-se no formulário ao lado e em seguida faça login com a mesma credencial.',
                isError: false,
              });
            }}
          >
            <HelpCircle size={16} />
            <span>Precisa de ajuda?</span>

          </a>
        </div>
      </header>

      {/* Status Messages */}
      {statusMessage && (
        <div className={`z-10 w-full max-w-6xl mb-6 p-4 rounded border text-center font-display text-sm transition-all animate-bounce ${
          statusMessage.isError 
            ? 'bg-red-950/80 border-red-500/30 text-red-200' 
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Main Content: Authentication Panels Side by Side as per mock Screen 3 */}
      <main className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12" id="auth-panels-container">
        
        {/* Registration Panel */}
        <section className="bg-[#10141a]/70 backdrop-blur-md border border-sky-500/30 rounded-lg p-6 md:p-10 flex flex-col justify-between" id="registration-card">
          <div>
            <h2 className="text-xl md:text-2xl text-center mb-10 tracking-widest font-light text-slate-200 font-display flex items-center justify-center gap-2">
              <UserPlus className="text-sky-400" size={24} />
              CADASTRO DE NOVO USUÁRIO
            </h2>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-6" id="registration-form">
              {/* Name Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </span>
                <input 
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-[#0a0e14]/80 border border-sky-500/40 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_15px_rgba(0,168,255,0.3)] transition-all font-sans text-sm"
                  placeholder="Nome"
                />
              </div>

              {/* User Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <AtSign size={20} />
                </span>
                <input 
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  autoComplete="none"
                  className="w-full bg-[#0a0e14]/80 border border-sky-500/40 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_15px_rgba(0,168,255,0.3)] transition-all font-sans text-sm"
                  placeholder="Usuário"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </span>
                <input 
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-[#0a0e14]/80 border border-sky-500/40 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_15px_rgba(0,168,255,0.3)] transition-all font-sans text-sm"
                  placeholder="Senha"
                />
              </div>

              <button 
                type="submit"
                disabled={isRegistering}
                className="w-full py-4 mt-4 bg-gradient-to-r from-sky-500/10 to-sky-500/5 hover:from-sky-500/20 hover:to-sky-500/10 border-2 border-sky-500/60 hover:border-sky-500 rounded-lg font-bold text-lg text-slate-200 tracking-wider font-display shadow-[0_0_15px_rgba(0,168,255,0.3)] hover:shadow-[0_0_25px_rgba(0,168,255,0.5)] transform active:scale-[0.98] transition-all uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                id="submit-register"
              >
                {isRegistering ? (
                  <RefreshCw size={20} className="animate-spin text-sky-400" />
                ) : (
                  <Sparkles size={20} className="text-sky-400" />
                )}
                <span>{isRegistering ? 'Cadastrando...' : 'CADASTRAR'}</span>
              </button>
            </form>
          </div>
          
          <p className="text-center text-xs text-slate-400 mt-8">
            Já possui conta? <span className="text-sky-400 font-semibold cursor-help" onClick={() => setStatusMessage({ text: 'Use o painel ao lado de login com o usuário criado!', isError: false })}>Faça Login</span>
          </p>
        </section>

        {/* Login Panel */}
        <section className="bg-[#10141a]/70 backdrop-blur-md border border-sky-500/30 rounded-lg p-6 md:p-10 flex flex-col justify-between" id="login-card">
          <div className="h-full flex flex-col justify-between">
            <div>
              <h2 className="text-xl md:text-2xl text-center mb-10 tracking-widest font-light text-slate-200 font-display uppercase flex items-center justify-center gap-2">
                <LogIn className="text-sky-400" size={24} />
                ACESSO AO SISTEMA (LOGIN)
              </h2>
              
              <form onSubmit={handleLoginSubmit} className="space-y-6 flex flex-col h-full" id="login-form">
                {/* User Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <AtSign size={20} />
                  </span>
                  <input 
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-[#0a0e14]/80 border border-sky-500/40 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_15px_rgba(0,168,255,0.3)] transition-all font-sans text-sm"
                    placeholder="Usuário"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={20} />
                  </span>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="one-time-code"
                    className="w-full bg-[#0a0e14]/80 border border-sky-500/40 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:shadow-[0_0_15px_rgba(0,168,255,0.3)] transition-all font-sans text-sm"
                    placeholder="Senha"
                  />
                </div>

                <div className="text-right">
                  <span 
                    onClick={() => setStatusMessage({ text: 'Recuperação de senha indisponível. Cadastre um novo usuário ou contate o administrador.', isError: false })}
                    className="text-xs text-slate-400 hover:text-sky-400 transition-colors underline decoration-dotted underline-offset-4 cursor-pointer"
                  >
                    Esqueceu a senha?
                  </span>
                </div>
              </form>
            </div>

            {/* Spacer for symmetry & Action Button */}
            <div className="mt-8">
              <button 
                type="button"
                onClick={handleLoginSubmit}
                className="w-full py-4 bg-gradient-to-r from-sky-500/10 to-sky-500/5 hover:from-sky-500/20 hover:to-sky-500/10 border-2 border-sky-500/60 hover:border-sky-500 rounded-lg font-bold text-lg text-slate-200 tracking-wider font-display shadow-[0_0_15px_rgba(0,168,255,0.3)] hover:shadow-[0_0_25px_rgba(0,168,255,0.5)] transform active:scale-[0.98] transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
                id="submit-login"
              >
                ENTRAR
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Decor Corner */}
      <footer className="mt-16 opacity-30 animate-pulse" id="footer-decor">
        <div className="w-12 h-12 border-t-2 border-l-2 border-sky-500 rotate-45"></div>
      </footer>
    </div>
  );
}
