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
  HomeTab: undefined;
  TasksTab: undefined;
  VaultTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  AppTabs: undefined;
};
