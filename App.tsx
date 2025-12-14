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
import { View, Text, ActivityIndicator, LogBox, Platform } from 'react-native';

// Theme Provider
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Suppress warnings from third-party libraries  
LogBox.ignoreLogs([
  'shadow*',
  'pointerEvents', 
  'text node cannot be a child',
  'ViewPropTypes',
  'ColorPropType',
  'Unexpected text node',
  'Require cycle',
  'resizeMode',
  'tintColor',
  'Failed to decode downloaded font',
  'OTS parsing error',
]);

// Override console.warn to filter out specific deprecation warnings
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const msg = args.join(' ');
  if (
    msg.includes('shadow*') ||
    msg.includes('pointerEvents is deprecated') ||
    msg.includes('text node cannot be a child') ||
    msg.includes('Unexpected text node') ||
    msg.includes('resizeMode is deprecated') ||
    msg.includes('tintColor is deprecated') ||
    msg.includes('Failed to decode downloaded font') ||
    msg.includes('OTS parsing error')
  ) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const msg = args.join(' ');
  if (
    msg.includes('shadow*') ||
    msg.includes('pointerEvents is deprecated') ||
    msg.includes('text node cannot be a child') ||
    msg.includes('Failed to decode downloaded font') ||
    msg.includes('OTS parsing error')
  ) {
    return; // Suppress these errors
  }
  originalError.apply(console, args);
};

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { ProblemsScreen } from './src/screens/ProblemsScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { CreatePostScreen } from './src/screens/CreatePostScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { VillageDetailScreen } from './src/screens/VillageDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { FundraisersScreen } from './src/screens/FundraisersScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import PeopleScreen from './src/screens/PeopleScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import RoleManagementScreen from './src/screens/RoleManagementScreen';
import SmartThingsScreen from './src/screens/SmartThingsScreen';
import ContentModerationScreen from './src/screens/ContentModerationScreen';
import FamilyTreeScreen from './src/screens/FamilyTreeScreen';
import AddFamilyMemberScreen from './src/screens/AddFamilyMemberScreen';
import FamilyMemberDetailScreen from './src/screens/FamilyMemberDetailScreen';
import ShopsListScreen from './src/screens/ShopsListScreen';
import RegisterShopScreen from './src/screens/RegisterShopScreen';
import ShopDetailScreen from './src/screens/ShopDetailScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MyShopsScreen from './src/screens/MyShopsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import ManageProductsScreen from './src/screens/ManageProductsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';

// Placeholder for unimplemented admin screens
function PlaceholderAdminScreen({ title }: { title: string }) {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: themedColors.background.default }}>
      <Ionicons name="construct-outline" size={64} color={themedColors.text.disabled} />
      <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: themedColors.text.primary }}>
        {title}
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: themedColors.text.secondary, textAlign: 'center' }}>
        This feature is coming soon
      </Text>
    </View>
  );
}

// Create separate components for each placeholder screen
const UserManagementScreen = () => <PlaceholderAdminScreen title="User Management" />;
const AnalyticsScreen = () => <PlaceholderAdminScreen title="Analytics Dashboard" />;
const AuditLogsScreen = () => <PlaceholderAdminScreen title="Audit Logs" />;
const VillageManagementScreen = () => <PlaceholderAdminScreen title="Village Management" />;

// Hooks
import { useAuthInit, useAuth } from './src/hooks/useAuth';
import { colors, getThemedColors } from './src/styles/theme';

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
          } else if (route.name === 'Shops') {
            iconName = focused ? 'storefront' : 'storefront-outline';
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
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen 
        name="Shops" 
        component={ShopsListScreen}
        options={{ title: 'Shops' }}
      />
      <Tab.Screen 
        name="Problems" 
        component={ProblemsScreen}
        options={{ title: 'Problems' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
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
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{ 
          title: 'Post',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="VillageDetail" 
        component={VillageDetailScreen}
        options={{ 
          title: 'Village',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          title: 'Notifications',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Events" 
        component={EventsScreen}
        options={{ 
          title: 'Events',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Fundraisers" 
        component={FundraisersScreen}
        options={{ 
          title: 'Fundraisers',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Groups" 
        component={GroupsScreen}
        options={{ 
          title: 'Groups',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ 
          title: 'Group',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ 
          title: 'Create Group',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="People" 
        component={PeopleScreen}
        options={{ 
          title: 'People',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ 
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ 
          title: 'Admin Dashboard',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="RoleManagement" 
        component={RoleManagementScreen}
        options={{ 
          title: 'Role Management',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="SmartThings" 
        component={SmartThingsScreen}
        options={{ 
          title: 'Smart Things',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ContentModeration" 
        component={ContentModerationScreen}
        options={{ 
          title: 'Content Moderation',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{ 
          title: 'User Management',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ 
          title: 'Analytics',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="AuditLogs" 
        component={AuditLogsScreen}
        options={{ 
          title: 'Audit Logs',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="VillageManagement" 
        component={VillageManagementScreen}
        options={{ 
          title: 'Village Management',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="FamilyTree" 
        component={FamilyTreeScreen}
        options={{ 
          title: 'Family Tree',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddFamilyMember" 
        // @ts-expect-error - React Navigation type compatibility
        component={AddFamilyMemberScreen}
        options={{ 
          title: 'Add Family Member',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="FamilyMemberDetail" 
        // @ts-expect-error - React Navigation type compatibility
        component={FamilyMemberDetailScreen}
        options={{ 
          title: 'Member Details',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ShopsList" 
        component={ShopsListScreen}
        options={{ 
          title: 'Shops & Marketplace',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="RegisterShop" 
        component={RegisterShopScreen}
        options={{ 
          title: 'Register Shop',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ShopDetail" 
        component={ShopDetailScreen}
        options={{ 
          title: 'Shop',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ 
          title: 'My Cart',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ 
          title: 'My Orders',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="MyShops" 
        component={MyShopsScreen}
        options={{ 
          title: 'My Shops',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ 
          title: 'Product',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ManageProducts" 
        component={ManageProductsScreen}
        options={{ 
          title: 'Manage Products',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ 
          title: 'Checkout',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ 
          title: 'Order Details',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  // Initialize auth listener
  useAuthInit();
  const { isAuthenticated, loading } = useAuth();
  const { isDark } = useTheme();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#FFFFFF' }}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        {isAuthenticated ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
