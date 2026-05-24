# Firebase Setup

## 1. Create the Firebase project

In Firebase Console:

1. Create a new project.
2. Add a new **Web App** to the project.
3. Copy the config values from the Firebase app settings.

## 2. Enable products

Enable these Firebase products:

1. `Authentication`
2. `Cloud Firestore`

Authentication provider for this app:

- `Email/Password`

## 3. Put the config into `app.json`

Update `expo.extra` in [app.json](/Users/rajatjangid/Desktop/the-app/app.json):

```json
{
  "expo": {
    "extra": {
      "appName": "AegisFlow",
      "firebaseApiKey": "YOUR_API_KEY",
      "firebaseAuthDomain": "YOUR_PROJECT.firebaseapp.com",
      "firebaseProjectId": "YOUR_PROJECT_ID",
      "firebaseStorageBucket": "OPTIONAL_CAN_STAY_EMPTY",
      "firebaseMessagingSenderId": "YOUR_SENDER_ID",
      "firebaseAppId": "YOUR_APP_ID",
      "firebaseMeasurementId": "OPTIONAL"
    }
  }
}
```

Get these values from Firebase Console:

1. Open `Project settings`.
2. In `General`, scroll to `Your apps`.
3. Open your registered `Web app`.
4. In `SDK setup and configuration`, copy the config object.

Map the Firebase config fields to `app.json` like this:

- `apiKey` -> `firebaseApiKey`
- `authDomain` -> `firebaseAuthDomain`
- `projectId` -> `firebaseProjectId`
- `messagingSenderId` -> `firebaseMessagingSenderId`
- `appId` -> `firebaseAppId`
- `storageBucket` -> `firebaseStorageBucket` (optional in the current app)
- `measurementId` -> `firebaseMeasurementId` (optional)

For your current Firebase project, these values are already placed in [app.json](/Users/rajatjangid/Desktop/the-app/app.json):

- `firebaseApiKey`: `AIzaSyAAXrDyWGOfQFdemfWlHeptBmV1v6l1_S0`
- `firebaseAuthDomain`: `theapp-a6775.firebaseapp.com`
- `firebaseProjectId`: `theapp-a6775`
- `firebaseStorageBucket`: `theapp-a6775.firebasestorage.app`
- `firebaseMessagingSenderId`: `439465163758`
- `firebaseAppId`: `1:439465163758:android:3450f10fa39e848db7ecff`

Your Android package name in [app.json](/Users/rajatjangid/Desktop/the-app/app.json) is also aligned to your Firebase Android app:

- `android.package`: `com.rajat.theapp`

## 4. Apply security rules

Deploy [firestore.rules](/Users/rajatjangid/Desktop/the-app/firestore.rules) to your Firebase project.

The rule locks data to the authenticated user:

- Firestore: user can only access `users/{uid}/**`

## 5. Firestore collections

The app creates data on demand under:

- `users/{uid}/tasks/{taskId}`
- `users/{uid}/vaultItems/{vaultItemId}`

You do not need to pre-create schema or columns.

## 6. Rebuild the app

After updating Firebase config:

```bash
npm run android
```

or

```bash
npm run ios
```

Restarting Metro alone is not enough if native config/plugins changed in your environment.

## 7. Create the first user

Use the in-app register screen, or create a user manually in Firebase Authentication.

## Important behavior notes

- Tasks sync across devices for the same Firebase user.
- Vault metadata syncs across devices for the same Firebase user.
- Plaintext vault secrets remain on-device in SecureStore.
- Task attachments stay on-device only.
- If the same user signs in again on the same device, local attachment paths are reused if the file still exists.
- If the file is gone or the app is removed, those local attachments are lost.
- Offline document edits are handled by Firestore.
