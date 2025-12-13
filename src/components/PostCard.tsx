/**
 * Post Card Component
 * Displays a single post with all interactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import moment from 'moment';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: () => void;
  onComment: () => void;
  onShare?: () => void;
  onUserPress?: () => void;
  onPostPress?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onUserPress,
  onPostPress,
}) => {
  const isLiked = post.likes.includes(currentUserId);
  const [imageError, setImageError] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.content}\n\nShared from Mana Uru`,
      });
      if (onShare) onShare();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={onUserPress}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {post.userAvatar && !imageError ? (
              <Image
                source={{ uri: post.userAvatar }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons name="person" size={24} color={colors.text.secondary} />
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.userName}</Text>
            {post.villageName && (
              <Text style={styles.villageName}>{post.villageName}</Text>
            )}
            <Text style={styles.timestamp}>
              {moment(post.createdAt.toDate()).fromNow()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Content */}
      <TouchableOpacity onPress={onPostPress} activeOpacity={0.9}>
        {post.content && <Text style={styles.content}>{post.content}</Text>}
        
        {/* Media */}
        {post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: post.media[0].url }}
              style={styles.media}
              resizeMode="cover"
            />
            {post.media.length > 1 && (
              <View style={styles.mediaCountBadge}>
                <Text style={styles.mediaCountText}>+{post.media.length - 1}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? colors.like : colors.text.secondary}
            />
            {post.likeCount > 0 && (
              <Text style={styles.actionText}>{post.likeCount}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.comment} />
            {post.commentCount > 0 && (
              <Text style={styles.actionText}>{post.commentCount}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.share} />
            {post.shareCount > 0 && (
              <Text style={styles.actionText}>{post.shareCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tags}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.body1.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  villageName: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    fontSize: typography.body1.fontSize,
    color: colors.text.primary,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  media: {
    width: '100%',
    height: 300,
    backgroundColor: colors.background.paper,
  },
  mediaCountBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  mediaCountText: {
    color: colors.text.light,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
