import type { VaultCategory, VaultSyncMode } from "@/types/entities";

export interface DemoVaultSeed {
  id: string;
  title: string;
  category: VaultCategory;
  username?: string;
  url?: string;
  notes?: string;
  secret: string;
  isFavorite: boolean;
  syncMode: VaultSyncMode;
}

export const buildDemoVaultSeeds = (): DemoVaultSeed[] => [
  {
    id: "vault_openai",
    title: "OpenAI Platform",
    category: "api_key",
    username: "platform-bot",
    url: "https://platform.openai.com",
    notes: "Used for internal tooling experiments and test prompts.",
    secret: "sk-live-demo-1a2b3c4d5e6f",
    isFavorite: true,
    syncMode: "local_only_secure",
  },
  {
    id: "vault_github",
    title: "GitHub Personal Access Token",
    category: "password",
    username: "rajat",
    url: "https://github.com/settings/tokens",
    notes: "Regenerate after device rotation.",
    secret: "ghp_demo_7845securetoken",
    isFavorite: false,
    syncMode: "local_only_secure",
  },
  {
    id: "vault_private_note",
    title: "Recovery Phrase Notes",
    category: "secure_text",
    notes: "Split across two devices. Keep local only until encryption sync lands.",
    secret: "orbit lunar maple river ember cedar",
    isFavorite: false,
    syncMode: "local_only_secure",
  },
];
