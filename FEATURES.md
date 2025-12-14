# Mana Uru - Complete Application Features & Implementation Guide

## 📱 Application Overview
Mana Uru (మన ఊరు - Our Village) is a comprehensive cross-platform community application designed for Indian villages, built with React Native (Expo) and Firebase.

---

## 🎯 Implemented Features

### 1. **Authentication & User Management**
- ✅ User Registration with Email/Password
- ✅ User Login/Logout
- ✅ Profile Management (Photo, Bio, Location)
- ✅ User Role System (USER, ADMIN, MODERATOR, VILLAGE_HEAD)
- ✅ Profile Editing
- ✅ Follow/Unfollow Users

**Screens:**
- `LoginScreen.tsx`
- `SignupScreen.tsx`
- `ProfileScreen.tsx`

**Services:**
- `authService.ts`

---

### 2. **Social Feed & Posts**
- ✅ Create Posts (Text, Images, Videos)
- ✅ Like/Unlike Posts
- ✅ Comment on Posts
- ✅ Share Posts
- ✅ Post Visibility Settings (Public, Village, Followers, Private)
- ✅ Image Upload (Multiple images up to 5)
- ✅ Post Tags
- ✅ Popular Posts (Trending by engagement)
- ✅ Post Detail View with Comments

**Screens:**
- `HomeScreen.tsx` - Main feed
- `CreatePostScreen.tsx` - Create new posts
- `PostDetailScreen.tsx` - View post with comments

**Components:**
- `PostCard.tsx` - Reusable post component

**Services:**
- `postService.ts` - Complete CRUD operations

---

### 3. **Village Discovery & Management**
- ✅ Browse All Villages
- ✅ Search Villages (by name, district, state)
- ✅ Follow/Unfollow Villages
- ✅ Village Detail Pages
- ✅ Village Posts Feed
- ✅ Village Members
- ✅ Nearby Villages (Location-based with Haversine calculation)
- ✅ Village Verification Badge

**Screens:**
- `ExploreScreen.tsx` - Browse and search villages
- `VillageDetailScreen.tsx` - Village details and content

**Services:**
- `villageService.ts` - Complete village management

**Features in ExploreScreen:**
- **Villages Tab**: Browse all villages with search
- **Popular Tab**: Trending posts by engagement score (Today/Week/Month/All Time filters)
- **Nearby Tab**: Location-based village discovery (50km radius)

---

### 4. **Problem Reporting & Tracking**
- ✅ Report Village Problems
- ✅ Problem Categories (Water, Electricity, Road, Sanitation, Health, Education, Safety)
- ✅ Severity Levels (Low, Medium, High, Critical)
- ✅ Problem Status Tracking (Reported, Acknowledged, In Progress, Resolved, Closed)
- ✅ Upvote Problems
- ✅ Comment on Problems
- ✅ Filter by Status/Category

**Screens:**
- `ProblemsScreen.tsx`

**Services:**
- `problemService.ts`

---

### 5. **Messaging & Chat**
- ✅ Direct Messages
- ✅ Group Chats
- ✅ Real-time Messaging
- ✅ Unread Message Counts
- ✅ Message Status (Delivered, Read)
- ✅ Media Sharing in Chat

**Screens:**
- `MessagesScreen.tsx`

**Services:**
- `chatService.ts`

---

### 6. **Groups & Communities** ✨ NEW
- ✅ Create Groups
- ✅ Browse Groups (All, My Groups, Discover)
- ✅ Group Categories (Cultural, Sports, Education, Health, Agriculture, Business, Youth, Women, Seniors)
- ✅ Group Privacy Types (Public, Private, Secret)
- ✅ Join/Leave Groups
- ✅ Group Members Management
- ✅ Group Posts Feed
- ✅ Invite Members
- ✅ Group Rules
- ✅ Member Roles (Admin, Moderator, Member)

**Screens:**
- `GroupsScreen.tsx` - Browse and search groups
- `GroupDetailScreen.tsx` - Group details with tabs (Posts/Members/About)
- `CreateGroupScreen.tsx` - Create new group with full customization

**Services:**
- `groupService.ts` - Complete group management CRUD

---

### 7. **Events Management** ✨ NEW
- ✅ Create Events
- ✅ Browse Events (All, Upcoming, Attending)
- ✅ Event Categories (Festival, Meeting, Workshop, Sports, Cultural, Health, Education)
- ✅ Event Status Tracking
- ✅ RSVP/Attend Events
- ✅ Event Details with Location
- ✅ Attendee Count

