# Deployment Guide for Mana Uru

## 🚀 Quick Deployment Steps

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project created: `mana-uru-001`
3. Firebase Authentication enabled
4. Firestore Database created
5. Firebase Storage enabled
6. Firebase Hosting enabled

### 1. Firebase Authentication Setup

```bash
# Login to Firebase
firebase login

# Select your project
firebase use mana-uru-001
```

Enable Authentication methods in Firebase Console:
- Email/Password authentication
- (Optional) Google Sign-in
- (Optional) Phone authentication

### 2. Deploy Firestore Rules and Indexes

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 3. Deploy Storage Rules

```bash
# Deploy Storage security rules
firebase deploy --only storage
```

### 4. Build and Deploy Web Application

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build the web version
npx expo export:web

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: https://mana-uru-001.web.app

### 5. Build Android APK

```bash
# For development build
npx expo run:android

# For production build with EAS
npm install -g eas-cli
eas build --platform android
```

### 6. Build iOS App

```bash
# For development build (requires Mac)
npx expo run:ios

# For production build with EAS
eas build --platform ios
```

## 📱 Firebase Console Configuration

### Step 1: Enable Services

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `mana-uru-001`
3. Enable the following services:
   - Authentication → Email/Password
   - Firestore Database → Production mode
   - Storage → Production mode
   - Hosting
   - Analytics

### Step 2: Configure App

1. **Web App**:
   - Already configured in `src/config/firebase.ts`
   
2. **Android App**:
   - Package name: `com.circuvent.manauru`
   - `google-services.json` already added to project

3. **iOS App** (if building for iOS):
   - Bundle ID: `com.circuvent.manauru`
   - Download `GoogleService-Info.plist`
   - Add to project root

### Step 3: Set up Security Rules

Security rules are already defined in:
- `firestore.rules` - Database security
- `storage.rules` - File storage security

Deploy with:
```bash
firebase deploy --only firestore:rules,storage
```

## 🌐 Hosting Configuration

### Custom Domain Setup (Optional)

1. Go to Firebase Console → Hosting
2. Add custom domain
3. Follow DNS configuration steps
4. SSL certificate is automatically provisioned

### Environment Variables

Create `.env` file (not committed to git):
```env
FIREBASE_API_KEY=AIzaSyBrRenhABh93uibH2ApJSFAz8ICYMyp4Yc
FIREBASE_AUTH_DOMAIN=mana-uru-001.firebaseapp.com
FIREBASE_PROJECT_ID=mana-uru-001
FIREBASE_STORAGE_BUCKET=mana-uru-001.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=693249416656
FIREBASE_APP_ID=1:693249416656:web:a383e02cdc99ed5ebcadd5
FIREBASE_MEASUREMENT_ID=G-Z4NNJQ8HTD
```

## 📊 Analytics Setup

Firebase Analytics is automatically enabled. View analytics at:
https://console.firebase.google.com/project/mana-uru-001/analytics

## 🔔 Push Notifications (Optional)

### Setup Firebase Cloud Messaging

1. Go to Firebase Console → Cloud Messaging
2. Add server key to your backend
3. Configure notification permissions in app

## 🧪 Testing Before Production

### Test on Expo Go
```bash
npm start
# Scan QR code with Expo Go app
```

### Test Web Version Locally
```bash
npm run web
# Opens at http://localhost:19006
```

### Test with Firebase Emulators
```bash
# Start emulators
firebase emulators:start

# Access:
# - Firestore: http://localhost:8080
# - Auth: http://localhost:9099
# - Storage: http://localhost:9199
# - Hosting: http://localhost:5000
# - Emulator UI: http://localhost:4000
```

## 🔒 Security Checklist

- [x] Firestore security rules deployed
- [x] Storage security rules deployed
- [x] Environment variables configured
- [x] API keys restricted (Firebase Console → Settings)
- [x] Email verification enabled
- [x] Password requirements enforced
- [x] Input validation implemented
- [x] XSS prevention in place

## 📈 Monitoring

### Set up Error Tracking

1. Enable Crashlytics in Firebase Console
2. Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics"
    ]
  }
}
```

### Performance Monitoring

```bash
# Enable in Firebase Console
Firebase Console → Performance
```

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci --legacy-peer-deps
      - run: npx expo export:web
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: mana-uru-001
```

## 🆘 Troubleshooting

### Issue: Dependencies not installing
```bash
npm install --legacy-peer-deps --force
```

### Issue: Expo build fails
```bash
# Clear cache
npx expo start -c
rm -rf node_modules
npm install --legacy-peer-deps
```

### Issue: Firebase deploy fails
```bash
# Re-authenticate
firebase logout
firebase login
firebase use mana-uru-001
```

### Issue: Android build fails
```bash
# Clean gradle
cd android
./gradlew clean
cd ..
```

## 📞 Support

For deployment issues:
- Check Firebase Console for errors
- Review build logs
- Check GitHub issues
- Contact: support@manauru.com

## ✅ Post-Deployment Checklist

1. [ ] Web app accessible at Firebase URL
2. [ ] Authentication working (sign up/sign in)
3. [ ] Posts can be created and viewed
4. [ ] Images upload successfully
5. [ ] Firestore data saving correctly
6. [ ] Analytics tracking events
7. [ ] No console errors in browser
8. [ ] Mobile responsive design working
9. [ ] Security rules validated
10. [ ] Performance metrics acceptable

## 🎉 Success!

Your Mana Uru application is now live at:
**https://mana-uru-001.web.app**

Share with your village community and start connecting! 🏘️
