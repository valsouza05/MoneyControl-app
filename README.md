# MoneyControl

## 1. Definição do Projeto

### 1.1 Tema

Nome do aplicativo: **MoneyControl**

O MoneyControl é um aplicativo desenvolvido para ajudar usuários a controlar e organizar seus gastos pessoais de forma simples e prática.
A proposta do aplicativo é permitir que o usuário registre suas despesas diárias, categorize os gastos e acompanhe o total gasto em determinado período. Dessa forma, o aplicativo auxilia no planejamento financeiro pessoal e ajuda o usuário a entender melhor como seu dinheiro está sendo utilizado.

### 1.2 Objetivo do Aplicativo

O objetivo do app é ajudar o usuário a organizar suas finanças pessoais por meio do registro de despesas. O foco principal é permitir o controle dos gastos, facilitar a identificação de padrões de consumo e promover maior equilíbrio financeiro.

O público-alvo inclui:
- estudantes;
- trabalhadores;
- qualquer pessoa que deseje maior controle sobre seus gastos.

O MoneyControl entrega valor ao oferecer uma solução simples e intuitiva para o registro de despesas, categorização de gastos e acompanhamento do consumo ao longo do tempo.

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)

RF01 – Registrar Saldo e Fluxo de Caixa
- O sistema deve permitir que o usuário registre um saldo inicial e deve atualizar esse valor automaticamente somando receitas e subtraindo despesas.

RF02 – Inserir Valor das Despesas
- O usuário deve informar o valor monetário do gasto de forma numérica.

RF03 – Selecionar Categoria
- Disponibilização de categorias pré-definidas (Alimentação, Transporte, Lazer, Moradia e Outros) e permissão para o usuário criar novas categorias personalizadas.

RF04 – Listar Gastos
- O sistema deve exibir todos os gastos cadastrados em formato de lista.

RF05 – Editar Gastos
- O usuário deve poder alterar informações de um gasto já registrado.

RF06 – Excluir Gastos
- O sistema deve permitir a remoção de um gasto da lista.

RF07 – Totalizar Gastos
- O sistema deve calcular e exibir o total gasto em um período.

RF08 – Filtrar Período
- O usuário pode visualizar gastos por dia, semana ou mês.

RF09 – Registrar Receitas
- O sistema deve permitir o cadastro de entradas financeiras (salários, bônus, extras) para o cálculo do saldo real.

RF10 – Confirmar Segurança em Exclusão
- O sistema deve exibir uma mensagem de confirmação antes de efetivar a remoção definitiva de qualquer registro de gasto ou receita.

### 2.2 Requisitos Não Funcionais (RNF)

RNF01 – Usabilidade
- O sistema deve priorizar a experiência do usuário, garantindo que o controle financeiro não seja uma tarefa exaustiva.
  - **Padronização Visual**: Utilizar uma paleta de cores consistente, onde despesas sejam identificadas em tons de vermelho e receitas/saldos positivos em tons de verde ou azul.
  - **Acessibilidade**: A interface deve possuir contraste adequado e fontes legíveis (mínimo de 14sp para textos corridos) para facilitar a leitura em diferentes condições de iluminação.
  - **Curva de Aprendizado**: Um usuário novo deve ser capaz de registrar seu primeiro gasto em menos de 3 cliques a partir da tela inicial (Dashboard).

RNF02 – Desempenho
- Garante que o aplicativo seja ágil, fator crítico para registros feitos "na hora" do gasto.
  - **Tempo de Resposta**: Operações locais (como transições de tela) devem ser instantâneas (< 100ms). Operações de rede (leitura/escrita no Firebase) devem retornar um feedback ao usuário em até 2 segundos.
  - **Otimização de Dados**: O aplicativo deve carregar inicialmente apenas as transações do mês vigente para evitar consumo excessivo de memória e processamento.

RNF03 – Portabilidade
- O MoneyControl deve ser acessível em diferentes ecossistemas.
  - **Multiplataforma**: Graças ao uso do React Native e Expo, o código deve ser 90% compartilhado entre as versões Android e iOS.
  - **Responsividade**: O layout deve se adaptar a diferentes tamanhos de tela (smartphones compactos e dispositivos com telas maiores), utilizando unidades de medida flexíveis.
  - **Navegadores**: A versão Web (se habilitada pelo Expo) deve ser compatível com as versões estáveis mais recentes do Google Chrome, Safari e Mozilla Firefox.

