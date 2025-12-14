/**
 * Type Definitions for Mana Uru Application
 */

import { Timestamp } from 'firebase/firestore';

// ============= User Types =============
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  villageId?: string;
  villageName?: string;
  bio?: string;
  location?: Location;
  address?: Address;
  role: UserRole;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fcmToken?: string;
  language: string;
  followers: string[];
  following: string[];
  // Professional Information
  profession?: Profession;
  customProfession?: string;
  qualifications: Qualification[];
  skills: string[];
  experience?: number;
  workplace?: string;
  // Additional Details
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  emergencyContact?: EmergencyContact;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VILLAGE_HEAD = 'village_head',
}

export enum Profession {
  FARMER = 'farmer',
  TEACHER = 'teacher',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  ENGINEER = 'engineer',
  BUSINESSMAN = 'businessman',
  SHOPKEEPER = 'shopkeeper',
  ARTISAN = 'artisan',
  CARPENTER = 'carpenter',
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  DRIVER = 'driver',
  GOVERNMENT_EMPLOYEE = 'government_employee',
  PRIVATE_EMPLOYEE = 'private_employee',
  STUDENT = 'student',
  HOMEMAKER = 'homemaker',
  RETIRED = 'retired',
  SELF_EMPLOYED = 'self_employed',
  UNEMPLOYED = 'unemployed',
  OTHER = 'other',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  field?: string;
}

export interface Address {
  street?: string;
  area?: string;
  landmark?: string;
  pincode?: string;
  postalCode?: string;
  city?: string;
  district?: string;
  state?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

// ============= Village Types =============
export interface Village {
  id: string;
  name: string;
  description: string;
  state: string;
  district: string;
  pincode: string;
  location: Location;
  coverImage?: string;
  profileImage?: string;
  adminIds: string[];
  memberCount: number;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  categories: string[];
  population?: number;
  language: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// ============= Post Types =============
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  villageId?: string;
  villageName?: string;
  type: PostType;
  content: string;
  media: Media[];
  likes: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  visibility: PostVisibility;
  tags: string[];
  location?: Location;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPinned?: boolean;
  isArchived?: boolean;
}

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  POLL = 'poll',
  EVENT = 'event',
  ANNOUNCEMENT = 'announcement',
}

export enum PostVisibility {
  PUBLIC = 'public',
  VILLAGE = 'village',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export interface Media {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  duration?: number;
}

// ============= Comment Types =============
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: string[];
  likeCount: number;
  replies: Reply[];
  replyCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Reply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: string[];
  likeCount: number;
  createdAt: Timestamp;
}

// ============= Fundraising Types =============
export interface Fundraiser {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  villageId?: string;
  villageName?: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  category: FundraiserCategory;
  media: Media[];
  contributors: Contributor[];
  status: FundraiserStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  verified: boolean;
}

export enum FundraiserCategory {
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  INFRASTRUCTURE = 'infrastructure',
  EMERGENCY = 'emergency',
  CULTURAL = 'cultural',
  ENVIRONMENT = 'environment',
  OTHER = 'other',
}

export enum FundraiserStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export interface Contributor {
  userId: string;
  userName: string;
  amount: number;
  message?: string;
  anonymous: boolean;
  timestamp: Timestamp;
}

