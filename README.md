# SmrkiDailyHelper - Ready repo
This repository contains a React Native App.js and helper scripts to produce an Android APK via CI (GitHub Actions).

What I created for you:
- `App.js` — cleaned React Native app implementing BLE scanning, schedules, and local notifications.
- `package.json` — dependencies list matching React Native 0.72.
- `build-apk.sh` / `build-apk.bat` — CI/local scripts to initialize a RN project on runner and build an APK.
- `.github/workflows/build-android.yml` — GitHub Actions workflow to build the APK automatically when you push to `main` or `master`. The produced APK will be uploaded as an artifact.

How to get an APK with minimal effort (recommended):
1. Create a new GitHub repository and push the contents of this folder to `main` branch.
2. Wait for GitHub Actions to run (it will initialize a RN project on the runner, install deps and build the release APK).
3. When the workflow finishes, go to the workflow run and download the artifact `Smrki-android-apk` — it will contain `Smrki-app-release.apk`.

Notes and limitations:
- The workflow initializes a fresh React Native project on the runner, copies `App.js` and `package.json` from the repository, installs dependencies and builds the Android release. This avoids needing to check in `android/` to your repo.
- Building React Native apps in CI can take 10–20 minutes and requires the runner to have sufficient resources. GitHub Actions Ubuntu runner is used in the workflow.
- You will likely want to sign the APK with your keystore for Play Store distribution. The workflow produces an unsigned (or default debug-signed) release APK; I can help adapt the workflow to sign with your keystore (you will need to store the keystore securely in GitHub Secrets).

If you want, I can:
- Add more features or restore functionality from your original App.js (I only saw an abbreviated version in the zip).
- Help set up signing with your keystore in the workflow.
- Create a full Android Studio project here — but I cannot run Android SDK in this chat environment to produce the APK myself. I can automate it via CI as shown above.
