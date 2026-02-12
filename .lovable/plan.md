

# Corrigir Erros de Build do TypeScript

O banco de dados esta funcionando perfeitamente -- todas as 20 tabelas estao presentes e as configuracoes da BIA/APAE estao salvas. Porem, o projeto tem varios erros de TypeScript que impedem a compilacao. Vou corrigir todos eles.

## Resumo dos Erros

Os erros sao todos do mesmo tipo: incompatibilidades entre valores `null` do banco de dados e tipos que esperam `undefined` ou valores nao-nulos no codigo.

## Correcoes Planejadas

### 1. Declaracao de tipo para canvas-confetti
- Criar arquivo `src/canvas-confetti.d.ts` com `declare module 'canvas-confetti'`

### 2. ChatInterface.tsx (linha 73)
- Corrigir `activeChat?.unreadCount > 0` para `(activeChat?.unreadCount ?? 0) > 0`

### 3. types.ts - Ajustar tipos para aceitar `null`
- `Team.color`: mudar para `string | null` com fallback no uso
- `TeamFunction.is_active`: mudar para `boolean | null`  
- `TeamMember.weight`: mudar para `number | null`
- `Appointment.description`: mudar para `string | null`
- `Deal.conversationId`: mudar para `string | null`

### 4. services/api.ts - Correcoes pontuais
- Linha 193: adicionar cast/filtro para `responseTimes` (`.filter((x): x is number => x !== null)`)
- Linha 777: filtrar nulls do array `contactIds`
- Linha 802: usar `|| undefined` em vez de `|| null` para `conversationId`
- Linha 992: usar `data.stage || ''` para garantir string
- Linha 996: usar `data.due_date || undefined`

### 5. settings/AgentSettings.tsx e ApiSettings.tsx
- Adicionar fallback `|| ''` nos argumentos que podem ser `undefined`

## Detalhes Tecnicos

Todas as correcoes sao ajustes de tipo minimos -- nao alteram a logica do app, apenas alinham os tipos TypeScript com os valores retornados pelo banco de dados (que usa `null` em vez de `undefined` para campos opcionais).

