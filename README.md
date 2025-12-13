# Mana Uru (మన ఊరు - Our Village)

A comprehensive cross-platform community application designed specifically for Indian villages, built with React Native (Expo) and Firebase.

## 🌟 Features

### Core Features
- **Social Feed**: Community posts with like, comment, and share functionality
- **Village Pages**: Follow and interact with your village community
- **Fundraising**: Raise and contribute to community projects
- **Chat & Groups**: Direct messaging and group chats for community discussions
- **Problem Reporting**: Report and track village infrastructure issues
- **Smart Features (Smartfy)**: Digital transformation initiatives for villages
- **Events**: Create and manage village events and festivals
- **Multi-language Support**: Regional language support for better accessibility

### Key Highlights
- 📱 Cross-platform (iOS, Android, Web)
- 🔥 Real-time updates with Firebase
- 🔒 Enterprise-level security
- 📸 Media upload support (images & videos)
- 📍 Location-based features
- 🌓 Modern UI/UX design
- 💬 Real-time chat messaging
- 📊 Analytics and insights

## 🏗️ Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Backend**: Firebase (Authentication, Firestore, Storage, Analytics)
- **UI Components**: Custom components with React Native Paper
- **Form Handling**: Formik + Yup
- **TypeScript**: Fully typed codebase
- **Deployment**: Firebase Hosting

## 📁 Project Structure

```
mana-uru/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/         # App screens
│   ├── services/        # Firebase services
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript type definitions
│   ├── styles/          # Theme and styling
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── assets/              # Images, fonts, icons
├── App.tsx             # Main app component
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
├── firebase.json       # Firebase configuration
├── firestore.rules     # Firestore security rules
└── storage.rules       # Storage security rules
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hemakotibonthada/manauru.git
   cd manauru
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/config/firebase.ts` with your Firebase config
   - Place `google-services.json` in the root directory for Android
   - Place `GoogleService-Info.plist` in the root directory for iOS

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on specific platform**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

## 📱 Building for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

### Web
```bash
npm run build:web
```

## 🔥 Firebase Deployment

### Deploy Web App
```bash
npm run deploy
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Deploy All
```bash
firebase deploy
```

## 🔐 Security

The application implements enterprise-level security:

- **Authentication**: Firebase Authentication with email/password
- **Authorization**: Role-based access control (User, Admin, Moderator)
- **Data Security**: Firestore security rules for all collections
- **Storage Security**: Firebase Storage rules with file type and size validation
- **Input Validation**: Client-side validation using Yup schemas
- **XSS Prevention**: Sanitized user inputs
- **HTTPS Only**: All communications encrypted

## 🗃️ Database Structure

### Collections

- **users**: User profiles and authentication data
- **villages**: Village information and metadata
- **posts**: Community posts with media
- **comments**: Post comments (subcollection)
- **fundraisers**: Fundraising campaigns
- **problems**: Reported village problems
- **chats**: Chat conversations
- **messages**: Chat messages (subcollection)
- **groups**: Community groups
- **events**: Village events
- **smartFeatures**: Smart village initiatives
- **notifications**: User notifications

## 🎨 Design System

The app follows a consistent design system:

- **Primary Color**: Orange (#FF6B35)
- **Secondary Color**: Blue (#004E89)
- **Typography**: Consistent font scales
- **Spacing**: 4px base unit
- **Border Radius**: Consistent rounded corners
- **Shadows**: Elevation-based shadows

## 🌍 Internationalization

Currently supports:
- English
- Telugu (తెలుగు)
- Hindi (हिन्दी)

## 📊 Analytics

Firebase Analytics tracks:
- User engagement
- Feature usage
- Screen views
- Custom events
- Crash reports

## 🧪 Testing

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Hema Koti Bonthada** - Initial work - [GitHub](https://github.com/Hemakotibonthada)

## 🙏 Acknowledgments

- Inspired by the need for digital transformation in rural India
- Built for village communities to connect and collaborate
- Dedicated to making technology accessible to all

## 📞 Support

For support, email support@manauru.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Voice messaging in chat
- [ ] Video calls
- [ ] Payment gateway integration
- [ ] Offline mode support
- [ ] AI-powered content moderation
- [ ] Advanced analytics dashboard
- [ ] Government scheme integration
- [ ] Local business directory
- [ ] Weather updates
- [ ] Agriculture tips and market prices

---

Made with ❤️ for Indian Villages
