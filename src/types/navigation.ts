import type { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = {
  Home: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TasksStackParamList = {
  Tasks: undefined;
  TaskDetail: {
    taskId: string;
  };
};

export type VaultStackParamList = {
  Vault: undefined;
  VaultEditor: {
    itemId?: string;
  };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TasksTab: NavigatorScreenParams<TasksStackParamList>;
  VaultTab: NavigatorScreenParams<VaultStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  AppTabs: NavigatorScreenParams<AppTabParamList>;
};
