

# Exportar Dados em CSV - Menu no Sidebar

## Objetivo
Adicionar um item "Exportar Dados" no sidebar que abre uma tela/modal onde o usuario pode selecionar e exportar em CSV os dados de todas as tabelas do banco de dados.

## Tabelas disponiveis para exportacao

| Tabela | Descricao |
|--------|-----------|
| `contacts` | Contatos |
| `conversations` | Conversas |
| `messages` | Mensagens |
| `deals` | Deals/Negocios |
| `deal_activities` | Atividades dos deals |
| `appointments` | Agendamentos |
| `pipeline_stages` | Estagios do pipeline |
| `teams` | Equipes |
| `team_members` | Membros das equipes |
| `team_functions` | Funcoes das equipes |
| `tag_definitions` | Definicoes de tags |
| `nina_settings` | Configuracoes do sistema |
| `profiles` | Perfis de usuario |

## Mudancas

### 1. Nova pagina `src/components/ExportData.tsx`
- Tela com lista de todas as tabelas disponiveis
- Checkbox para selecionar quais tabelas exportar
- Botao "Exportar Selecionados" e "Exportar Todos"
- Ao clicar, busca os dados via Supabase client e converte para CSV
- Faz download automatico do arquivo `.csv` para cada tabela selecionada
- Indicador de loading durante a exportacao

### 2. Atualizar `src/components/Sidebar.tsx`
- Adicionar item "Exportar Dados" com icone `Download` do lucide-react no array `menuItems`

### 3. Atualizar `src/App.tsx`
- Adicionar rota `/export` apontando para o componente `ExportData`

## Detalhes Tecnicos

### Logica de exportacao CSV (client-side)
- Funcao utilitaria que recebe um array de objetos e converte para string CSV
- Tratamento de campos com virgulas, aspas e quebras de linha
- Campos JSON (como `client_memory`, `metadata`) serao serializados como string JSON na celula
- Download via `Blob` + `URL.createObjectURL` + click em link temporario
- Consultas usam `supabase.from('tabela').select('*')` respeitando RLS

### Interface
- Design consistente com o restante do app (dark theme, slate/cyan)
- Cards por tabela mostrando nome e quantidade de registros
- Selecao individual ou em massa
- Toast de sucesso/erro apos exportacao