**Screens:**
- `EventsScreen.tsx`

**Services:**
- `eventService.ts`

---

### 7. **Fundraising** ✨ NEW
- ✅ Create Fundraisers
- ✅ Browse Fundraisers (All, Active, Completed)
- ✅ Fundraiser Categories (Education, Healthcare, Infrastructure, Emergency, Cultural, Environment)
- ✅ Progress Tracking
- ✅ Contribution System
- ✅ Verified Fundraisers Badge
- ✅ Contributor List

**Screens:**
- `FundraisersScreen.tsx`

**Services:**
- `fundraiserService.ts`

---

### 9. **Notifications System** ✨ NEW
- ✅ Push Notifications
- ✅ Notification Types (Post Like, Comment, Share, Follow, Message, Fundraiser, Problem Update, etc.)
- ✅ Read/Unread Status
- ✅ Mark All as Read
- ✅ Unread Count Badge

**Screens:**
- `NotificationsScreen.tsx`

**Services:**
- `notificationService.ts`

---

### 10. **Settings & Preferences** ✨ NEW
- ✅ Account Settings
- ✅ Privacy Settings
- ✅ Security Settings
- ✅ Notification Preferences (Toggle)
- ✅ Dark Mode Toggle
- ✅ Location Sharing Control
- ✅ Language Selection
- ✅ Help Center Access
- ✅ Terms & Conditions
- ✅ Privacy Policy
- ✅ About/Version Info
- ✅ Logout
- ✅ Delete Account

**Screens:**
- `SettingsScreen.tsx`

---

### 11. **Admin Dashboard & Management** ✨ NEW
- ✅ Comprehensive Admin Dashboard
- ✅ User Role Management (4 Roles: Admin, Moderator, Village Head, User)
- ✅ Smart Things IoT Device Control (8 Device Types)
- ✅ Content Moderation System
- ✅ Permission-Based Access Control (23 Granular Permissions)
- ✅ Real-time Analytics & Statistics
- ✅ User Suspension & Management
- ✅ Audit Logging
- ✅ Reports Management

**Screens:**
- `AdminDashboardScreen.tsx` - Main admin control panel with analytics
- `RoleManagementScreen.tsx` - User role assignment and permissions
- `SmartThingsScreen.tsx` - IoT device monitoring and control
- `ContentModerationScreen.tsx` - Content reports and moderation

**Components:**
- `ProtectedRoute.tsx` - Permission-based route protection

**Services:**
- `adminService.ts` - Admin operations and user management
- `permissionService.ts` - Role-based access control engine
- `smartThingsService.ts` - IoT device management

**Permissions:**
- ACCESS_ADMIN_PANEL - Access admin dashboard
- MANAGE_USERS - Create, update, delete users
- VIEW_ANALYTICS - View statistics and reports
- MANAGE_CONTENT - Moderate posts and content
- MANAGE_VILLAGES - Village verification and management
- MANAGE_PROBLEMS - Problem resolution and assignment
- CONTROL_SMART_THINGS - IoT device control and management
- MODERATE_CONTENT - Content moderation and reports
- And 15+ additional granular permissions

**Admin Features:**
- Real-time user statistics
- Content moderation workflow
- IoT device control (Lights, Fans, AC, Water Pumps, Security Cameras, etc.)
- User role assignment with permission validation
- Audit log tracking for all admin actions
- Permission-based UI rendering
- Secure admin-only routes

---

### 12. **Family Tree Management** 🆕 NEW
- ✅ Create Multiple Family Trees
- ✅ Add Family Members with Complete Life Details
- ✅ Define Family Relations (22 Relation Types)
  - Parents (Father, Mother)
  - Children (Son, Daughter)
  - Siblings (Brother, Sister)
  - Grandparents (Grandfather, Grandmother)
  - Grandchildren (Grandson, Granddaughter)
  - Spouses
  - In-Laws (Father-in-law, Mother-in-law, Son-in-law, Daughter-in-law, Brother-in-law, Sister-in-law)
  - Extended Family (Uncle, Aunt, Nephew, Niece, Cousin)
- ✅ Hierarchical Tree Visualization
- ✅ Multi-Generation Tracking
- ✅ Living/Deceased Status
- ✅ Member Life Events (Births, Deaths, Marriages, etc.)
- ✅ Search Family Members
- ✅ Tree Privacy Settings (Public/Private)
- ✅ Collaborative Tree Editing (Owners, Collaborators, Viewers)
- ✅ Village Integration
- ✅ Family Tree Statistics

