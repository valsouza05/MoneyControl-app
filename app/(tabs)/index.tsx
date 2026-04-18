import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Outros'] as const;
type Category = (typeof CATEGORIES)[number];

type Period = 'all' | 'day' | 'week' | 'month';

type Expense = {
  id: string;
  value: number;
  category: Category;
  date: string;
};

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const PRIMARY_60 = 'rgba(10, 126, 164, 0.6)';
const PRIMARY_30 = 'rgba(10, 126, 164, 0.3)';
const PRIMARY_10 = 'rgba(10, 126, 164, 0.1)';

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

const STORAGE_KEY = 'moneycontrol:expenses';

function parseDate(dateString: string) {
  const [day, month, year] = dateString.split('/');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export default function HomeScreen() {
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<Category>('Alimentação');
  const [date, setDate] = useState(TODAY_DATE);
  const [balance, setBalance] = useState('0.00');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('all');

  const accountBalance = Number(balance.replace(',', '.')) || 0;

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Expense[];
          setExpenses(parsed);
        }
      } catch (error) {
        console.warn('Falha ao carregar gastos:', error);
      }
    };

    loadExpenses();
  }, []);

  useEffect(() => {
    const saveExpenses = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      } catch (error) {
        console.warn('Falha ao salvar gastos:', error);
      }
    };

    saveExpenses();
  }, [expenses]);

  const selectedExpense = expenses.find((expense) => expense.id === editingId) ?? null;

  const handleSave = () => {
    const parsedValue = Number(value.replace(',', '.'));
    if (!parsedValue || Number.isNaN(parsedValue)) {
      alert('Informe um valor numérico válido.');
      return;
    }

    if (!DATE_PATTERN.test(date)) {
      alert('Informe a data no formato DD/MM/AAAA.');
      return;
    }

    const expenseData: Expense = {
      id: editingId ?? String(Date.now()),
      value: parsedValue,
      category,
      date,
    };

    setExpenses((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? expenseData : item));
      }
      return [expenseData, ...current];
    });

    setValue('');
    setDate(TODAY_DATE);
    setCategory('Alimentação');
    setEditingId(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setValue(expense.value.toString());
    setCategory(expense.category);
    setDate(expense.date);
  };

  const handleDelete = (id: string) => {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setValue('');
      setDate(TODAY_DATE);
      setCategory('Alimentação');
    }
  };

  const filteredExpenses = useMemo(() => {
    if (period === 'all') {
      return expenses;
    }

    const now = new Date();
    return expenses.filter((expense) => {
      const expenseDate = parseDate(expense.date);
      if (Number.isNaN(expenseDate.getTime())) {
        return false;
      }

      const diffDays = Math.floor((now.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
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
  }, [expenses, period]);

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const availableBalance = accountBalance - total;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <ThemedView style={styles.heroSection}>
        <ThemedText type="title" style={styles.title}>
          Money Control
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Saldo da conta</ThemedText>
        <ThemedText style={styles.label}>Valor do saldo</ThemedText>
        <TextInput
          value={balance}
          onChangeText={setBalance}
          placeholder="1234.56"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <ThemedText style={styles.balanceText}>Saldo disponível: {formatCurrency(availableBalance)}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Novo gasto</ThemedText>

        <ThemedText style={styles.label}>Valor</ThemedText>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="1234.56"
          keyboardType="decimal-pad"
          style={styles.input}
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
        />

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{editingId ? 'Atualizar gasto' : 'Adicionar gasto'}</Text>
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

        <ThemedText style={styles.totalLabel}>Total: {formatCurrency(total)}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Gastos cadastrados</ThemedText>
        {filteredExpenses.length === 0 ? (
          <ThemedText>Nenhum gasto encontrado para o período selecionado.</ThemedText>
        ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ThemedView style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <ThemedText style={styles.expenseAmount} type="defaultSemiBold">
                    {formatCurrency(item.value)}
                  </ThemedText>
                  <ThemedText>{item.category}</ThemedText>
                  <ThemedText>{item.date}</ThemedText>
                </View>
                <View style={styles.expenseActions}>
                  <Pressable style={styles.actionButton} onPress={() => handleEdit(item)}>
                    <Text style={styles.actionText}>Editar</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
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
    backgroundColor: 'transparent',
  },
  pageContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: PRIMARY_10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
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
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
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
  saveButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
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
});
