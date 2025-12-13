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
  bio?: string;
  location?: Location;
  role: UserRole;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fcmToken?: string;
  language: string;
  followers: string[];
  following: string[];
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VILLAGE_HEAD = 'village_head',
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
  category: GroupCategory;
  visibility: GroupVisibility;
  chatId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum GroupCategory {
  GENERAL = 'general',
  BUSINESS = 'business',
  EDUCATION = 'education',
  HEALTH = 'health',
  SPORTS = 'sports',
  CULTURAL = 'cultural',
  EMERGENCY = 'emergency',
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
