#!/usr/bin/env bash
# build-apk.sh - for CI: initialize RN project, replace App.js and package.json, install deps, build release APK
set -e
WORKDIR="$PWD"
TMPDIR="$WORKDIR/build_temp"
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"
cd "$TMPDIR"

# init a new RN project (this will create android/)
npx react-native init SmrkiBuilder --version 0.72.0 --directory "$TMPDIR/project" --template react-native-template
cd project

# replace App.js and package.json from repo root (assumes repo root contains our App.js and package.json)
cp "$WORKDIR/App.js" ./App.js
cp "$WORKDIR/package.json" ./package.json

# install deps and build android release
npm install --legacy-peer-deps
cd android
./gradlew assembleRelease

# copy apk back
mkdir -p "$WORKDIR/artifacts"
cp app/build/outputs/apk/release/app-release.apk "$WORKDIR/artifacts/Smrki-app-release.apk" || true
echo "APK copied to artifacts/Smrki-app-release.apk"
