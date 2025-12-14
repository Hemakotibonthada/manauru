# Admin System Implementation - Complete Guide

## Overview
This document describes the comprehensive admin system implemented for the Mana Uru application, featuring role-based access control (RBAC), IoT device management, and content moderation.

## Architecture

### 1. Role-Based Access Control (RBAC)

#### User Roles
- **ADMIN**: Full system access with all permissions
- **MODERATOR**: Content moderation and user management capabilities
- **VILLAGE_HEAD**: Village-specific management and device control
- **USER**: Basic user access with limited permissions

#### Permission Categories
1. **USER_MANAGEMENT**: User administration (view, edit, ban, assign roles)
2. **CONTENT_MODERATION**: Content oversight (view reports, moderate, remove content)
3. **VILLAGE_MANAGEMENT**: Village operations (view, edit, approve)
4. **SMART_THINGS**: IoT device control (view, control, add/remove devices)
5. **ANALYTICS**: System analytics and reporting
6. **SYSTEM_SETTINGS**: System configuration and settings

#### Permissions Matrix

| Permission | Admin | Moderator | Village Head | User |
|------------|-------|-----------|--------------|------|
| VIEW_USERS | ✅ | ✅ | ✅ | ❌ |
| EDIT_USERS | ✅ | ✅ | ❌ | ❌ |
| BAN_USERS | ✅ | ✅ | ❌ | ❌ |
| ASSIGN_ROLES | ✅ | ❌ | ❌ | ❌ |
| VIEW_REPORTS | ✅ | ✅ | ❌ | ❌ |
| MODERATE_CONTENT | ✅ | ✅ | ❌ | ❌ |
| REMOVE_CONTENT | ✅ | ✅ | ❌ | ❌ |
| VIEW_VILLAGE | ✅ | ✅ | ✅ | ✅ |
| EDIT_VILLAGE | ✅ | ✅ | ✅ | ❌ |
| APPROVE_VILLAGE | ✅ | ❌ | ❌ | ❌ |
| VIEW_DEVICES | ✅ | ✅ | ✅ | ❌ |
| CONTROL_DEVICES | ✅ | ✅ | ✅ | ❌ |
| ADD_DEVICES | ✅ | ✅ | ✅ | ❌ |
| REMOVE_DEVICES | ✅ | ✅ | ❌ | ❌ |
| VIEW_ANALYTICS | ✅ | ✅ | ✅ | ❌ |
| VIEW_AUDIT_LOGS | ✅ | ❌ | ❌ | ❌ |
| MANAGE_SETTINGS | ✅ | ❌ | ❌ | ❌ |

### 2. Services

#### Permission Service (`src/services/permissionService.ts`)
Handles all permission checks and role-based access control logic.

**Key Methods:**
- `hasPermission(userId, role, permission)`: Check single permission
- `hasAnyPermission(userId, role, permissions)`: Check if user has any of the permissions
- `hasAllPermissions(userId, role, permissions)`: Check if user has all permissions
- `canControlDevice(userId, role, device)`: Check device-specific control access
- `canAccessAdmin(userId, role)`: Check admin panel access
- `canManageRoles(userId, role)`: Check role management access

#### Admin Service (`src/services/adminService.ts`)
Manages administrative operations including user management, statistics, and audit logging.

**Key Methods:**
- `getAdminStats()`: Retrieve system statistics
- `updateUserRole(userId, newRole)`: Update user role
- `banUser(userId, reason)`: Ban user account
- `getUsers(filters)`: Get user list with filtering
- `deleteUser(userId, soft)`: Delete user account
- `getReports(status)`: Get content reports
- `updateReport(reportId, status, action)`: Update report status
- `createAuditLog(action, userId, details)`: Log admin action
- `getAuditLogs(filters)`: Get audit log history
- `deleteContent(contentId, type, reason)`: Remove content
- `getUserActivity(userId, days)`: Get user activity stats

**Statistics Tracked:**
- Total users, active users, new users today
- Total villages
- Total posts
- Total groups
- Reported content count
- Pending approvals