**Screens:**
- `FamilyTreeScreen.tsx` - Main tree view with visualization
- `AddFamilyMemberScreen.tsx` - Add new family members
- `FamilyMemberDetailScreen.tsx` - View/edit member details

**Services:**
- `familyService.ts` - Complete family tree operations

**Features:**
- **Tree Management**: Create, view, update, delete family trees
- **Member Management**: Add members with biographical details (birth/death dates, places, occupation, bio, photos)
- **Relation Mapping**: Define relationships between members with 22 relation types
- **Tree Building**: Recursive tree structure construction for visualization
- **Search & Discovery**: Find family members by name, discover connections
- **Family Events**: Track important life milestones (births, deaths, marriages, anniversaries, reunions)
- **Statistics Dashboard**: Total members, living members, generations, marriages, average age
- **Privacy Controls**: Public trees for community sharing, private trees for family only
- **Collaboration**: Multiple users can view and edit shared family trees

**Data Model:**
- `FamilyTree`: Tree metadata with ownership and privacy settings
- `FamilyMember`: Person details with generation tracking and life status
- `FamilyRelation`: Connections between members with relation types
- `FamilyTreeNode`: Hierarchical structure for tree visualization
- `FamilyEvent`: Family milestones and important events

---

## 🏗️ Technical Architecture

### **Frontend**
- React Native with Expo ~50.0.0
- TypeScript (Fully typed)
- React Navigation v6 (Stack + Bottom Tabs)
- Zustand (State Management)
- Custom Hooks

### **Backend**
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Firebase Cloud Messaging (FCM)
- Firebase Analytics

### **Key Libraries**
- `@expo/vector-icons` - Icons
- `expo-image-picker` - Image selection
- `expo-location` - GPS & location services
- `expo-notifications` - Push notifications
- `react-native-gifted-chat` - Chat UI
- `moment` - Date/time formatting
- `formik` + `yup` - Form validation

---

## 📁 Project Structure

```
mana-uru/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── PostCard.tsx
│   │   └── ProtectedRoute.tsx ✨ NEW
│   │
│   ├── screens/            # All app screens
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ExploreScreen.tsx
│   │   ├── ProblemsScreen.tsx
│   │   ├── MessagesScreen.tsx
│   │   ├── CreatePostScreen.tsx
│   │   ├── PostDetailScreen.tsx ✨ NEW
│   │   ├── VillageDetailScreen.tsx ✨ NEW
│   │   ├── SettingsScreen.tsx ✨ NEW
│   │   ├── NotificationsScreen.tsx ✨ NEW
│   │   ├── EventsScreen.tsx ✨ NEW
│   │   ├── FundraisersScreen.tsx ✨ NEW
│   │   ├── GroupsScreen.tsx ✨ NEW
│   │   ├── GroupDetailScreen.tsx ✨ NEW
│   │   ├── CreateGroupScreen.tsx ✨ NEW
│   │   ├── AdminDashboardScreen.tsx ✨ NEW
│   │   ├── RoleManagementScreen.tsx ✨ NEW
│   │   ├── SmartThingsScreen.tsx ✨ NEW
│   │   └── ContentModerationScreen.tsx ✨ NEW
│   │
│   ├── services/           # Firebase services
│   │   ├── authService.ts
│   │   ├── postService.ts
│   │   ├── villageService.ts
│   │   ├── problemService.ts
│   │   ├── chatService.ts
│   │   ├── fundraiserService.ts
│   │   ├── storageService.ts
│   │   ├── notificationService.ts ✨ NEW
│   │   ├── eventService.ts ✨ NEW
│   │   ├── groupService.ts ✨ NEW
│   │   ├── adminService.ts ✨ NEW
│   │   ├── permissionService.ts ✨ NEW
│   │   └── smartThingsService.ts ✨ NEW
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── usePosts.ts
│   │
│   ├── store/              # Zustand stores
│   │   └── authStore.ts
│   │
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   │
│   ├── styles/             # Theme and styling
│   │   └── theme.ts
│   │
│   └── config/             # Configuration
│       └── firebase.ts
│
├── App.tsx                 # Main app entry with navigation
└── package.json            # Dependencies
```

---

## 🔄 Navigation Structure

