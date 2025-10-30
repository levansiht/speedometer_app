import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SpeedometerScreen } from '../components/SpeedometerScreen';
import { TripHistoryScreen } from '../components/TripHistoryScreen';
import { SpeedAlertSettings } from '../components/SpeedAlertSettings';
import { MapScreen } from '../components/MapScreen';
import { CustomTabBar } from './CustomTabBar';

export type BottomTabParamList = {
  Home: undefined;
  History: undefined;
  Map: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={SpeedometerScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={TripHistoryScreen}
        options={{
          tabBarLabel: 'Lịch sử',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Bản đồ',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SpeedAlertSettings}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
