import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Home, ListTodo, Settings, ShieldEllipsis } from "lucide-react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { LoginScreen } from "@/features/auth/screens/login-screen";
import { RegisterScreen } from "@/features/auth/screens/register-screen";
import { ForgotPasswordScreen } from "@/features/auth/screens/forgot-password-screen";
import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { SettingsScreen } from "@/features/settings/screens/settings-screen";
import { TaskDetailScreen } from "@/features/tasks/screens/task-detail-screen";
import { TasksScreen } from "@/features/tasks/screens/tasks-screen";
import { VaultScreen } from "@/features/vault/screens/vault-screen";
import { VaultEditorScreen } from "@/features/vault/screens/vault-editor-screen";
import { createNavigationTheme } from "@/navigation/navigation-theme";
import { useSessionStore } from "@/store/session-store";
import type {
  AppTabParamList,
  AuthStackParamList,
  HomeStackParamList,
  RootStackParamList,
  SettingsStackParamList,
  TasksStackParamList,
  VaultStackParamList,
} from "@/types/navigation";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();
const VaultStack = createNativeStackNavigator<VaultStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const tabBarStyle = {
  backgroundColor: "transparent",
  borderTopWidth: 0,
  elevation: 0,
  position: "absolute" as const,
  height: 86,
  paddingTop: 10,
  paddingBottom: 16,
};

const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={DashboardScreen} />
  </HomeStack.Navigator>
);

const TasksStackNavigator = () => (
  <TasksStack.Navigator screenOptions={{ headerShown: false }}>
    <TasksStack.Screen name="Tasks" component={TasksScreen} />
    <TasksStack.Screen name="TaskDetail" component={TaskDetailScreen} />
  </TasksStack.Navigator>
);

const VaultStackNavigator = () => (
  <VaultStack.Navigator screenOptions={{ headerShown: false }}>
    <VaultStack.Screen name="Vault" component={VaultScreen} />
    <VaultStack.Screen name="VaultEditor" component={VaultEditorScreen} />
  </VaultStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

const TabNavigator = () => {
  const { palette } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarLabelStyle: {
          fontFamily: "Manrope_700Bold",
          fontSize: 11,
        },
        tabBarBackground: () => <></>,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksStackNavigator}
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <ListTodo color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="VaultTab"
        component={VaultStackNavigator}
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => (
            <ShieldEllipsis color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { palette, resolvedTheme } = useAppTheme();
  const authStatus = useSessionStore((state) => state.authStatus);

  return (
    <NavigationContainer theme={createNavigationTheme(palette, resolvedTheme)}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {authStatus === "authenticated" ? (
          <RootStack.Screen name="AppTabs" component={TabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