```
AppStack (Authenticated Users)
├── MainTabs (Bottom Tab Navigator)
│   ├── Home (Feed)
│   ├── Explore (Villages Discovery)
│   ├── Problems (Community Issues)
│   ├── Chat (Messages)
│   └── Profile (User Profile)
└── Modal/Stack Screens
    ├── CreatePost (Modal)
    ├── PostDetail
    ├── VillageDetail
    ├── Settings
    ├── Notifications
    ├── Events
    ├── Fundraisers
    ├── Groups
    ├── GroupDetail
    ├── CreateGroup (Modal)
    ├── AdminDashboard ✨ NEW
    ├── RoleManagement ✨ NEW
    ├── SmartThings ✨ NEW
    ├── ContentModeration ✨ NEW
    ├── FamilyTree 🆕 NEW
    ├── AddFamilyMember 🆕 NEW (Modal)
    └── FamilyMemberDetail 🆕 NEW
    └── CreateGroup (Modal)

AuthStack (Unauthenticated)
├── Login
└── Signup
```

---

## 🎨 UI/UX Features

### **Theme System**
- Consistent color palette
- Typography system
- Spacing constants
- Border radius standards
- Shadow/elevation system

### **Design Patterns**
- Card-based layouts
- Pull-to-refresh
- Infinite scroll
- Loading states
- Empty states
- Error handling
- Skeleton screens (where applicable)

### **Icons & Assets**
- Ionicons icon pack
- Custom placeholders
- Avatar fallbacks
- Image loading states

---

## 🔐 Security Features

- Firebase Authentication
- Secure password handling
- Email verification support
- Role-based access control
- Privacy settings
- Content visibility controls
- Firestore security rules
- Storage security rules

---

## 📊 Data Models

### **User**
- id, email, displayName, photoURL, phoneNumber
- villageId, bio, location, role, verified
- followers[], following[]
- createdAt, updatedAt

### **Village**
- id, name, description, state, district, pincode
- location (lat/lng), coverImage, profileImage
- adminIds[], memberCount, verified
- categories[], population, language

### **Post**
- id, userId, userName, userAvatar
- villageId, villageName
- type (text, image, video, poll, event, announcement)
- content, media[], tags[]
- likes[], likeCount, commentCount, shareCount
- visibility (public, village, followers, private)
- isPinned, isArchived

### **Comment**
- id, postId, userId, userName, userAvatar
- content
- likes[], likeCount
- replies[], replyCount

### **Problem**
- id, userId, userName, villageId, villageName
- title, description, category, severity, status
- media[], location
- upvotes[], upvoteCount, commentCount
- assignedTo, resolvedBy, resolvedAt

### **Event** ✨ NEW
- id, userId, userName, villageId, villageName
- title, description, category
- startDate, endDate, location, coverImage
- attendees[], attendeeCount, maxAttendees
- price, organizer, status

### **Fundraiser** ✨ NEW
- id, userId, userName, villageId, villageName
- title, description, goalAmount, raisedAmount, currency
- category, media[], contributors[]
- status, startDate, endDate, verified

### **Notification** ✨ NEW
- id, userId, type, title, body
- data, read, actionUrl
- createdAt

### **Group** ✨ NEW
- id, name, description, category, type
- coverImage, creatorId, creatorName
- adminIds[], members[], memberCount, postCount
- rules[], villageId, createdAt, updatedAt

### **GroupMember** ✨ NEW
- userId, userName, userAvatar
- role (Admin, Moderator, Member)
- joinedAt, status (Active, Pending, Invited, Banned)

### **GroupPost** ✨ NEW
- id, groupId, userId, userName, userAvatar
- content, media[], likes[], likeCount, commentCount
- isPinned, createdAt, updatedAt

### **FamilyTree** 🆕 NEW
- id, name, description, rootMemberId
- ownerId, collaborators[], viewers[]
- villageId, isPublic, memberCount, generationCount
- createdAt, updatedAt

### **FamilyMember** 🆕 NEW
- id, familyTreeId, userId (optional)
- firstName, lastName, displayName
- dateOfBirth, dateOfDeath, gender
- placeOfBirth, placeOfDeath, occupation, bio
- profilePhoto, photos[], isAlive, generation
- createdBy, updatedBy, createdAt, updatedAt

### **FamilyRelation** 🆕 NEW
- id, familyTreeId
- fromMemberId, toMemberId, relationType
- createdBy, createdAt

### **FamilyEvent** 🆕 NEW
- id, familyTreeId, title, description, eventType
- date, location, involvedMemberIds[]
- photos[], createdBy, createdAt

---

## 🚀 Future Enhancements (Ready for Implementation)

### **Planned Features**
1. **Groups & Communities** ✅ IMPLEMENTED
   - ✅ Create/Join Groups
   - ✅ Group Chat
   - ✅ Group Events & Fundraisers