// ============= Chat Types =============
export interface Chat {
  id: string;
  type: ChatType;
  participants: string[];
  participantDetails: ParticipantDetail[];
  lastMessage?: Message;
  lastMessageTime?: Timestamp;
  unreadCount: { [userId: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export interface ParticipantDetail {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  media?: Media;
  replyTo?: string;
  readBy: string[];
  deliveredTo: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
}

// ============= Group Types =============
export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  villageId?: string;
  adminIds: string[];
  memberIds: string[];
  memberCount: number;
  postCount?: number;
  category: GroupCategory;
  visibility: GroupVisibility;
  chatId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

// ============= Problem Types =============
export interface Problem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  villageId: string;
  villageName: string;
  title: string;
  description: string;
  category: ProblemCategory;
  severity: ProblemSeverity;
  status: ProblemStatus;
  media: Media[];
  location?: Location;
  upvotes: string[];
  upvoteCount: number;
  commentCount: number;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum ProblemCategory {
  WATER = 'water',
  ELECTRICITY = 'electricity',
  ROAD = 'road',
  SANITATION = 'sanitation',
  HEALTH = 'health',
  EDUCATION = 'education',
  SAFETY = 'safety',
  OTHER = 'other',
}

export enum ProblemSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProblemStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// ============= Smartfy Types =============
export interface SmartFeature {
  id: string;
  villageId: string;
  villageName: string;
  title: string;
  description: string;
  category: SmartCategory;
  media: Media[];
  status: SmartStatus;
  benefits: string[];
  cost?: number;
  implementationDate?: Timestamp;
  createdBy: string;
  supporters: string[];
  supportCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum SmartCategory {
  DIGITAL_PAYMENT = 'digital_payment',
  ONLINE_EDUCATION = 'online_education',
  TELEMEDICINE = 'telemedicine',
  SMART_FARMING = 'smart_farming',
  RENEWABLE_ENERGY = 'renewable_energy',
  WASTE_MANAGEMENT = 'waste_management',
  WATER_MANAGEMENT = 'water_management',
  TRANSPORTATION = 'transportation',
}

export enum SmartStatus {
  PROPOSED = 'proposed',
  PLANNING = 'planning',
  IMPLEMENTATION = 'implementation',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

// ============= Notification Types =============
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

export enum NotificationType {
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  POST_SHARE = 'post_share',
  FOLLOW = 'follow',
  MESSAGE = 'message',
  FUNDRAISER = 'fundraiser',
  PROBLEM_UPDATE = 'problem_update',
  GROUP_INVITE = 'group_invite',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
}

// ============= Event Types =============
export interface Event {
  id: string;
  userId: string;
  userName: string;
  villageId?: string;
  villageName?: string;
  title: string;
  description: string;
  category: EventCategory;
  startDate: Timestamp;
  endDate: Timestamp;
  location: Location;
  coverImage?: string;
  attendees: string[];
  attendeeCount: number;
  maxAttendees?: number;
  price?: number;
  organizer: string;
  status: EventStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum EventCategory {
  FESTIVAL = 'festival',
  MEETING = 'meeting',
  WORKSHOP = 'workshop',
  SPORTS = 'sports',
  CULTURAL = 'cultural',
  HEALTH = 'health',
  EDUCATION = 'education',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ============= Group/Community Types =============
export interface Group {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  type: GroupType;
  coverImage?: string;
  profileImage?: string;
  adminIds: string[];
  moderatorIds: string[];
  memberIds: string[];
  memberCount: number;
  villageId?: string;
  villageName?: string;
  rules: string[];
  tags: string[];
  isPrivate: boolean;
  requiresApproval: boolean;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum GroupCategory {
  GENERAL = 'general',
  CULTURAL = 'cultural',
  SPORTS = 'sports',
  EDUCATION = 'education',
  HEALTH = 'health',
  AGRICULTURE = 'agriculture',
  BUSINESS = 'business',
  YOUTH = 'youth',
  WOMEN = 'women',
  SENIORS = 'seniors',
}

export enum GroupType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SECRET = 'secret',
}

export interface GroupMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: GroupRole;
  joinedAt: Timestamp;
  status: MemberStatus;
}

export enum GroupRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export enum MemberStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INVITED = 'invited',
  BANNED = 'banned',
}

export interface GroupPost {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  media: Media[];
  likes: string[];
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  status: InvitationStatus;
  createdAt: Timestamp;
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// ============= API Response Types =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: any;
  total?: number;
}

// ============= Admin & Permissions =============
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export enum PermissionCategory {
  USER_MANAGEMENT = 'user_management',
  CONTENT_MODERATION = 'content_moderation',
  VILLAGE_MANAGEMENT = 'village_management',
  SMART_THINGS = 'smart_things',
  ANALYTICS = 'analytics',
  SYSTEM_SETTINGS = 'system_settings',
}

export interface RolePermissions {
  [UserRole.ADMIN]: string[];
  [UserRole.MODERATOR]: string[];
  [UserRole.VILLAGE_HEAD]: string[];
  [UserRole.USER]: string[];
}

export interface AdminStats {
  totalUsers: number;
  totalVillages: number;
  totalPosts: number;
  totalGroups: number;
  activeUsers: number;
  newUsersToday: number;
  reportedContent: number;
  pendingApprovals: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: Timestamp;
  ipAddress?: string;
}

// ============= Smart Things Types =============
export interface SmartDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  villageId?: string;
  villageName?: string;
  lastActive: Timestamp;
  metadata: Record<string, any>;
  controllableBy: string[]; // User IDs or roles
  installedBy: string;
  installedAt: Timestamp;
}

export enum DeviceType {
  LIGHT = 'light',
  CAMERA = 'camera',
  SENSOR = 'sensor',
  LOCK = 'lock',
  THERMOSTAT = 'thermostat',
  IRRIGATION = 'irrigation',
  WATER_PUMP = 'water_pump',
  STREET_LIGHT = 'street_light',
  ALARM = 'alarm',
  GATE = 'gate',
  OTHER = 'other',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export interface DeviceControl {
  deviceId: string;
  action: string;
  parameters?: Record<string, any>;
  userId: string;
  timestamp: Timestamp;
}

export interface DeviceLog {
  id: string;
  deviceId: string;
  event: string;
  data: Record<string, any>;
  timestamp: Timestamp;
}

// ============= Content Moderation =============
export interface Report {
  id: string;
  reportedBy: string;
  reportedUser: string;
  contentType: 'post' | 'comment' | 'user' | 'group';
  contentId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  resolution?: string;
  createdAt: Timestamp;
}

export interface ContentFlag {
  id: string;
  contentType: string;
  contentId: string;
  flaggedBy: string[];
  reason: string[];
  status: 'pending' | 'approved' | 'removed';
  reviewedBy?: string;
  createdAt: Timestamp;
}

// ============= Family Tree =============
export enum FamilyRelationType {
  SPOUSE = 'spouse',
  FATHER = 'father',
  MOTHER = 'mother',
  SON = 'son',
  DAUGHTER = 'daughter',
  BROTHER = 'brother',
  SISTER = 'sister',
  GRANDFATHER = 'grandfather',
  GRANDMOTHER = 'grandmother',
  GRANDSON = 'grandson',
  GRANDDAUGHTER = 'granddaughter',
  UNCLE = 'uncle',
  AUNT = 'aunt',
  NEPHEW = 'nephew',
  NIECE = 'niece',
  COUSIN = 'cousin',
  FATHER_IN_LAW = 'father_in_law',
  MOTHER_IN_LAW = 'mother_in_law',
  SON_IN_LAW = 'son_in_law',
  DAUGHTER_IN_LAW = 'daughter_in_law',
  BROTHER_IN_LAW = 'brother_in_law',
  SISTER_IN_LAW = 'sister_in_law',
}

export interface FamilyMember {
  id: string;
  userId?: string; // Link to actual user if they have an account
  familyTreeId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: Gender;
  dateOfBirth?: string;
  dateOfDeath?: string;
  isAlive: boolean;
  photoURL?: string;
  phoneNumber?: string;
  email?: string;
  occupation?: string;
  location?: string;
  bio?: string;
  marriedTo?: string; // ID of spouse
  generation: number; // 0 for root, 1 for children, -1 for parents, etc.
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FamilyRelation {
  id: string;
  familyTreeId: string;
  fromMemberId: string;
  toMemberId: string;
  relationType: FamilyRelationType;
  createdBy: string;
  createdAt: Timestamp;
}

export interface FamilyTree {
  id: string;
  name: string; // Family surname or name
  description?: string;
  rootMemberId: string; // The oldest ancestor or starting point
  ownerId: string; // User who created the tree
  collaborators: string[]; // Users who can edit
  viewers: string[]; // Users who can view
  villageId?: string;
  isPublic: boolean;
  memberCount: number;
  generationCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FamilyTreeNode {
  member: FamilyMember;
  spouse?: FamilyMember;
  children: FamilyTreeNode[];
  parents: FamilyMember[];
  siblings: FamilyMember[];
  relations: FamilyRelation[];
}

export interface FamilyEvent {
  id: string;
  familyTreeId: string;
  title: string;
  description?: string;
  eventType: 'birth' | 'death' | 'marriage' | 'anniversary' | 'reunion' | 'other';
  date: string;
  location?: string;
  attendees: string[]; // Member IDs
  photos: string[];
  createdBy: string;
  createdAt: Timestamp;
}

// ============= Shop/Marketplace Types =============
export interface Shop {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  villageId: string;
  villageName: string;
  category: ShopCategory;
  photos: string[];
  coverImage?: string;
  address: string;
  location?: Location;
  openingHours?: OpeningHours;
  isOpen: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  totalOrders: number;
  phoneNumber?: string;
  whatsappNumber?: string;
  email?: string;
  deliveryAvailable: boolean;
  deliveryRadius?: number; // in km
  deliveryFee?: number;
  minOrderAmount?: number;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum ShopCategory {
  GROCERY = 'grocery',
  RESTAURANT = 'restaurant',
  CLOTHING = 'clothing',
  ELECTRONICS = 'electronics',
  PHARMACY = 'pharmacy',
  HARDWARE = 'hardware',
  BAKERY = 'bakery',
  VEGETABLES = 'vegetables',
  DAIRY = 'dairy',
  MEAT = 'meat',
  STATIONERY = 'stationery',
  MOBILE_SHOP = 'mobile_shop',
  BEAUTY = 'beauty',
  JEWELRY = 'jewelry',
  FURNITURE = 'furniture',
  BOOKS = 'books',
  TOYS = 'toys',
  SPORTS = 'sports',
  AUTOMOBILE = 'automobile',
  OTHER = 'other',
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "21:00"
  closed: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  unit: string; // kg, piece, liter, etc
  stock: number;
  inStock: boolean;
  images: string[];
  variants?: ProductVariant[];
  specifications?: { [key: string]: string };
  tags: string[];
  featured: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductVariant {
  id: string;
  name: string; // Size, Color, etc
  options: string[]; // Small, Medium, Large
  priceModifier?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryLocation?: Location;
  deliveryType: DeliveryType;
  notes?: string;
  estimatedDeliveryTime?: Timestamp;
  estimatedDelivery?: string;
  actualDeliveryTime?: Timestamp;
  cancelReason?: string;
  rating?: number;
  review?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unit: string;
  price: number;
  variant?: string;
  subtotal: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DeliveryType {
  HOME_DELIVERY = 'home_delivery',
  PICKUP = 'pickup',
}

export interface ShopReview {
  id: string;
  shopId: string;
  orderId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  review: string;
  photos?: string[];
  helpful: string[]; // User IDs who found this helpful
  response?: string; // Shop owner's response
  respondedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Cart {
  id?: string;
  userId: string;
  shopId: string;
  shopName: string;
  items: CartItem[];
  subtotal: number;
  updatedAt: Timestamp;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unit: string;
  price: number;
  variant?: string;
  maxStock: number;
}

// ============= Famous Places & Landmarks =============
export enum PlaceCategory {
  TEMPLE = 'temple',
  MOSQUE = 'mosque',
  CHURCH = 'church',
  MONUMENT = 'monument',
  PARK = 'park',
  LAKE = 'lake',
  RIVER = 'river',
  WATERFALL = 'waterfall',
  HILL = 'hill',
  FOREST = 'forest',
  MARKET = 'market',
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  HERITAGE_SITE = 'heritage_site',
  MUSEUM = 'museum',
  LIBRARY = 'library',
  SCHOOL = 'school',
  HOSPITAL = 'hospital',
  GOVERNMENT_OFFICE = 'government_office',
  COMMUNITY_HALL = 'community_hall',
  SPORTS_GROUND = 'sports_ground',
  SCENIC_SPOT = 'scenic_spot',
  CULTURAL_CENTER = 'cultural_center',
  HISTORICAL_LANDMARK = 'historical_landmark',
  NATURAL_WONDER = 'natural_wonder',
  OTHER = 'other',
}

export interface FamousPlace {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  villageId: string;
  villageName: string;
  location: Location;
  address: string;
  photos: string[];
  coverImage?: string;
  addedBy: string;
  addedByName: string;
  addedByAvatar?: string;
  verified: boolean;
  featured: boolean;
  visitCount: number;
  likeCount: number;
  likedBy: string[];
  rating: number;
  reviewCount: number;
  openingHours?: string;
  entryFee?: string;
  bestTimeToVisit?: string;
  facilities: string[];
  tags: string[];
  contactPhone?: string;
  website?: string;
  historicalSignificance?: string;
  culturalImportance?: string;
  tips?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  review: string;
  photos?: string[];
  visitDate?: string;
  helpful: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlaceVisit {
  id: string;
  placeId: string;
  placeName: string;
  userId: string;
  userName: string;
  visitDate: Timestamp;
  photos?: string[];
  notes?: string;
  rating?: number;
  createdAt: Timestamp;
}


