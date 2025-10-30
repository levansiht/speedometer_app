import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { TripProvider } from './src/contexts/TripContext';
import { SpeedAlertProvider } from './src/contexts/SpeedAlertContext';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TripProvider>
          <SpeedAlertProvider>
            <NavigationContainer>
              <View style={styles.container}>
                <BottomTabNavigator />
                <StatusBar style="auto" />
              </View>
            </NavigationContainer>
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
