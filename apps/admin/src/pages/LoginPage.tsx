import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { MonoText } from '@/components/ui/MonoText';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'admin' | 'user'>('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      setLoading(false);
      navigate(tab === 'admin' ? '/services' : '/portal');
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-bg-1 overflow-hidden">
      {/* LEFT: Identity Wall */}
      <div className="hidden lg:flex flex-col flex-1 relative p-16 justify-between overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 z-0" 
          style={{ 
            background: 'linear-gradient(160deg, var(--bg-1) 0%, var(--bg-2) 50%, #1A0A05 100%)' 
          }} 
        />
        
        {/* Brand Block */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-4 h-4 bg-accent" />
          <span className="font-display font-bold text-2xl tracking-tight text-white uppercase">ЕППБ</span>
          <MonoText className="text-sm text-fg-3 uppercase tracking-[0.15em]">/ БАЙТЕРЕК</MonoText>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display font-bold text-[56px] leading-[1.05] text-white tracking-tight mb-6">
            Единый портал поддержки бизнеса.
          </h1>
          <p className="text-xl text-fg-2 font-body leading-relaxed max-w-xl">
            Цифровая экосистема для предпринимателей Казахстана: от идеи до масштабирования через государственные инструменты поддержки.
          </p>
        </div>

        {/* Metrics */}
        <div className="relative z-10 flex gap-12">
          <Metric label="АКТИВНЫХ УСЛУГ" value="70+" />
          <Metric label="ВЕРСИЯ ПЛАТФОРМЫ" value="v2.0" />
          <Metric label="СРЕДНЕЕ ВРЕМЯ" value="60s" />
        </div>
      </div>

      {/* RIGHT: Form Pane */}
      <div className="w-full lg:w-[460px] bg-bg-1 flex flex-col p-8 lg:p-16 border-l border-line-2 relative z-10 shadow-2xl">
        <div className="flex flex-col h-full justify-center max-w-sm mx-auto w-full">
          <MonoText className="text-[11px] text-fg-4 uppercase tracking-[0.2em] mb-4">
            SIGN IN · v2.0.0
          </MonoText>
          
          <h2 className="font-display font-bold text-3xl text-white tracking-tight mb-8">
            Войти в платформу
          </h2>

          {/* Tabs */}
          <div className="flex border-b border-line-2 mb-8">
            <TabButton 
              active={tab === 'admin'} 
              onClick={() => setTab('admin')} 
              label="Администратор" 
            />
            <TabButton 
              active={tab === 'user'} 
              onClick={() => setTab('user')} 
              label="Предприниматель" 
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input 
                id="login" 
                placeholder="admin@eppb.kz" 
                autoComplete="username" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Пароль</Label>
                <button type="button" className="text-[10px] font-mono text-accent hover:underline uppercase tracking-wider">
                  Забыли?
                </button>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                autoComplete="current-password" 
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4 h-11" 
              loading={loading}
            >
              Войти в систему →
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-auto pt-12 flex flex-col gap-4">
            <div className="flex items-center gap-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
              <MonoText className="text-[10px] text-fg-3">SSO · EGOV</MonoText>
              <div className="h-3 w-[1px] bg-line-3" />
              <button className="flex items-center gap-1 font-mono text-[10px] text-fg-3 uppercase tracking-wider hover:text-accent">
                ↗️ ПОМОЩЬ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <MonoText className="text-[10px] text-fg-4 uppercase tracking-[0.15em]">{label}</MonoText>
      <span className="font-display font-bold text-2xl text-white tracking-tight">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative',
        active ? 'text-accent' : 'text-fg-4 hover:text-fg-2'
      )}
    >
      {label}
      {active && (
        <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent" />
      )}
    </button>
  );
}
