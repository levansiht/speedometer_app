import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SpeedometerScreen } from './src/components';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { TripProvider } from './src/contexts/TripContext';
import { SpeedAlertProvider } from './src/contexts/SpeedAlertContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TripProvider>
          <SpeedAlertProvider>
            <View style={styles.container}>
              <SpeedometerScreen />
              <StatusBar style="auto" />
            </View>
          </SpeedAlertProvider>
        </TripProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
