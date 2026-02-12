

# Inserir Dados de Teste no Banco de Dados

O banco de dados esta funcionando e ja tem configuracoes basicas (pipeline, equipes, tags, perfil). Porem as tabelas operacionais estao vazias. Vou popular com dados realistas para voce testar o sistema.

## O que sera inserido

### 1. Contatos (5 registros)
- Joao Silva, Maria Santos, Carlos Oliveira, Ana Costa, Pedro Mendes
- Com telefones, emails, tags e datas variadas

### 2. Conversas (5 registros)
- Uma conversa para cada contato
- Status variados: nina, human, waiting

### 3. Mensagens (10-15 registros)
- Mensagens de exemplo em cada conversa
- Tipos: human (cliente) e nina (IA)

### 4. Deals (5 registros)
- Um deal por contato, distribuidos nos estagios do pipeline
- Valores e prioridades variados

### 5. Agendamentos (3 registros)
- Demos, reunioes e follow-ups para os proximos dias

## Como verificar

Depois de inserir, voce podera:
- Fazer login no app e ver os contatos na tela de Contatos
- Ver os deals no Kanban
- Ver as conversas no Chat
- Ver os agendamentos na Agenda

## Detalhe tecnico

Todos os registros serao vinculados ao `user_id` existente (`19e2d7f6-9b87-49d4-883f-dac4c1f7eae9`) para garantir que as politicas de seguranca (RLS) permitam a visualizacao.