2. **Smart Village Features (Smartfy)**
   - Digital Payment Integration
   - Online Education
   - Telemedicine
   - Smart Farming
   - Renewable Energy Tracking
   - Waste Management
   - Water Management
   - Transportation

3. **Enhanced Search**
   - Full-text search (Algolia integration)
   - Advanced filters
   - Search history

4. **Media Enhancements**
   - Video upload & streaming
   - Image editing
   - Photo albums
   - Story feature

5. **Analytics Dashboard**
   - User engagement metrics
   - Village statistics
   - Problem resolution tracking
   - Fundraiser performance

6. **Gamification**
   - Badges & achievements
   - Leaderboards
   - Points system
   - Community challenges

7. **Offline Support**
   - Offline mode
   - Data synchronization
   - Cached content

8. **Multi-language**
   - Regional language support
   - RTL support
   - Language switcher

---

## 🛠️ Development Guidelines

### **Adding a New Screen**
1. Create screen file in `src/screens/`
2. Add navigation in `App.tsx`
3. Create service methods if needed
4. Add types in `src/types/index.ts`
5. Test on iOS, Android, and Web

### **Creating a New Service**
1. Create service file in `src/services/`
2. Use Firebase SDK methods
3. Add error handling
4. Export service class
5. Add JSDoc comments

### **Adding New Features**
1. Design data model
2. Create Firestore collections
3. Implement service layer
4. Create UI components
5. Add to navigation
## 📝 Key Implementation Notes

### **Admin Dashboard Features** ✨ NEW
The Admin Dashboard provides comprehensive management capabilities:

1. **Admin Dashboard**
   - Real-time statistics (users, posts, villages, problems, reports)
   - Quick action cards for all admin features
   - Permission-based access control
   - Modern card-based UI with analytics

2. **Role Management**
   - Manage user roles (Admin, Moderator, Village Head, User)
   - View and assign permissions (23 granular permissions)
   - Suspend/delete users
   - Filter users by role
   - Permission viewing by category

3. **Smart Things IoT Control**
   - 8 device types (Light, Fan, AC, Water Pump, Security Camera, Gate, Sensor, Appliance)
   - Device status monitoring (Online/Offline/Error)
   - Control panel with device-specific controls
   - Add/edit/delete devices
   - Permission levels: View (User) → Control (Village Head) → Manage (Admin)

4. **Content Moderation**
   - Review reported content
   - Approve/delete actions
   - User warning system
   - Report resolution tracking

### **ExploreScreen Features**

## 📝 Key Implementation Notes

### **ExploreScreen Features**
The ExploreScreen is fully implemented with three powerful tabs:

1. **Villages Tab**
   - Search by name, district, or state
   - 2-column grid layout
   - Verification badges
   - Member count display

2. **Popular Tab** ✨ ENHANCED
   - Time range filters (Today, Week, Month, All Time)
   - Engagement-based sorting (likes + comments×2 + shares×3)
   - Full PostCard components with interactions
   - Pull-to-refresh

3. **Nearby Tab** ✨ LOCATION-BASED
   - Automatic location detection
   - Permission handling UI
   - 50km radius search
   - Haversine distance calculation
   - Fallback for denied permissions

### **Navigation Integration**
All screens are properly integrated:
- PostDetail with comments
- VillageDetail with tabs (Posts/About/Members)
- Settings with all preferences
- Notifications with type icons
- Events with filters and FAB
- Fundraisers with progress tracking

### **Service Layer**
Complete service implementations:
- `PostService`: Full CRUD + comments + engagement
- `VillageService`: Discovery + follow + nearby
- `EventService`: CRUD + attendance
- `NotificationService`: Create + read + count
- All services with error handling

---

## 🎯 Getting Started

### **Installation**
```bash
# Clone repository
git clone https://github.com/Hemakotibonthada/manauru.git
cd manauru

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### **Firebase Setup**
1. Create Firebase project
---

*Last Updated: December 13, 2025*
*Version: 1.0.0*
*Deployed: https://mana-uru-001.web.app*Messaging for notifications

---

## 🤝 Contributing

The application is structured for easy expansion:
- Modular service layer
- Reusable components
- Type-safe with TypeScript
- Clear navigation structure
- Documented code
- Scalable architecture

---

## 📄 License
Private - All rights reserved

---

## 👥 Credits
Developed for Indian village communities to connect, collaborate, and grow together.

**Made with ❤️ for Village Communities**

---

*Last Updated: December 2025*
*Version: 1.0.0*
