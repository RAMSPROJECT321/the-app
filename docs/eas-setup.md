# EAS Build And Release Setup

## Goal

Use one production-grade release pipeline with EAS, while keeping local testing fast and cheap:

- `expo run:android` for daily debug development
- `eas build --local` for local packaged builds
- `eas build` for cloud release builds
- `eas submit` for Play Store submission

## Account Safety

Your current Expo login on this machine is global. Do not switch the company account out if you want to avoid touching it.

Use a project-specific `EXPO_TOKEN` from the new Expo account instead. Expo documents that:

- `EXPO_TOKEN` can authenticate EAS CLI commands
- `EXPO_TOKEN` takes precedence over `eas login`

That means this project can use the new account without changing the existing company login session.

## One-Time Setup

### 1. Create a new Expo account

Open a private/incognito browser window and create a new Expo account:

- https://expo.dev/signup

Do not use the company account for this app.

### 2. Create a personal access token

While logged into the new Expo account, create a personal access token here:

- https://expo.dev/settings/access-tokens

Give it a clear name such as `the-app-local-machine`.

### 3. Use the token only for this project

In a terminal opened at this project root:

```bash
export EXPO_TOKEN=your_new_expo_token
```

Verify the active Expo identity for this terminal:

```bash
npm run eas:whoami
```

If the username shown is the new Expo account, this project is isolated correctly.

### 4. Initialize the EAS project

Run:

```bash
npm run eas:init
```

This will link the repo to the new Expo account and create the EAS project association for this app.

Important:

- run this only with the new account token active
- this is the step that determines which Expo account owns the EAS project

### 5. Create Android managed credentials

Run the first production cloud build:

```bash
npm run android:release:cloud
```

Let EAS generate and manage the Android upload keystore.

### 6. Back up the credentials once

After EAS creates the credentials, download a backup:

```bash
npm run eas:credentials
```

Use the download option for Android credentials and store the backup securely outside the repo.

## Build Profiles

### `local-debug`

Use when you want a debug-style build through EAS locally:

```bash
npm run android:debug:local
```

This uses the debug Gradle task on your machine.

### `preview`

Use when you want an installable APK for testing without using cloud quota:

```bash
npm run android:preview:local
```

Cloud version:

```bash
npm run android:preview:cloud
```

### `production`

Use when you want the Play Store format (`.aab`):

Local:

```bash
npm run android:release:local
```

Cloud:

```bash
npm run android:release:cloud
```

## Submission Flow

### Internal track

```bash
npm run android:submit:internal
```

### Production track

```bash
npm run android:submit:production
```

Important:

- Google Play requires the first upload to be manual before API-based submit works
- after that, `eas submit` can handle later uploads

## Daily Workflow

### Fastest development loop

```bash
npm run android:dev
```

### Local installable QA build

```bash
npm run android:preview:local
```

### Final production build

```bash
npm run android:release:cloud
```

### Submit to Play

```bash
npm run android:submit:production
```

## Future Machine Setup

On a different machine:

1. clone the repo
2. install dependencies
3. export the same `EXPO_TOKEN` for the new Expo account
4. run `npm run eas:whoami`
5. run local or cloud EAS builds

No global Expo account switching is required if you use the token approach.