#### Smart Things Service (`src/services/smartThingsService.ts`)
Manages IoT devices and smart home controls within villages.

**Key Methods:**
- `getAllDevices(villageId)`: Get all devices (filtered by village if applicable)
- `getDevice(deviceId)`: Get single device details
- `addDevice(device)`: Add new device
- `updateDevice(deviceId, updates)`: Update device properties
- `deleteDevice(deviceId)`: Remove device
- `controlDevice(deviceId, action, userId)`: Control device (on/off)
- `getDeviceHistory(deviceId)`: Get device control history
- `logDeviceEvent(deviceId, event)`: Log device events
- `updateDevicePermissions(deviceId, permissions)`: Update who can control device
- `bulkControlDevices(deviceIds, action, userId)`: Control multiple devices
- `getDeviceStats(villageId)`: Get device statistics

**Device Types Supported:**
1. Light
2. Camera
3. Sensor
4. Lock
5. Thermostat
6. Irrigation System
7. Water Pump
8. Street Light
9. Alarm
10. Gate
11. Other

**Device Statuses:**
- ONLINE: Device is operational and connected
- OFFLINE: Device is disconnected
- ERROR: Device has an error
- MAINTENANCE: Device is under maintenance

**Device Control Logic:**
Device access is checked in this order:
1. User ID is in device's `controllableBy` array
2. User's role is in device's `controllableBy` array
3. User has `CONTROL_DEVICES` permission

### 3. User Interface

#### Admin Dashboard (`src/screens/AdminDashboardScreen.tsx`)
Main control panel for administrators.

**Features:**
- **Statistics Cards**: Display key metrics
  - Total users, active users (last 7 days)
  - Villages count
  - Posts count
  - Groups count
  - Reports count (alerts if > 0)
- **Quick Actions Grid**: Navigate to admin features
  - User Management
  - Role Management
  - Content Moderation
  - Smart Things
  - Village Management
  - Analytics
  - Audit Logs
  - Settings
- **Recent Activity**: Upcoming feature for activity tracking
- **Pull-to-Refresh**: Reload statistics

**Access Control:**
- Requires `canAccessAdmin()` - accessible to Admin, Moderator, Village Head
- Quick actions filtered by user permissions

#### Role Management (`src/screens/RoleManagementScreen.tsx`)
Interface for managing user roles and permissions.

**Features:**
- **User List**: Display all users with avatars and role badges
- **Search**: Filter users by name or email
- **Role Filters**: Filter by role (All, User, Village Head, Moderator, Admin)
- **Role Assignment Modal**: 
  - User preview with name and email
  - All 4 roles with descriptions
  - Current role indicator
  - Color-coded roles (Red=Admin, Purple=Moderator, Blue=Village Head, Gray=User)
- **Role Descriptions**:
  - Admin: Full system access
  - Moderator: Content moderation and user management
  - Village Head: Manage village and devices
  - User: Basic access

**Access Control:**
- Admin only (`canManageRoles()`)
- Redirects unauthorized users

#### Smart Things Dashboard (`src/screens/SmartThingsScreen.tsx`)
IoT device management and control interface.

**Features:**
- **Statistics Bar**: Device counts by status
  - Total devices
  - Online devices (green)
  - Offline devices (orange)
  - Error devices (red)
- **Device Type Filters**: Horizontal scrollable filter chips
  - All, Light, Camera, Sensor, Lock, Thermostat, Irrigation, Water Pump, Street Light, Alarm, Gate, Other
- **Device Cards**: 
  - Device icon (type-specific)
  - Name and location
  - Status badge (color-coded)
  - Toggle switch for online devices (if user has control permission)
- **Device Detail Modal**:
  - Full device information
  - Type, status, location
  - Control buttons (Turn On/Off)
  - View control history
  - Delete device (if authorized)
- **Pull-to-Refresh**: Reload device list

