# Migração para Firebase

Este documento explica como migrar seu MoneyControl para usar Firebase Firestore.

## Mudanças Realizadas

### Novos Arquivos Criados

- `config/firebase.ts` - Configuração do Firebase
- `hooks/useFirebaseTransactions.ts` - Custom hook para gerenciar transações com Firestore
- `components/status-bar.tsx` - Componente para exibir status de conexão
- `app/(tabs)/index-firebase.tsx` - Versão do HomeScreen com Firebase integrado
- `.env.local.example` - Template de variáveis de ambiente
- `FIREBASE_SETUP.md` - Guia de configuração do Firebase

### Versão Atual do App

O app atual em `app/(tabs)/index.tsx` usa **AsyncStorage** (local apenas).

### Como Usar a Versão com Firebase

**Opção 1: Substituir o arquivo original**

```bash
# Backup do original
cp app/(tabs)/index.tsx app/(tabs)/index-asyncstorage.tsx

# Usar a versão Firebase
mv app/(tabs)/index-firebase.tsx app/(tabs)/index.tsx
```

**Opção 2: Manter ambas as versões**

Deixe ambas as versões e escolha qual usar por variável de ambiente.

## Pré-requisitos

1. ✅ Firebase Console configurado (ver `FIREBASE_SETUP.md`)
2. ✅ `.env.local` com credenciais Firebase
3. ✅ Dependência Firebase instalada

```bash
npm install firebase
```

4. ✅ Autenticação Anônima habilitada no Firebase

## Funcionalidades Adicionadas

### 1. Autenticação Anônima
- ✅ Usuários são autenticados automaticamente
- ✅ Cada usuário tem seu próprio set de transações

### 2. Sincronização em Tempo Real
- ✅ Transações são sincronizadas automaticamente com Firestore
- ✅ Mudanças em outro dispositivo aparecem em tempo real

### 3. Suporte a Offline
- ✅ Dados são armazenados localmente também
- ✅ App funciona mesmo sem internet
- ✅ Sincronização automática quando reconectar

### 4. Status Visual
- ✅ Indicador de conexão (online/offline)
- ✅ Loading spinners durante operações
- ✅ Mensagens de erro amigáveis

## Estrutura de Dados

A estrutura foi atualizada para corresponder ao Firestore:

**Local (AsyncStorage - antes):**
```json
{
  "id": "expense_1",
  "value": 50.00,
  "category": "Alimentação",
  "date": "27/05/2026",
  "type": "despesa"
}
```

**Firestore (agora):**
```json
{
  "userId": "auth_user_id",
  "tipo": "despesa",
  "valor": 50.00,
  "categoria": "Alimentação",
  "data": "27/05/2026",
  "descricao": "",
  "timestamp": 1685083200
}
```

## Mudanças na API

### Hook antigo (AsyncStorage):
```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);

// Carregar
const stored = await AsyncStorage.getItem(STORAGE_KEY);
setTransactions(JSON.parse(stored));

// Salvar
await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
```

### Hook novo (Firebase):
```typescript
const firebase = useFirebaseTransactions();

// Carregar (automático)
firebase.transactions // Já está sincronizado

// Salvar (automático)
await firebase.addTransaction(transaction);
await firebase.updateTransaction(id, transaction);
await firebase.deleteTransaction(id);
```

## Testando a Migração

### 1. Teste Local

```bash
npx expo start
```

Abra no Expo Go e verifique:
- ✅ App carrega sem erros
- ✅ Adicione uma transação
- ✅ Transação aparece na lista
- ✅ Atualize - dados persistem

### 2. Teste Firestore

1. Vá ao [Firebase Console](https://console.firebase.google.com)
2. Abra seu projeto
3. Vá para Firestore Database
4. Procure pela coleção `transactions`
5. Verifique se sua transação de teste está lá

### 3. Teste Sincronização em Tempo Real

1. Abra o app em dois dispositivos/abas
2. Adicione uma transação em um
3. Veja a transação aparecer no outro em tempo real

## Rollback (Voltar para AsyncStorage)

Se precisar voltar:

```bash
# Voltar ao original
mv app/(tabs)/index.tsx app/(tabs)/index-firebase.tsx
mv app/(tabs)/index-asyncstorage.tsx app/(tabs)/index.tsx

# Remover dependência Firebase (opcional)
npm remove firebase
```

## Troubleshooting

### Erros Comuns

**"Firebase não está configurado"**
- ✅ Crie `.env.local` (copie `.env.local.example`)
- ✅ Preencha com suas credenciais
- ✅ Reinicie o servidor Expo

**"Transactions collection not found"**
- ✅ Crie a coleção manualmente no Firestore
- ✅ Ou adicione uma transação via app (será criada automaticamente)

**"Permission denied"**
- ✅ Verifique as regras de segurança do Firestore
- ✅ Habilite autenticação anônima

**"Modo offline indefinido"**
- ✅ Se o app funcionar mas `isOnline` for false
- ✅ Verifique `config/firebase.ts` - `isConfigComplete`
- ✅ Verifique console para erros de autenticação

## Recursos

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Security Rules Simulator](https://firebase.google.com/docs/firestore/security/rules-generator)

## Próximas Etapas

- [ ] Testar em dispositivo real (Android/iOS)
- [ ] Testar sincronização offline
- [ ] Implementar backup automático
- [ ] Adicionar autenticação com Google/Email
- [ ] Documentar API para novos desenvolvedores
