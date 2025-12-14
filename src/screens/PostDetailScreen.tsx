/**
 * Post Detail Screen
 * View full post with comments and interactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { PostService } from '../services/postService';
import { useAuth } from '../hooks/useAuth';
import { Post, Comment } from '../types';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import moment from 'moment';

interface PostDetailScreenProps {
  route: any;
  navigation: any;
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ route, navigation }) => {
  const { postId } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await PostService.getPost(postId);
      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await PostService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      const isLiked = post.likes.includes(user.id);
      if (isLiked) {
        await PostService.unlikePost(post.id, user.id);
      } else {
        await PostService.likePost(post.id, user.id);
      }
      await loadPost();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;

    setSubmitting(true);
    try {
      await PostService.addComment(
        postId, 
        user.id, 
        user.displayName, 
        commentText.trim(), 
        user.photoURL || undefined
      );
      setCommentText('');
      await loadComments();
      await loadPost();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      if (isLiked) {
        await PostService.unlikeComment(postId, commentId, user.id);
      } else {
        await PostService.likeComment(postId, commentId, user.id);
      }
      await loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error.main} />
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.content}>
        {/* Post */}
        <PostCard
          post={post}
          currentUserId={user?.id || ''}
          onLike={handleLike}
          onComment={() => {}}
          onUserPress={() => navigation.navigate('Profile', { userId: post.userId })}
        />

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <Text style={styles.commentTime}>
                  {moment(comment.createdAt.toDate()).fromNow()}
                </Text>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={() => handleLikeComment(comment.id, comment.likes.includes(user?.id || ''))}
                >
                  <Ionicons
                    name={comment.likes.includes(user?.id || '') ? 'heart' : 'heart-outline'}
                    size={18}
                    color={comment.likes.includes(user?.id || '') ? colors.error.main : colors.text.secondary}
                  />
                  <Text style={styles.commentActionText}>{comment.likeCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
          onPress={handleComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <Ionicons name="send" size={20} color={colors.primary.contrast} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.h4.fontSize,
    color: colors.error.main,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  commentsSection: {
    padding: spacing.md,
  },
  commentsTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  commentCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    fontSize: typography.body2.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
  },
  commentTime: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  commentContent: {
    fontSize: typography.body2.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentActionText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body2.fontSize,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
