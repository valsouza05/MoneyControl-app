# Guia de Configuração do Firebase

Este guia fornece instruções passo a passo para configurar o Firebase Firestore e integrar com o MoneyControl.

## 1. Criar um Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em **"Criar um projeto"**
3. Digite um nome para o projeto (ex: `MoneyControl`)
4. Siga as instruções:
   - Marque "Habilitar Google Analytics" (opcional)
   - Clique em "Criar projeto"
5. Espere a criação ser concluída

## 2. Criar um App Web

1. No console do Firebase, clique no ícone **</> (Web)**
2. Nome do app: `MoneyControl Web`
3. Copie o código de configuração

## 3. Obter Credenciais

Na página de configuração do seu app web, você verá algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "moneycontrol-xxxxx.firebaseapp.com",
  projectId: "moneycontrol-xxxxx",
  storageBucket: "moneycontrol-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXX"
};
```

## 4. Configurar Variáveis de Ambiente

1. Copie `.env.local.example` para `.env.local`
2. Cole os valores de firebaseConfig nos campos correspondentes:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=moneycontrol-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=moneycontrol-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=moneycontrol-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXX
```

## 5. Criar Firestore Database

1. No console do Firebase, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha local: `us-central1` (ou mais próximo)
4. Modo de segurança: **"Iniciar no modo de teste"** (por enquanto)
5. Clique em **"Criar"**

## 6. Configurar Regras de Segurança

**IMPORTANTE**: O modo de teste permite qualquer pessoa escrever dados. Para produção, você DEVE implementar regras de segurança.

### Regras Recomendadas para Firestore

1. No Firestore, clique em **"Regras"**
2. Substitua o conteúdo pelas regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem acessar
    match /transactions/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Validação de dados
    match /transactions/{userId}/{docId} {
      allow create: if request.auth.uid == userId &&
                       request.resource.data.keys().hasAll(['tipo', 'valor', 'categoria', 'data', 'userId']) &&
                       request.resource.data.tipo in ['receita', 'despesa'] &&
                       request.resource.data.valor > 0 &&
                       request.resource.data.userId == request.auth.uid;
      
      allow update: if request.auth.uid == userId &&
                       request.resource.data.userId == request.auth.uid;
      
      allow delete: if request.auth.uid == userId;
    }
  }
}
```

3. Clique em **"Publicar"**

## 7. Estrutura de Dados no Firestore

O app espera a seguinte estrutura:

```
transactions/
  ├── {userId}/
  │   ├── {documentId}
  │   │   ├── userId: string
  │   │   ├── tipo: "receita" | "despesa"
  │   │   ├── valor: number
  │   │   ├── categoria: string
  │   │   ├── data: string (DD/MM/AAAA)
  │   │   ├── descricao: string (opcional)
  │   │   └── timestamp: Timestamp
```

**Importante**: O Firestore automaticamente cria sub-coleções por userId. Não é necessário criar manualmente.

## 8. Instalar Dependências

```bash
npm install firebase
```

Se estiver usando Expo Web, pode precisar:

```bash
npx expo install firebase
```

## 9. Testar Configuração

1. Inicie o app em modo desenvolvimento:

```bash
npx expo start
```

2. Abra em seu dispositivo/emulador
3. Se a configuração estiver correta, você verá uma mensagem indicando que está online
4. Tente adicionar uma transação - ela deve aparecer imediatamente

## 10. Migrar Dados Locais (Opcional)

Se você já tinha dados salvos localmente (AsyncStorage), pode implementar uma função de migração. Entre em contato com o suporte para mais informações.

## Troubleshooting

### "Firebase não está configurado"

- Verifique se `.env.local` existe e contém valores válidos
- Os valores devem começar com `EXPO_PUBLIC_` (necessário para Expo)
- Reinicie o servidor Expo

### "Erro ao conectar com Firebase"

- Verifique a conexão de internet
- Confirme que o projeto Firebase está ativo
- Verifique as regras de segurança do Firestore
- Abra a aba "Network" no DevTools para ver os erros da rede

### "Usuário não autenticado"

- A autenticação anônima deve estar habilitada no Firebase
- Vá para **Authentication > Sign-in method** e habilite **"Anonymous"**

## Próximas Etapas

- [ ] Configurar autenticação com email/senha ou Google Sign-In
- [ ] Implementar backup de dados
- [ ] Configurar alertas de limite de gastos
- [ ] Adicionar gráficos de gastos por categoria
- [ ] Implementar exportação de dados em PDF

## Referências

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Native Firebase](https://rnfirebase.io/)
