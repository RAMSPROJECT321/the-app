# AegisFlow Technical Plan

## Product Direction

AegisFlow is a personal productivity and secure-vault mobile application built on Expo, React Native, and TypeScript. The initial foundation is optimized for a premium single-user experience while preserving multi-user-ready API contracts so the backend can evolve without forcing a client rewrite.

## Architecture Decisions

- Use feature-first modules under `src/features` and reserve top-level folders for cross-cutting code.
- Keep screens thin: state selection, navigation, and event wiring only.
- Push side effects into `services`, transport into `api`, and state mutation into small domain-specific Zustand stores.
- Keep UI consistent through NativeWind plus a centralized design token system shared across navigation, components, and motion.
- Treat local storage as the primary read source and background sync as an enhancement layer.

## Google Sheets + Apps Script API Strategy

The mobile app talks only to Google Apps Script, never to Sheets directly.

### Endpoint Model

- `POST /tasks/list`
- `POST /tasks/upsert`
- `POST /tasks/delete`
- `POST /vault/list`
- `POST /vault/upsert`
- `POST /vault/delete`
- `POST /sync/pull`
- `POST /sync/push`
- `POST /health`

### Request Envelope

- `requestId`
- `userId`
- `deviceId`
- `lastSyncedAt`
- `payload`

### Response Envelope

- `success`
- `data`
- `serverTime`
- `syncToken`
- `error`

### Data Model Strategy

- Keep rows flat and include `id`, `userId`, `updatedAt`, `deletedAt`, `version`, and `syncState`.
- Use JSON strings only for nested fields that cannot be flattened reasonably.
- Use soft deletes to preserve sync safety.
- Use `updatedAt` plus `version` for optimistic conflict handling.

## State Management Flow

- `useTasksStore` owns task entities, ordering, filters, optimistic mutations, and task detail mutations.
- `useVaultStore` owns vault metadata, secure references, and local save/delete flows.
- `useSyncStore` owns queued mutations, sync status, and retry metadata.
- `useSessionStore` owns device identity, vault lock state, and idle timeout behavior.
- `useThemeStore` owns theme preference and integrates with NativeWind color-scheme control.
- `useConnectivityStore` owns online/offline state for sync orchestration.

## Reusable UI Strategy

Shared UI components live in `src/components` and expose typed variants:

- `Screen`
- `AppText`
- `AppButton`
- `IconButton`
- `Card`
- `TextField`
- `SearchInput`
- `SectionHeader`
- `Chip`
- `StatusBadge`
- `EmptyState`
- `ErrorState`
- `SkeletonBlock`
- `VoiceFab`

Feature-specific cards and compositions stay inside their feature modules until reused elsewhere.

## Performance Strategy

- Functional components only.
- `memo` for stable list cards and dense presentation components.
- `useCallback` only for memoized child props and list handlers.
- `useMemo` for expensive filters, selectors, and dashboard summaries.
- `useDeferredValue` for search-driven list filtering.
- `FlatList` for any growing collection.
- Animated micro-interactions handled by Reanimated to avoid JS-thread-heavy transitions.
- Avoid broad Zustand subscriptions and read only the state each component needs.

## Security Strategy

- Use `expo-local-authentication` to gate vault access with biometrics.
- Store vault secrets separately from visible metadata using `expo-secure-store`.
- Avoid persisting revealed plaintext values in global state.
- Keep copied values ephemeral and route all copy actions through a single service boundary.
- Treat cloud vault sync as unsafe until client-side encryption key management is defined.

## Offline And Caching Strategy

- Persist local state first.
- Queue mutations in `useSyncStore`.
- Retry background sync on app foreground and network reconnect.
- Mark every entity as `synced`, `pending`, `failed`, or `local_only`.
- Keep attachments local-only for now and warn users before adding them.

## Future Scalability

- Preserve repository-like service boundaries so Sheets can be replaced later.
- Reserve `userId`, `deviceId`, `syncToken`, and `version` in all contracts.
- Keep authentication behind an `AuthService` boundary for future Google Sign-In, passkeys, or a custom backend.
- Design attachments and vault sync so they can migrate to Drive or a real object store without screen rewrites.