RNF04 – Manutenibilidade
- Focado na longevidade do projeto e na facilidade de futuras atualizações (V2 e V3).
  - **Arquitetura**: O código deve seguir o padrão de separação de responsabilidades, isolando a lógica de negócio (Hooks/Context) da camada de visão (Componentes).
  - **Documentação de Código**: Funções complexas e chamadas à API do Firebase devem conter comentários explicativos (JSDoc).
  - **Padronização (Linting)**: Uso de ferramentas como ESLint e Prettier para manter a formatação do código uniforme entre diferentes desenvolvedores.

RNF05 – Segurança Básica
- Proteção das informações financeiras, que são dados sensíveis.
  - **Criptografia em Trânsito**: Toda comunicação entre o aplicativo e o Firebase deve ocorrer via protocolos seguros (HTTPS/TLS).
  - **Regras de Segurança do Firestore**: Configuração de regras de backend no Firebase para garantir que um usuário só possa ler ou escrever dados que pertençam ao seu próprio userId.
  - **Armazenamento Local**: Caso dados sejam salvos no dispositivo para o modo offline, informações sensíveis não devem ser expostas em logs do sistema ou áreas públicas do armazenamento.

RNF06 – Persistência Offline
- O aplicativo deve permitir o registro de dados mesmo sem conexão com a internet, sincronizando-os com o Firebase Firestore assim que a conexão for restabelecida.

RNF07 – Feedback Visual (Estados de Carregamento)
- O sistema deve exibir indicadores de carregamento (spinners) durante a comunicação com o banco de dados para cumprir o tempo de resposta esperado.

### 2.3 Modelagem do Fluxo de Dados (Firestore)

Para garantir a integridade e a organização do código, a estrutura de dados no banco de dados seguirá o modelo abaixo:

**Coleção: `transactions`**
- `id`: String (identificador único)
- `userId`: String (vínculo com o usuário logado)
- `tipo`: String ("receita" ou "despesa")
- `valor`: Number (valor monetário positivo)
- `categoria`: String
- `data`: Timestamp (ISO 8601)
- `descricao`: String (opcional)

## 3. Requisitos Técnicos do Projeto

Definição da arquitetura e ferramentas utilizadas.

- **Linguagem de programação**: JavaScript
- **Framework/Plataforma**: React Native com Expo (Expo Go)
- **Ambiente de desenvolvimento**: Expo Go
- **Editor de código**: Visual Studio Code (VS Code)
- **Runtime/Backend**: Node.js
- **IDE complementar**: Android Studio
- **Banco de Dados**: Firebase (Cloud Firestore)
- **Controle de Versão**: Git/GitHub
- **Serviços de Terceiros**: Firebase (autenticação e banco de dados)
- **Validação de Dados**: Utilização de bibliotecas de esquema (como Yup ou Zod) para validar se os campos de valor são numéricos e se as datas são válidas antes do envio ao Firebase.
- **Gerenciamento de Estado Global**: Implementação de React Context API ou Custom Hooks (ex: useExpenses) para centralizar os cálculos de saldo total e a lógica de filtros por período, evitando a poluição visual dos componentes de tela.
- **Tratamento de Exceções**: Uso de blocos try/catch em todas as funções de persistência para capturar erros de rede e informar o usuário via alertas amigáveis.

## 4. Ideias Futuras (Backlog)

Funcionalidades planejadas para versões posteriores (V2, V3).

- **V2**: Implementação de gráficos de pizza/barras para visualização por categoria.
- **V2**: Sistema de Autenticação de Usuário (Firebase Auth) para proteção individual de dados.
- **V3**: Exportação de relatórios mensais em formato PDF.

## 5. Como Executar

### 5.1 Instalação

1. Instale as dependências do projeto:

```bash
npm install
```

2. Configure as variáveis de ambiente (se necessário para Firebase):

Crie um arquivo `.env.local` na raiz do projeto com suas credenciais Firebase (será adicionado após configuração do Firebase).

### 5.2 Desenvolvimento Local

1. Inicie o aplicativo em modo desenvolvimento:

```bash
npx expo start
```

2. Escaneie o código QR com:
   - **Android**: Use o app Expo Go
   - **iOS**: Use o app Expo Go
   - **Web**: Pressione `w` no terminal

### 5.3 Build para Android

1. Para gerar um APK de preview:

```bash
eas build --platform android --profile preview
```

2. Para gerar um APK de produção:

```bash
eas build --platform android --profile production
```

### 5.4 Configuração do Firebase

Antes de usar recursos de sincronização com Firebase, configure:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Cloud Firestore e Authentication
3. Configure as regras de segurança conforme documentado em RNF05
4. Adicione suas credenciais ao arquivo `.env.local`

