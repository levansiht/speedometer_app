import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SpeedometerScreen } from './src/components';

export default function App() {
  return (
    <View style={styles.container}>
      <SpeedometerScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