**Access Control:**
- Requires `VIEW_DEVICES` permission
- Device control requires `CONTROL_DEVICES` AND `canControlDevice()` check
- Delete requires `REMOVE_DEVICES` permission
- Village Heads see only their village's devices

#### Content Moderation (`src/screens/ContentModerationScreen.tsx`)
Manage reports, flagged content, and content moderation.

**Features:**
- **Statistics Bar**: Report counts by status
  - Total reports
  - Pending (yellow)
  - Reviewing (blue)
  - Resolved (green)
- **Status Filters**: Filter reports by status
  - All, Pending, Under Review, Resolved, Dismissed
- **Report Cards**:
  - Reason icon (type-specific)
  - Report reason and date
  - Status badge
  - Content type
  - Description preview
  - Reporter info
- **Report Detail Modal**:
  - Full report information
  - Reason, status, type, content ID
  - Description, reporter, timestamps
  - Review info (if reviewed)
  - Action taken (if resolved)
- **Moderation Actions**:
  - Pending → Review or Dismiss
  - Under Review → Resolve (with action note) or Dismiss
- **Pull-to-Refresh**: Reload reports

**Report Reasons:**
- Spam
- Harassment
- Inappropriate content
- Misinformation
- Violence
- Hate speech
- Other

**Report Statuses:**
- PENDING: New report awaiting review
- UNDER_REVIEW: Currently being reviewed
- RESOLVED: Action taken
- DISMISSED: No action required

**Access Control:**
- Requires `MODERATE_CONTENT` permission
- Admin and Moderator access only

### 4. Custom Hooks

#### usePermissions (`src/hooks/usePermissions.ts`)
React hooks for easy permission checking in components.

**Hooks:**
- `usePermission(permission)`: Check single permission
- `useAnyPermission(permissions)`: Check if user has any permission
- `useAllPermissions(permissions)`: Check if user has all permissions
- `useCanControlDevice(device)`: Check device control permission
- `useCanAccessAdmin()`: Check admin panel access
- `useCanManageRoles()`: Check role management access
- `usePermissions()`: Get all permission check functions

**Usage Example:**
```typescript
import { usePermission, useCanControlDevice } from '../hooks/usePermissions';

const MyComponent = () => {
  const canModerate = usePermission('MODERATE_CONTENT');
  const canControl = useCanControlDevice(device);
  
  if (!canModerate) return <AccessDenied />;
  
  return (
    <View>
      {canControl && <ControlButton />}
    </View>
  );
};
```

## Navigation Integration

### App.tsx Routes
All admin screens are integrated into the main navigation stack:

```typescript
<Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
<Stack.Screen name="RoleManagement" component={RoleManagementScreen} />
<Stack.Screen name="SmartThings" component={SmartThingsScreen} />
<Stack.Screen name="ContentModeration" component={ContentModerationScreen} />
```

### Settings Screen Access
Admin access button added to Settings screen for users with admin permissions:

```typescript
{hasAdminAccess && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Administration</Text>
    {renderSettingItem(
      'shield-outline',
      'Admin Dashboard',
      'Manage users, content, and settings',
      () => navigation.navigate('AdminDashboard')
    )}
  </View>
)}
```

## Data Models

### Key Type Definitions

```typescript
// User Role
export type UserRole = 'USER' | 'VILLAGE_HEAD' | 'MODERATOR' | 'ADMIN';

// Permission
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

// Admin Statistics
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalVillages: number;
  totalPosts: number;
  totalGroups: number;
  reportedContent: number;
  pendingApprovals: number;
}

// Smart Device
export interface SmartDevice {
  id: string;
  name: string;
  type: DeviceType;
  villageId: string;
  villageName: string;
  location: string;
  status: DeviceStatus;
  isOnline: boolean;
  lastSeen: Timestamp;
  controllableBy: string[]; // User IDs or roles
  installedBy: string;
  installedAt: Timestamp;
  specifications?: Record<string, any>;
}

// Report
export interface Report {
  id: string;
  contentId: string;
  reportType: 'POST' | 'COMMENT' | 'USER' | 'GROUP';
  reason: string;
  description?: string;
  reportedBy: string;
  status: ReportStatus;
  createdAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  action?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  details?: Record<string, any>;
  ipAddress?: string;
}
```

