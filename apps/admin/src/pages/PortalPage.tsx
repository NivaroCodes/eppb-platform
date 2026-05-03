import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonoText } from '@/components/ui/MonoText';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useFormsStore } from '@/store/services';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PortalPage() {
  const navigate = useNavigate();
  const { forms, loadForms, apiAvailable, error } = useFormsStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Все');

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const filters = ['Все', 'Лизинг', 'Субсидии', 'Гранты', 'Кредиты'];
  
  const publishedForms = forms.filter(f => f.is_published);
  
  const filteredForms = publishedForms.filter(f => {
    const matchesSearch = (f.name?.toLowerCase() ?? '').includes(search.toLowerCase()) || 
                          (f.schema?.serviceCode?.toLowerCase() ?? '').includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'Все' || (f.name || '').includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      {/* Mock data banner */}
      {!apiAvailable && error && (
        <div className="bg-warning/10 border-b border-warning/20 px-8 py-2 flex items-center gap-2">
          <MonoText className="text-[11px] text-warning font-bold uppercase tracking-widest">
            ⚠ Локальные данные — бэкенд недоступен
          </MonoText>
        </div>
      )}

      {/* Hero Band */}
      <section className="bg-bg-1 border-b border-line-2 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8 py-20 relative z-10">
          <div className="max-w-4xl">
            <MonoText className="text-[11px] text-fg-3 uppercase tracking-[0.2em] mb-4">
              CATALOG · {publishedForms.length} АКТИВНЫХ УСЛУГ · v2.0
            </MonoText>
            
            <h1 className="font-display font-bold text-[56px] leading-[1.05] text-white tracking-tight mb-12">
              Поддержка бизнеса от институтов развития Казахстана.
            </h1>

            {/* Search and Filters */}
            <div className="flex flex-col gap-6">
              <div className="relative max-w-2xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-4 group-focus-within:text-accent transition-colors" size={20} />
                <Input 
                  placeholder="Поиск по названию или коду услуги..." 
                  className="h-14 pl-12 pr-4 bg-bg-2/50 border-line-3 text-lg rounded-r3 focus-visible:ring-accent-line"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                      activeFilter === filter 
                        ? "bg-accent-soft border-accent-line text-accent" 
                        : "bg-bg-2 border-line-2 text-fg-2 hover:border-line-3 hover:text-fg-1"
                    )}
                  >
                    {filter}
                    <span className="ml-2 opacity-40">·</span>
                    <span className="ml-2 tabular-nums">
                      {filter === 'Все' ? publishedForms.length : publishedForms.filter(f => f.name.includes(filter)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Grid */}
      <section className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form, index) => (
            <ServiceCard 
              key={form.id} 
              form={form} 
              featured={index === 0 && search === '' && activeFilter === 'Все'} 
              onClick={() => navigate(`/portal/${form.schema?.serviceCode ?? ''}`)}
            />
          ))}
          
          {filteredForms.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-line-3 rounded-r4">
              <MonoText className="text-fg-4 uppercase tracking-widest">Услуг не найдено</MonoText>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ServiceCard({ form, featured, onClick }: { form: any; featured?: boolean; onClick: () => void }) {
  return (
    <Panel 
      className={cn(
        "group cursor-pointer flex flex-col h-full hover:bg-bg-3 border-line-2 transition-all duration-320",
        featured && "border-accent-line ring-1 ring-accent-line/20 bg-accent-soft/5"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <MonoText className="text-[10px] text-fg-3 uppercase tracking-[0.15em]">
          SERVICE · # {form.schema?.serviceCode ?? '---'}
        </MonoText>
        <ArrowRight className="text-fg-4 group-hover:text-accent group-hover:translate-x-1 transition-all" size={18} />
      </div>

      <h3 className="font-display font-bold text-xl text-white tracking-tight mb-2 group-hover:text-accent transition-colors leading-snug">
        {form.name}
      </h3>
      
      <p className="text-[13px] text-fg-3 font-body leading-relaxed mb-6 line-clamp-3">
        {form.schema?.description || 'Описание услуги временно отсутствует.'}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {form.schema?.config?.integration_required?.map((integration: string) => (
          <Badge key={integration} variant="accent" className="text-[9px] uppercase tracking-wider py-0 px-2 rounded-r1 border-accent-line/30">
            {integration}
          </Badge>
        ))}
        {(form.schema?.config?.integration_required?.length === 0 || !form.schema?.config?.integration_required) && (
          <Badge variant="draft" className="text-[9px] uppercase tracking-wider py-0 px-2 rounded-r1">
            Без интеграций
          </Badge>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-line-1 flex items-center justify-between">
        <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">
          {form.schema?.steps?.length ?? 0} шагов · v{form.schema_version || '1.0.0'}
        </MonoText>
        <span className="text-[11px] font-bold text-accent uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          Подробнее →
        </span>
      </div>
    </Panel>
  );
}
