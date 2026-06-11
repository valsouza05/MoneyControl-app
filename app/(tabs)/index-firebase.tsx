import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { MoneyIcon } from '../../components/money-icon';
import { StatusBar } from '../../components/status-bar';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../hooks/useAuth';
import { Transaction, TransactionType, useFirebaseTransactions } from '../../hooks/useFirebaseTransactions';

const CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Outros'] as const;
type Category = (typeof CATEGORIES)[number];

type Period = 'all' | 'day' | 'week' | 'month';

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const PRIMARY_60 = 'rgba(10, 126, 164, 0.6)';
const PRIMARY_30 = 'rgba(10, 126, 164, 0.3)';
const PRIMARY_10 = 'rgba(10, 126, 164, 0.1)';
const EXPENSE_COLOR = '#d32f2f';
const INCOME_COLOR = '#2e7d32';
const INCOME_COLOR_LIGHT = 'rgba(46, 125, 50, 0.1)';
const INCOME_COLOR_MEDIUM = 'rgba(46, 125, 50, 0.3)';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateToBR(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const TODAY_DATE = formatDateToBR(new Date());

function parseDate(dateString: string) {
  const [day, month, year] = dateString.split('/');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

// Convert between our types and Firebase types
interface FirestoreTransaction extends Transaction {
  tipo: TransactionType;
  valor: number;
  data: string;
}

interface DisplayTransaction {
  id: string;
  value: number;
  category: Category;
  date: string;
  type: TransactionType;
}

function firestoreToDisplay(tx: FirestoreTransaction): DisplayTransaction {
  return {
    id: tx.id,
    value: tx.valor,
    category: tx.categoria as Category,
    date: tx.data,
    type: tx.tipo,
  };
}

function displayToFirestore(tx: DisplayTransaction): Omit<FirestoreTransaction, 'id' | 'userId'> {
  return {
    tipo: tx.type,
    valor: tx.value,
    categoria: tx.category,
    data: tx.date,
  } as any;
}

export default function HomeScreen() {
  const firebase = useFirebaseTransactions();
  const auth = useAuth();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<Category>('Alimentação');
  const [date, setDate] = useState(TODAY_DATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('all');
  const [transactionType, setTransactionType] = useState<TransactionType>('despesa');
  const [isSaving, setIsSaving] = useState(false);

  const displayTransactions: DisplayTransaction[] = useMemo(
    () => firebase.transactions.map(firestoreToDisplay),
    [firebase.transactions]
  );

  const filteredTransactions = useMemo(() => {
    if (period === 'all') {
      return displayTransactions;
    }

    const now = new Date();
    return displayTransactions.filter((transaction) => {
      const transactionDate = parseDate(transaction.date);
      if (Number.isNaN(transactionDate.getTime())) {
        return false;
      }

      const diffDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (period === 'day') {
        return diffDays === 0;
      }
      if (period === 'week') {
        return diffDays >= 0 && diffDays < 7;
      }
      if (period === 'month') {
        return diffDays >= 0 && diffDays < 31;
      }
      return true;
    });
  }, [displayTransactions, period]);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, transaction) => sum + transaction.value, 0);
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'receita')
    .reduce((sum, transaction) => sum + transaction.value, 0);
  const net = totalIncome - totalExpenses;
  const availableBalance = totalIncome - totalExpenses;

  const handleSave = async () => {
    const normalizedValue = value.replace(/\./g, '').replace(',', '.').trim();
    const parsedValue = Number(normalizedValue);
    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      alert('Informe um valor numérico válido.');
      return;
    }

    if (!DATE_PATTERN.test(date)) {
      alert('Informe a data no formato DD/MM/AAAA.');
      return;
    }

    setIsSaving(true);
    try {
      const transactionData = {
        tipo: transactionType,
        valor: parsedValue,
        categoria: category,
        data: date,
      };

      if (editingId) {
        await firebase.updateTransaction(editingId, {
          ...transactionData,
          id: editingId,
          userId: '',
        });
      } else {
        await firebase.addTransaction(transactionData);
      }

      setValue('');
      setDate(TODAY_DATE);
      setCategory('Alimentação');
      setTransactionType('despesa');
      setEditingId(null);
    } catch (err) {
      alert('Erro ao salvar transação. Tente novamente.');
      console.error('Erro:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const exportMonthlyPDF = async () => {
    try {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthly = filteredTransactions.filter((t) => {
        const [d, m, y] = t.date.split('/').map(Number);
        return m - 1 === month && y === year;
      });

      let html = `<h1>Relatório Mensal - ${month + 1}/${year}</h1><table border="1" cellpadding="6" cellspacing="0"><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Valor</th><th>Descrição</th></tr>`;
      for (const t of monthly) {
        html += `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.category}</td><td>${t.value.toFixed(2)}</td><td>${t.descricao || ''}</td></tr>`;
      }
      html += `</table>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (uri) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Relatório mensal' });
      }
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      Alert.alert('Erro', 'Falha ao gerar o PDF.');
    }
  };

  const handleEdit = (transaction: DisplayTransaction) => {
    setEditingId(transaction.id);
    setValue(transaction.value.toString());
    setCategory(transaction.category);
    setDate(transaction.date);
    setTransactionType(transaction.type);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              await firebase.deleteTransaction(id);
              if (editingId === id) {
                setEditingId(null);
                setValue('');
                setDate(TODAY_DATE);
                setCategory('Alimentação');
                setTransactionType('despesa');
              }
            } catch (err) {
              alert('Erro ao deletar transação. Tente novamente.');
              console.error('Erro:', err);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {!auth.user ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Acesse sua conta</ThemedText>
          <ThemedText style={{ marginTop: 8 }}>Para sincronizar suas transações, faça login ou crie uma conta.</ThemedText>
          <Pressable
            style={[styles.saveButton, { marginTop: 12 }]}
            onPress={() => router.push('auth')}
          >
            <Text style={styles.saveButtonText}>Entrar / Criar conta</Text>
          </Pressable>
        </ThemedView>
      ) : null}
      <StatusBar isOnline={firebase.isOnline} isLoading={firebase.loading} error={firebase.error} />

      <ThemedView style={styles.heroSection}>
        <MoneyIcon />
        <ThemedText type="title" style={styles.title}>
          Money Control
        </ThemedText>
        {!firebase.isOnline && <ThemedText style={styles.offlineLabel}>📴 Offline</ThemedText>}
      </ThemedView>

      {auth.user ? (
        <ThemedView style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <ThemedText type="subtitle">Conectado como</ThemedText>
              <ThemedText style={{ marginTop: 6, fontWeight: '600' }}>{auth.user.email}</ThemedText>
            </View>
            <Pressable
              style={[styles.saveButton, { backgroundColor: '#d32f2f', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 }]}
              onPress={async () => {
                try {
                  await auth.signOut();
                  router.push('auth');
                } catch (err) {
                  Alert.alert('Erro', auth.error ?? 'Falha ao sair.');
                }
              }}
            >
              <Text style={styles.saveButtonText}>Sair</Text>
            </Pressable>
          </View>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Saldo da conta</ThemedText>
        <ThemedText style={styles.label}>Valor do saldo</ThemedText>
        <ThemedText style={styles.balanceValue}>{formatCurrency(availableBalance)}</ThemedText>
        <ThemedText style={styles.balanceText}>
          Saldo disponível: {formatCurrency(availableBalance)}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Nova transação</ThemedText>

        <ThemedText style={styles.label}>Tipo</ThemedText>
        <View style={styles.categoryRow}>
          <Pressable
            onPress={() => setTransactionType('despesa')}
            style={[
              styles.categoryButton,
              transactionType === 'despesa' ? styles.categoryButtonSelected : undefined,
            ]}>
            <Text
              style={[
                styles.categoryButtonText,
                transactionType === 'despesa' ? styles.categoryButtonTextSelected : undefined,
              ]}>
              Despesa
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTransactionType('receita')}
            style={[
              styles.incomeButton,
              transactionType === 'receita' ? styles.incomeButtonSelected : undefined,
            ]}>
            <Text
              style={[
                styles.incomeButtonText,
                transactionType === 'receita' ? styles.incomeButtonTextSelected : undefined,
              ]}>
              Receita
            </Text>
          </Pressable>
        </View>

        <ThemedText style={styles.label}>Valor</ThemedText>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="1234.56"
          keyboardType="decimal-pad"
          style={styles.input}
          editable={!isSaving}
        />

        <ThemedText style={styles.label}>Categoria</ThemedText>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.categoryButton,
                category === item ? styles.categoryButtonSelected : undefined,
              ]}>
              <Text
                style={[
                  styles.categoryButtonText,
                  category === item ? styles.categoryButtonTextSelected : undefined,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.label}>Data</ThemedText>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="DD/MM/AAAA"
          style={styles.input}
          editable={!isSaving}
        />

        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {editingId ? 'Atualizar transação' : 'Adicionar transação'}
            </Text>
          )}
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Filtrar por período</ThemedText>
        <View style={styles.filterRow}>
          {(['all', 'day', 'week', 'month'] as Period[]).map((periodOption) => (
            <Pressable
              key={periodOption}
              onPress={() => setPeriod(periodOption)}
              style={[
                styles.filterButton,
                period === periodOption ? styles.filterButtonSelected : undefined,
              ]}>
              <Text
                style={[
                  styles.filterButtonText,
                  period === periodOption ? styles.filterButtonTextSelected : undefined,
                ]}>
                {periodOption === 'all'
                  ? 'Todos'
                  : periodOption === 'day'
                  ? 'Hoje'
                  : periodOption === 'week'
                  ? 'Semana'
                  : 'Mês'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.totalLabel}>Receitas: {formatCurrency(totalIncome)}</ThemedText>
        <ThemedText style={styles.totalLabel}>Despesas: {formatCurrency(totalExpenses)}</ThemedText>
        <ThemedText style={[styles.totalLabel, { color: net >= 0 ? INCOME_COLOR : EXPENSE_COLOR }]}>
          Líquido: {formatCurrency(net)}
        </ThemedText>
        <Pressable style={[styles.saveButton, { marginTop: 12 }]} onPress={exportMonthlyPDF}>
          <Text style={styles.saveButtonText}>Exportar PDF mensal</Text>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Transações cadastradas</ThemedText>
        {firebase.loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <ThemedText style={{ marginTop: 12 }}>Carregando transações...</ThemedText>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <ThemedText>Nenhuma transação encontrada para o período selecionado.</ThemedText>
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ThemedView
                style={[styles.expenseItem, item.type === 'receita' ? styles.incomeItem : undefined]}>
                <View style={styles.expenseInfo}>
                  <ThemedText
                    style={[
                      styles.expenseAmount,
                      item.type === 'receita' ? { color: INCOME_COLOR } : { color: EXPENSE_COLOR },
                    ]}
                    type="defaultSemiBold">
                    {item.type === 'receita' ? '+' : '-'} {formatCurrency(item.value)}
                  </ThemedText>
                  <ThemedText>{item.category}</ThemedText>
                  <ThemedText>{item.date}</ThemedText>
                </View>
                <View style={styles.expenseActions}>
                  <Pressable style={styles.actionButton} onPress={() => handleEdit(item)} disabled={isSaving}>
                    <Text style={styles.actionText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                    disabled={isSaving}>
                    <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
                  </Pressable>
                </View>
              </ThemedView>
            )}
          />
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pageContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: PRIMARY_10,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    textAlign: 'center',
  },
  offlineLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#f57c00',
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    backgroundColor: PRIMARY_30,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: PRIMARY_60,
  },
  categoryButtonText: {
    color: '#0a7ea4',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  incomeButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: INCOME_COLOR,
    backgroundColor: INCOME_COLOR_LIGHT,
    marginRight: 8,
    marginBottom: 8,
  },
  incomeButtonSelected: {
    backgroundColor: INCOME_COLOR_MEDIUM,
  },
  incomeButtonText: {
    color: INCOME_COLOR,
  },
  incomeButtonTextSelected: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  balanceText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    backgroundColor: PRIMARY_10,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonSelected: {
    backgroundColor: PRIMARY_60,
  },
  filterButtonText: {
    color: '#0a7ea4',
  },
  filterButtonTextSelected: {
    color: '#fff',
  },
  totalLabel: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  list: {
    marginTop: 14,
  },
  listContent: {
    paddingBottom: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#f4f7fb',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  expenseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  actionText: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  deleteText: {
    color: '#d32f2f',
  },
  incomeItem: {
    backgroundColor: INCOME_COLOR_LIGHT,
  },
});
