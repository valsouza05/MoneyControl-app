import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ThemedView } from './themed-view';

interface StatusBarProps {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
}

export function StatusBar({ isOnline, isLoading, error }: StatusBarProps) {
  if (!error && isOnline && !isLoading) {
    return null;
  }

  if (error) {
    return (
      <ThemedView style={[styles.statusBar, styles.errorBar]}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
      </ThemedView>
    );
  }

  if (!isOnline) {
    return (
      <ThemedView style={[styles.statusBar, styles.offlineBar]}>
        <Text style={styles.offlineText}>📴 Modo offline (dados salvos localmente)</Text>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={[styles.statusBar, styles.loadingBar]}>
        <Text style={styles.loadingText}>⏳ Carregando...</Text>
      </ThemedView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  statusBar: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorBar: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#c62828',
    fontWeight: '600',
    fontSize: 14,
  },
  offlineBar: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
  },
  offlineText: {
    color: '#e65100',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingBar: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  loadingText: {
    color: '#0d47a1',
    fontWeight: '600',
    fontSize: 14,
  },
});
