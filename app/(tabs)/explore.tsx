import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const PRIMARY_10 = 'rgba(10, 126, 164, 0.1)';

export default function TabTwoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <ThemedView style={styles.heroSection}>
        <ThemedText type="title" style={styles.heroTitle}>
          Money Control
        </ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Controle seus gastos de forma simples e visual no celular.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">O que você pode fazer</ThemedText>
        <View style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Registrar gastos</ThemedText>
          <ThemedText>Adicione valor, categoria e data.</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Editar e excluir</ThemedText>
          <ThemedText>Atualize ou remova gastos já registrados.</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Filtrar por período</ThemedText>
          <ThemedText>Veja gastos de hoje, da semana ou do mês.</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <ThemedText type="defaultSemiBold">• Total de despesas</ThemedText>
          <ThemedText>Consulte o total gasto no período selecionado.</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Como usar</ThemedText>
        <ThemedText style={styles.stepText}>1. Abra a aba "Gastos".</ThemedText>
        <ThemedText style={styles.stepText}>2. Insira valor, categoria e data.</ThemedText>
        <ThemedText style={styles.stepText}>3. Use os botões para editar ou excluir.</ThemedText>
        <ThemedText style={styles.stepText}>4. Selecione o período para filtrar a lista.</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  heroSection: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: PRIMARY_10,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  featureItem: {
    marginTop: 12,
  },
  stepText: {
    marginTop: 8,
  },
});
