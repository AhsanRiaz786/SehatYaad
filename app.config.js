module.exports = {
  expo: {
    name: "SehatYaad",
    slug: "sehatyaad",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    extra: {
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || "http://10.7.40.68:8000",
    },
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.sehatyaad",
      infoPlist: {
        UIBackgroundModes: [
          "remote-notification"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "com.anonymous.sehatyaad"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#7209B7",
      androidMode: "default",
      androidCollapsedTitle: "{{unread_count}} medication reminders"
    },
    plugins: [
      "expo-sqlite",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#7209B7",
          sounds: [],
          androidMode: "default",
          androidCollapsedTitle: "Medication Reminders"
        }
      ],
      "expo-asset"
    ]
  }
};