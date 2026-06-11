import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { auth, db, isConfigComplete } from '../config/firebase';

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  userId: string;
  tipo: TransactionType;
  valor: number;
  categoria: string;
  data: string;
  descricao?: string;
  timestamp?: Timestamp;
}

export interface UseFirebaseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  balance: string;
  setBalance: (value: string) => Promise<void>;
  isOnline: boolean;
}

const BALANCE_STORAGE_KEY = 'moneycontrol:balance';

export function useFirebaseTransactions(): UseFirebaseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalanceState] = useState('0.00');
  const [isOnline, setIsOnline] = useState(!isConfigComplete);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    if (!isConfigComplete) {
      setLoading(false);
      setIsOnline(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsOnline(true);
      } else {
        setUserId(null);
        setIsOnline(false);
      }
    }, (err) => {
      console.error('Erro ao monitorar auth:', err);
      setError('Erro na autenticação');
      setIsOnline(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load balance from AsyncStorage
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const stored = await AsyncStorage.getItem(BALANCE_STORAGE_KEY);
        if (stored) {
          setBalanceState(stored);
        }
      } catch (err) {
        console.warn('Erro ao carregar saldo:', err);
      }
    };

    loadBalance();
  }, []);

  // Subscribe to Firestore transactions
  useEffect(() => {
    if (!userId || !isOnline) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data: Transaction[] = [];
          snapshot.forEach((doc) => {
            const docData = doc.data();
            data.push({
              id: doc.id,
              userId: docData.userId,
              tipo: docData.tipo as TransactionType,
              valor: docData.valor,
              categoria: docData.categoria,
              data: docData.data,
              descricao: docData.descricao,
              timestamp: docData.timestamp,
            });
          });
          // Sort by date descending
          data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          setTransactions(data);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Erro ao carregar transações:', err);
          setError('Erro ao carregar transações');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Erro ao configurar listener:', err);
      setError('Erro ao configurar listener');
      setLoading(false);
    }
  }, [userId, isOnline]);

  // Migrate local AsyncStorage transactions to Firestore when user signs in
  useEffect(() => {
    const migrate = async () => {
      if (!userId || !isOnline) return;

      const LOCAL_KEY = 'moneycontrol:transactions';
      try {
        const local = await AsyncStorage.getItem(LOCAL_KEY);
        if (!local) return;
        const parsed = JSON.parse(local) as Array<any>;
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        for (const item of parsed) {
          try {
            await addDoc(collection(db, 'transactions'), {
              userId,
              tipo: item.type ?? item.tipo,
              valor: item.value ?? item.valor,
              categoria: item.category ?? item.categoria ?? 'Outros',
              data: item.date ?? item.data ?? new Date().toISOString(),
              descricao: item.descricao ?? '',
              timestamp: Timestamp.now(),
            });
          } catch (err) {
            console.warn('Falha ao migrar item local:', err);
          }
        }

        // Remove local storage after attempting migration
        await AsyncStorage.removeItem(LOCAL_KEY);
        console.info('Migração de transações locais concluída.');
      } catch (err) {
        console.warn('Erro durante migração de transações locais:', err);
      }
    };

    migrate();
  }, [userId, isOnline]);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
      if (!userId || !isOnline) {
        throw new Error('Usuário não autenticado ou offline');
      }

      try {
        await addDoc(collection(db, 'transactions'), {
          userId,
          tipo: transaction.tipo,
          valor: transaction.valor,
          categoria: transaction.categoria,
          data: transaction.data,
          descricao: transaction.descricao || '',
          timestamp: Timestamp.now(),
        });
      } catch (err) {
        console.error('Erro ao adicionar transação:', err);
        throw err;
      }
    },
    [userId, isOnline]
  );

  const updateTransaction = useCallback(
    async (id: string, transaction: Partial<Transaction>) => {
      if (!userId || !isOnline) {
        throw new Error('Usuário não autenticado ou offline');
      }

      try {
        const docRef = doc(db, 'transactions', id);
        await updateDoc(docRef, {
          ...transaction,
          timestamp: Timestamp.now(),
        });
      } catch (err) {
        console.error('Erro ao atualizar transação:', err);
        throw err;
      }
    },
    [userId, isOnline]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!userId || !isOnline) {
        throw new Error('Usuário não autenticado ou offline');
      }

      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (err) {
        console.error('Erro ao deletar transação:', err);
        throw err;
      }
    },
    [userId, isOnline]
  );

  const setBalance = useCallback(async (value: string) => {
    try {
      await AsyncStorage.setItem(BALANCE_STORAGE_KEY, value);
      setBalanceState(value);
    } catch (err) {
      console.warn('Erro ao salvar saldo:', err);
      throw err;
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    balance,
    setBalance,
    isOnline,
  };
}
