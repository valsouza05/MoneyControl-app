import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  React.useEffect(() => {
    if (auth.user) {
      router.replace('(tabs)');
    }
  }, [auth.user, router]);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Informe email e senha.');
      return;
    }

    try {
      if (isSignUp) {
        await auth.signUp(email.trim(), password);
        Alert.alert('Sucesso', 'Conta criada. Você está logado.');
      } else {
        await auth.signIn(email.trim(), password);
      }
      setEmail('');
      setPassword('');
      router.replace('(tabs)');
    } catch (err) {
      Alert.alert('Erro', auth.error ?? 'Falha ao processar autenticação');
      console.error('Auth submit error', err);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe o email para reset.');
      return;
    }
    try {
      await auth.resetPassword(email.trim());
      Alert.alert('Enviado', 'Email de recuperação enviado.');
    } catch (err) {
      Alert.alert('Erro', auth.error ?? 'Falha ao enviar email de recuperação');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.card}>
        <ThemedText type="title" style={styles.title}>{isSignUp ? 'Criar conta' : 'Entrar'}</ThemedText>

        <ThemedText style={styles.label}>Email</ThemedText>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!auth.loading}
        />

        <ThemedText style={styles.label}>Senha</ThemedText>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!auth.loading}
        />

        <View style={styles.row}>
          <Pressable style={[styles.button, auth.loading && styles.buttonDisabled]} onPress={submit} disabled={auth.loading}>
            {auth.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? 'Criar conta' : 'Entrar'}</Text>}
          </Pressable>
          <Pressable style={[styles.toggleButton]} onPress={() => setIsSignUp((s) => !s)} disabled={auth.loading}>
            <Text style={styles.toggleText}>{isSignUp ? 'Já tenho conta' : 'Criar conta'}</Text>
          </Pressable>
        </View>

        {!isSignUp && (
          <Pressable onPress={handleReset} disabled={auth.loading} style={{ marginTop: 12 }}>
            <Text style={{ color: '#0a7ea4', fontWeight: '600' }}>Esqueci minha senha</Text>
          </Pressable>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 40,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  toggleButton: {
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  toggleText: {
    color: '#6c757d',
    fontWeight: '700',
  },
});
