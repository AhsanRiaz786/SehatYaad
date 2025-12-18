import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Icon from '../components/Icon';
import { colors, typography } from '../utils/theme';

import {
    HomeScreen,
    InsightsScreen,
    SettingsScreen,
    AddMedicationScreen,
    MedicationDetailScreen,
    OnboardingScreen,
    SplashScreen,
    CameraScreen,
    PrescriptionReviewScreen,
} from '../screens';
import DoseHistoryScreen from '../screens/DoseHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Insights') {
                        iconName = 'insights';
                    } else if (route.name === 'Settings') {
                        iconName = 'settings';
                    } else {
                        iconName = 'help-circle';
                    }

                    return <Icon name={iconName} size={size} color={color} active={focused} />;
                },
                tabBarActiveTintColor: colors.primary.forestGreen,
                tabBarInactiveTintColor: colors.neutral.gray500,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: colors.neutral.gray200,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: colors.neutral.black,
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Insights" component={InsightsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Splash">
                <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                <Stack.Screen
                    name="AddMedication"
                    component={AddMedicationScreen}
                    options={{
                        headerShown: false,
                        presentation: 'modal'
                    }}
                />
                <Stack.Screen
                    name="MedicationDetail"
                    component={MedicationDetailScreen}
                    options={{
                        headerTitle: 'Medication Details',
                        headerTintColor: colors.primary.forestGreen,
                    }}
                />
                <Stack.Screen
                    name="DoseHistory"
                    component={DoseHistoryScreen}
                    options={{
                        headerTitle: 'Dose History',
                        headerTintColor: colors.primary.forestGreen,
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="Camera"
                    component={CameraScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="PrescriptionReview"
                    component={PrescriptionReviewScreen}
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
