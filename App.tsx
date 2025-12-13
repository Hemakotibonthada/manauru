/**
 * Main App Component
 * Entry point with navigation and auth handling
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { HomeScreen } from './screens/HomeScreen';

// Hooks
import { useAuthInit, useAuth } from './hooks/useAuth';
import { colors } from './styles/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Problems') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.secondary,
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Mana Uru' }}
      />
      <Tab.Screen 
        name="Explore" 
        component={PlaceholderScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen 
        name="Problems" 
        component={PlaceholderScreen}
        options={{ title: 'Problems' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={PlaceholderScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PlaceholderScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Placeholder screen for tabs not yet implemented
function PlaceholderScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="construct-outline" size={64} color={colors.text.disabled} />
    </View>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// App Stack
function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  // Initialize auth listener
  useAuthInit();
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        {isAuthenticated ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
}
