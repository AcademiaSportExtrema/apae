

# Adicionar Seção de Migração SQL na Tela de Exportar Dados

## Objetivo
Adicionar uma seção abaixo da exportação CSV com os scripts SQL de criação (CREATE TABLE) de todas as tabelas do sistema, permitindo copiar o SQL para migrar a estrutura em outro banco.

## Mudanças

### 1. Atualizar `src/components/ExportData.tsx`

Adicionar uma nova seção "Migração SQL" abaixo do grid de tabelas CSV, contendo:

- Um bloco de código com os DDL (CREATE TABLE) de todas as 13 tabelas do sistema, incluindo tipos de colunas, defaults, constraints e tipos customizados (enums)
- Botão "Copiar SQL" que copia todo o conteúdo para a área de transferência usando `navigator.clipboard.writeText()`
- Toast de confirmação ao copiar
- O SQL será hardcoded como constante no componente, baseado no schema atual do banco

### Conteúdo do SQL

O script incluirá:
- Criação dos tipos ENUM (`appointment_type`, `conversation_status`, `message_type`, `message_status`, `queue_status`, `member_role`, `member_status`, `app_role`)
- CREATE TABLE para todas as 13 tabelas com colunas, tipos, defaults e constraints
- Comentários organizacionais separando cada tabela

### Interface

- Separador visual entre a seção CSV e a seção SQL
- Título "Migração SQL" com ícone de código
- Área de texto com scroll mostrando o SQL completo
- Botão "Copiar SQL" com feedback visual
- Design consistente com o tema escuro existente