## Security Considerations

### Permission Checks
- All admin screens check permissions on mount
- Redirect unauthorized users immediately
- Permission checks on every sensitive operation
- Device control has multi-layer checks (user ID, role, permission)

### Audit Logging
- All administrative actions are logged
- Logs include: action, user, timestamp, details
- Logs are immutable (no deletion)
- Admin-only access to audit logs

### Role Hierarchy
- Roles are not hierarchical by default
- Permissions are explicit, not inherited
- Admin has all permissions explicitly defined
- Each role's permissions are clearly mapped

## Future Enhancements

### Planned Features
1. **Analytics Screen**: Detailed charts and visualizations
2. **Audit Logs Screen**: Searchable, filterable audit history
3. **User Management Screen**: Detailed user CRUD operations
4. **Village Management Screen**: Approve and manage villages
5. **Admin Settings Screen**: System configuration
6. **Real-time Notifications**: Push notifications for admin events
7. **Device Automation**: Schedule device actions
8. **Content Filtering**: AI-powered content moderation
9. **Role Templates**: Pre-configured permission sets
10. **Multi-language Support**: Internationalization

### Technical Improvements
- Real-time device status updates
- WebSocket integration for live updates
- Enhanced error handling
- Performance optimization for large datasets
- Offline support with sync
- End-to-end encryption for sensitive operations
- Two-factor authentication for admin access
- Rate limiting for API calls
- Caching for frequently accessed data

## Usage Guide

### For Administrators
1. Navigate to Settings → Admin Dashboard
2. View system statistics on the dashboard
3. Use quick actions to access admin features
4. Monitor reports in Content Moderation
5. Manage user roles in Role Management
6. Control IoT devices in Smart Things

### For Moderators
1. Access admin panel from Settings
2. View and moderate reported content
3. Take action on flagged posts/users
4. Monitor user activity
5. Limited device control (if permitted)

### For Village Heads
1. Access Smart Things dashboard
2. View and control village devices
3. Monitor device status and history
4. Add new devices to village
5. View village statistics

### For Developers
1. Import permission service for access checks
2. Use custom hooks for permission-aware components
3. Add new permissions to `PERMISSIONS` constant
4. Update role mappings in `ROLE_PERMISSIONS`
5. Create admin service methods for new features
6. Add admin screens to navigation

## Testing

### Test Scenarios
1. **Permission Checks**:
   - Test each role's access to screens
   - Verify permission-based UI hiding
   - Test unauthorized access attempts

2. **Device Control**:
   - Test device control with different roles
   - Verify controllableBy array logic
   - Test bulk operations

3. **Content Moderation**:
   - Create and review reports
   - Test status transitions
   - Verify action logging

4. **Role Management**:
   - Assign and change roles
   - Verify permission updates
   - Test role assignment validation

5. **Statistics**:
   - Verify accurate counts
   - Test real-time updates
   - Check performance with large datasets

## Troubleshooting

### Common Issues

**Issue**: User can't access admin panel
- **Solution**: Check user role and `canAccessAdmin()` permission

**Issue**: Device control not working
- **Solution**: Verify user is in device's `controllableBy` array or has correct role/permission

**Issue**: Statistics not updating
- **Solution**: Check service method calls and data refresh logic

**Issue**: Role assignment not working
- **Solution**: Ensure user has `ASSIGN_ROLES` permission (Admin only)

**Issue**: Reports not displaying
- **Solution**: Check `MODERATE_CONTENT` permission and report service

## Conclusion

This admin system provides a comprehensive, secure, and scalable solution for managing the Mana Uru application. With role-based access control, IoT device management, content moderation, and detailed audit logging, administrators have all the tools needed to effectively manage users, content, and devices across villages.

The modular architecture allows for easy extension and customization, while the permission-based system ensures security and proper access control throughout the application.
