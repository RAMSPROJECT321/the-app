# AegisFlow Technical Plan

## Architecture Summary

AegisFlow now uses a Firebase-first mobile architecture:

- `Firebase Auth` for email/password authentication
- `Cloud Firestore` for tasks and vault metadata
- `Expo SecureStore` for plaintext vault secrets on-device
- `Zustand` for app state, local attachment persistence, and UI state
- `NativeWind` and shared theme tokens for UI consistency

The app is local-first:

- Zustand rehydrates persisted task, vault, and sync state immediately on restart
- Firestore listeners restore cached documents and continue syncing in the background
- offline document changes are handled by Firestore automatically
- local attachment paths remain available on the same device while the underlying file still exists

## Data Model

### Firestore

- `users/{uid}/tasks/{taskId}`
- `users/{uid}/vaultItems/{vaultItemId}`

### Vault Security

Vault items sync only metadata:

- title
- category
- username
- url
- notes
- masked secret preview
- favorite state

Plaintext secrets are not stored in Firestore. They remain in SecureStore using a stable local key derived from `uid:itemId`.

## Runtime Flow

### Authentication

1. App boot hydrates persisted local state.
2. Firebase Auth restores the last signed-in user.
3. If authenticated, the app opens the main shell and starts Firestore listeners.
4. If unauthenticated, the app opens the auth stack.

### Tasks

- CRUD actions update Zustand immediately
- writes are sent directly to Firestore
- Firestore offline persistence keeps writes queued when offline
- query listeners refresh task state from cache/server

### Attachments

1. User picks an image from the device.
2. The file is copied into the app document directory.
3. Attachment metadata and local path are persisted on-device with the task store.
4. On restart or same-device sign-in, the app reuses that local path if the file still exists.
5. Missing files are pruned from the local task state.

### Vault

- metadata is written to Firestore
- secret value is written to SecureStore
- revealing/copying a secret always reads from SecureStore on the current device

## Key Boundaries

- `src/services/auth/` owns authentication flows
- `src/services/firebase/` owns Firebase initialization
- `src/services/repositories/` owns Firestore persistence
- `src/services/sync/` owns realtime listeners and foreground sync triggers
- `src/store/` owns app state and optimistic updates
- `src/features/` owns feature-specific UI and interaction flow

## Offline Strategy

- Firestore handles offline reads and document writes
- Zustand persistence keeps UI state warm across restart
- task attachments remain device-local and survive while the copied local file survives
- reconnect and app foreground both trigger sync attempts

## Future Extensions

- add social login providers to Firebase Auth
- add shared workspaces or team data by introducing scoped collections
- add client-side encryption before cloud sync if cross-device secret recovery is needed
- add push notifications or server-side workflows through Cloud Functions when required
