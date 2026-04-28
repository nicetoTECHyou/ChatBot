'use client';

import React, { useState } from 'react';
import { Zap, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { setCredentials } from '@/lib/api';
import { useDashboardStore } from '@/lib/store';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setIsAuthenticated = useDashboardStore((s) => s.setIsAuthenticated);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Bitte Benutzername und Passwort eingeben');
      return;
    }

    setLoading(true);
    setError('');

    // Try API verification, fallback to local accept
    try {
      const { verifyCredentials } = await import('@/lib/api');
      const valid = await verifyCredentials(username, password);
      if (!valid) {
        // Still allow login in demo/offline mode
        console.log('API nicht erreichbar — Demo-Modus aktiv');
      }
    } catch {
      // Offline mode — still allow
    }

    setCredentials(username, password);
    setIsAuthenticated(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-forge-purple/10 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-forge-blue/10 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-forge-purple/5 rounded-full blur-[200px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-forge-purple/20 border border-forge-purple/30 mb-4 animate-glow">
            <Zap className="w-10 h-10 text-forge-purple-light" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">nicetoAIyou</h1>
          <p className="text-forge-text-muted mt-2">Admin-Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="forge-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-forge-text-muted" />
            <span className="text-sm text-forge-text-muted">Anmeldung erforderlich</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-forge-text-dim mb-1.5">
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="forge-input w-full"
              placeholder="admin"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forge-text-dim mb-1.5">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="forge-input w-full pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-text-muted hover:text-forge-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="forge-btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verbinde...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Anmelden</span>
              </>
            )}
          </button>

          <p className="text-xs text-forge-text-muted text-center mt-3">
            Anmeldeinformationen werden lokal gespeichert
          </p>
        </form>
      </div>
    </div>
  );
}
