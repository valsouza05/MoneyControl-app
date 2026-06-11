import { StyleSheet, Text, View } from 'react-native';

export function MoneyIcon() {
  return (
    <View style={styles.container}>
      <View style={styles.coin}>
        <Text style={styles.coinText}>💰</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coin: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(10, 126, 164, 0.3)',
  },
  coinText: {
    fontSize: 48,
  },
});
