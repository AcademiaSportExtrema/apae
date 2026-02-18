import React, { useState, useEffect } from 'react';
import { Download, CheckSquare, Square, Loader2, FileDown, Code, Copy, Check } from 'lucide-react';
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

        {/* SQL Migration Section */}
        <SqlMigrationSection />
      </div>
    </div>
  );
};

const MIGRATION_SQL = `-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE appointment_type AS ENUM ('demo', 'meeting', 'support', 'followup');
CREATE TYPE conversation_status AS ENUM ('nina', 'human', 'paused');
CREATE TYPE message_from AS ENUM ('user', 'nina', 'human');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed', 'processing');
CREATE TYPE message_type AS ENUM ('text', 'audio', 'image', 'document', 'video');
CREATE TYPE queue_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE member_role AS ENUM ('admin', 'manager', 'agent');
CREATE TYPE member_status AS ENUM ('active', 'invited', 'disabled');
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE team_assignment AS ENUM ('mateus', 'igor', 'fe', 'vendas', 'suporte');

-- =============================================
-- TABELAS
-- =============================================

-- Contatos
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone_number TEXT NOT NULL,
  name TEXT,
  call_name TEXT,
  email TEXT,
  whatsapp_id TEXT,
  is_business BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  profile_picture_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  client_memory JSONB DEFAULT '{"last_updated": null, "lead_profile": {"interests": [], "lead_stage": "new", "objections": [], "products_discussed": [], "communication_style": "unknown", "qualification_score": 0}, "sales_intelligence": {"pain_points": [], "next_best_action": "qualify", "budget_indication": "unknown", "decision_timeline": "unknown"}, "interaction_summary": {"response_pattern": "unknown", "last_contact_reason": "", "total_conversations": 0, "preferred_contact_time": "unknown"}, "conversation_history": []}',
  first_contact_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversas
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  user_id UUID,
  status conversation_status NOT NULL DEFAULT 'nina',
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_team team_assignment,
  assigned_user_id UUID,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  nina_context JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mensagens
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id),
  reply_to_id UUID REFERENCES public.messages(id),
  content TEXT,
  type message_type NOT NULL DEFAULT 'text',
  from_type message_from NOT NULL,
  status message_status NOT NULL DEFAULT 'sent',
  media_url TEXT,
  media_type TEXT,
  whatsapp_message_id TEXT,
  processed_by_nina BOOLEAN DEFAULT false,
  nina_response_time INTEGER,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deals / Negócios
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  stage_id UUID NOT NULL,
  stage TEXT DEFAULT 'new',
  value NUMERIC DEFAULT 0,
  company TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  owner_id UUID,
  user_id UUID,
  priority TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  due_date DATE,
  lost_reason TEXT,
  lost_at TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Atividades dos Deals
CREATE TABLE public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'note',
  is_completed BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agendamentos
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  type appointment_type NOT NULL DEFAULT 'meeting',
  status TEXT DEFAULT 'scheduled',
  description TEXT,
  meeting_url TEXT,
  attendees TEXT[] DEFAULT '{}',
  contact_id UUID REFERENCES public.contacts(id),
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estágios do Pipeline
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'border-slate-500',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  is_ai_managed BOOLEAN DEFAULT false,
  ai_trigger_criteria TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipes
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funções das Equipes
CREATE TABLE public.team_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Membros das Equipes
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'agent',
  status member_status NOT NULL DEFAULT 'invited',
  team_id UUID REFERENCES public.teams(id),
  function_id UUID REFERENCES public.team_functions(id),
  weight INTEGER DEFAULT 1,
  avatar TEXT,
  last_active TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Definições de Tags
CREATE TABLE public.tag_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações do Sistema (Nina)
CREATE TABLE public.nina_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT,
  sdr_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_response_enabled BOOLEAN NOT NULL DEFAULT true,
  adaptive_response_enabled BOOLEAN NOT NULL DEFAULT true,
  message_breaking_enabled BOOLEAN NOT NULL DEFAULT true,
  audio_response_enabled BOOLEAN DEFAULT false,
  route_all_to_receiver_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_scheduling_enabled BOOLEAN DEFAULT true,
  async_booking_enabled BOOLEAN DEFAULT false,
  ai_model_mode TEXT DEFAULT 'flash',
  system_prompt_override TEXT,
  test_system_prompt TEXT,
  test_phone_numbers JSONB,
  business_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  business_hours_start TIME NOT NULL DEFAULT '09:00',
  business_hours_end TIME NOT NULL DEFAULT '18:00',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  response_delay_min INTEGER NOT NULL DEFAULT 1000,
  response_delay_max INTEGER NOT NULL DEFAULT 3000,
  whatsapp_access_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  whatsapp_verify_token TEXT DEFAULT 'viver-de-ia-nina-webhook',
  elevenlabs_api_key TEXT,
  elevenlabs_voice_id TEXT NOT NULL DEFAULT '33B4UnXyTNbgLmdEDh5P',
  elevenlabs_model TEXT DEFAULT 'eleven_turbo_v2_5',
  elevenlabs_stability NUMERIC NOT NULL DEFAULT 0.75,
  elevenlabs_similarity_boost NUMERIC NOT NULL DEFAULT 0.80,
  elevenlabs_style NUMERIC NOT NULL DEFAULT 0.30,
  elevenlabs_speed NUMERIC DEFAULT 1.0,
  elevenlabs_speaker_boost BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perfis de Usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles de Usuário
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estados de Conversa
CREATE TABLE public.conversation_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.conversations(id),
  current_state TEXT NOT NULL DEFAULT 'idle',
  last_action TEXT,
  last_action_at TIMESTAMPTZ,
  scheduling_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filas de Processamento
CREATE TABLE public.message_processing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_message_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  status queue_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 1,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.nina_processing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  context_data JSONB,
  status queue_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 1,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.send_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  message_id UUID REFERENCES public.messages(id),
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  from_type TEXT NOT NULL DEFAULT 'nina',
  media_url TEXT,
  status queue_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 1,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.message_grouping_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_message_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  message_data JSONB NOT NULL,
  contacts_data JSONB,
  message_id UUID REFERENCES public.messages(id),
  processed BOOLEAN NOT NULL DEFAULT false,
  process_after TIMESTAMPTZ DEFAULT (now() + interval '20 seconds'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const SqlMigrationSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
      setCopied(true);
      toast.success('SQL copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar SQL');
    }
  };

  return (
    <div className="mt-10">
      {/* Divider */}
      <div className="border-t border-border mb-8" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Code className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Migração SQL</h2>
            <p className="text-sm text-muted-foreground">Copie o DDL completo para migrar as tabelas</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar SQL'}
        </button>
      </div>

      {/* SQL Code Block */}
      <pre className="max-h-[500px] overflow-auto rounded-xl border border-border bg-secondary/30 p-4 text-xs font-mono text-muted-foreground whitespace-pre select-all">
        {MIGRATION_SQL}
      </pre>
    </div>
  );
};

export default ExportData;
