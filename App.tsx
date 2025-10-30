import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from './src/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Speedometer App</Text>
      <Text style={styles.subtitle}>PHASE 1: Setup Complete ✅</Text>
      <Text style={styles.info}>TypeScript Strict Mode Enabled</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.success,
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
