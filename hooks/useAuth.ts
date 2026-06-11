import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      return res;
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar conta');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res;
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao entrar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao sair');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao solicitar reset de senha');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, signUp, signIn, signOut, resetPassword } as const;
}
