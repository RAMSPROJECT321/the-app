export type HomeStackParamList = {
  Home: undefined;
};

export type TasksStackParamList = {
  Tasks: undefined;
  TaskDetail: {
    taskId: string;
  };
};

export type VaultStackParamList = {
  Vault: undefined;
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
  AppTabs: undefined;
};
