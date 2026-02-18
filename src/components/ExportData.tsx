import React, { useState, useEffect } from 'react';
import { Download, CheckSquare, Square, Loader2, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TABLES = [
  { key: 'contacts', label: 'Contatos' },
  { key: 'conversations', label: 'Conversas' },
  { key: 'messages', label: 'Mensagens' },
  { key: 'deals', label: 'Deals / Negócios' },
  { key: 'deal_activities', label: 'Atividades dos Deals' },
  { key: 'appointments', label: 'Agendamentos' },
  { key: 'pipeline_stages', label: 'Estágios do Pipeline' },
  { key: 'teams', label: 'Equipes' },
  { key: 'team_members', label: 'Membros das Equipes' },
  { key: 'team_functions', label: 'Funções das Equipes' },
  { key: 'tag_definitions', label: 'Definições de Tags' },
  { key: 'nina_settings', label: 'Configurações do Sistema' },
  { key: 'profiles', label: 'Perfis de Usuário' },
] as const;

type TableKey = typeof TABLES[number]['key'];

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ExportData: React.FC = () => {
  const [selected, setSelected] = useState<Set<TableKey>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingCounts(true);
      const results: Record<string, number> = {};
      await Promise.all(
        TABLES.map(async (t) => {
          const { count } = await supabase
            .from(t.key)
            .select('*', { count: 'exact', head: true });
          results[t.key] = count ?? 0;
        })
      );
      setCounts(results);
      setLoadingCounts(false);
    };
    fetchCounts();
  }, []);

  const toggleSelect = (key: TableKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === TABLES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(TABLES.map(t => t.key)));
    }
  };

  const exportSelected = async (keys: TableKey[]) => {
    if (!keys.length) {
      toast.error('Selecione pelo menos uma tabela');
      return;
    }
    setLoading(true);
    let exported = 0;
    for (const key of keys) {
      const { data, error } = await supabase.from(key).select('*');
      if (error) {
        toast.error(`Erro ao exportar ${key}: ${error.message}`);
        continue;
      }
      if (!data?.length) {
        toast.info(`${key}: nenhum registro encontrado`);
        continue;
      }
      const csv = toCsv(data as Record<string, unknown>[]);
      downloadCsv(`${key}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
      exported++;
    }
    if (exported > 0) toast.success(`${exported} tabela(s) exportada(s) com sucesso!`);
    setLoading(false);
  };

  const allSelected = selected.size === TABLES.length;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
            <p className="text-sm text-muted-foreground">Selecione as tabelas e exporte em CSV</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary/50 text-sm font-medium text-foreground transition-colors"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
            {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          <button
            onClick={() => exportSelected(Array.from(selected))}
            disabled={loading || selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Exportar Selecionados ({selected.size})
          </button>
          <button
            onClick={() => exportSelected(TABLES.map(t => t.key))}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar Todos
          </button>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TABLES.map((table) => {
            const isSelected = selected.has(table.key);
            return (
              <button
                key={table.key}
                onClick={() => toggleSelect(table.key)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-secondary/30'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{table.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{table.key}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  {loadingCounts ? '...' : counts[table.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExportData;
