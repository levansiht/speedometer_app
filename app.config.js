module.exports = {
  expo: {
    name: 'speedometer_app',
    slug: 'speedometer_app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.placeholder.appid',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Speedometer cần truy cập vị trí của bạn để hiển thị tốc độ và ghi lại hành trình.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Speedometer cần truy cập vị trí của bạn ngay cả khi ứng dụng ở chế độ nền để theo dõi hành trình.',
        NSLocationAlwaysUsageDescription:
          'Speedometer cần truy cập vị trí của bạn để theo dõi hành trình ngay cả khi ứng dụng ở chế độ nền.',
        UIBackgroundModes: ['location', 'remote-notification'],
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: 'com.placeholder.appid',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
        'WAKE_LOCK',
        'RECEIVE_BOOT_COMPLETED',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-sqlite',
      [
        'expo-notifications',
        {
          color: '#4CAF50',
        },
      ],
    ],
  },
};
