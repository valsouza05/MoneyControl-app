import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useFirebaseTransactions } from '../../hooks/useFirebaseTransactions';

const CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Outros'];
const STORAGE_KEY = 'moneycontrol:transactions';

export default function ChartsScreen() {
  const firebase = useFirebaseTransactions();
  const [localTransactions, setLocalTransactions] = useState<any[]>([]);

  useEffect(() => {
    const loadLocal = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setLocalTransactions(JSON.parse(stored));
      } catch (err) {
        console.warn('Erro ao carregar transações locais para gráficos', err);
      }
    };
    loadLocal();
  }, []);

  const source = firebase.transactions.length > 0 ? firebase.transactions : localTransactions;

  const totalsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of CATEGORIES) map[c] = 0;
    for (const t of source) {
      const cat = t.categoria ?? t.category ?? 'Outros';
      const val = t.valor ?? t.value ?? 0;
      if (!map[cat]) map[cat] = 0;
      map[cat] += val;
    }
    return CATEGORIES.map((c) => ({ name: c, value: map[c] }));
  }, [source]);

  const pieData = useMemo(() => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0'];
    return totalsByCategory.map((item, idx) => ({ name: item.name, population: item.value, color: colors[idx % colors.length], legendFontColor: '#333', legendFontSize: 12 }));
  }, [totalsByCategory]);

  const barData = useMemo(() => {
    return {
      labels: totalsByCategory.map((t) => t.name),
      datasets: [{ data: totalsByCategory.map((t) => Number(t.value.toFixed(2))) }],
    };
  }, [totalsByCategory]);

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Gastos por categoria (Pizza)</ThemedText>
        <View style={{ marginTop: 12 }}>
          <PieChart data={pieData} width={screenWidth} height={220} chartConfig={{ color: () => '#333' }} accessor="population" backgroundColor="transparent" paddingLeft="15" />
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Totais por categoria (Barra)</ThemedText>
        <View style={{ marginTop: 12 }}>
          <BarChart
            data={barData}
            width={screenWidth}
            height={260}
            yAxisLabel=""
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(10,126,164,${opacity})`,
              labelColor: () => '#333',
            }}
            verticalLabelRotation={30}
          />
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
