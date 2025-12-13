/**
 * Custom Hooks for Posts
 */

import { useState, useEffect, useCallback } from 'react';
import { Post, PostType, PostVisibility } from '../types';
import PostService from '../services/postService';

export const usePosts = (villageId?: string, pageSize: number = 20) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (refresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const doc = refresh ? undefined : lastDoc;
      const { posts: newPosts, lastDoc: newLastDoc } = await PostService.getPosts(
        pageSize,
        doc,
        villageId
      );

      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setLastDoc(newLastDoc);
      setHasMore(newPosts.length === pageSize);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [villageId, pageSize, lastDoc]);

  useEffect(() => {
    loadPosts(true);
  }, [villageId]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    loadPosts(true);
  }, [loadPosts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  }, [loading, hasMore, loadPosts]);

  return { posts, loading, error, hasMore, refresh, loadMore };
};

export const usePost = (postId: string) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await PostService.getPost(postId);
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  return { post, loading, error };
};

export const useCreatePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (
    userId: string,
    userName: string,
    content: string,
    type: PostType = PostType.TEXT,
    mediaUris?: string[],
    villageId?: string,
    villageName?: string,
    visibility: PostVisibility = PostVisibility.PUBLIC,
    tags: string[] = []
  ) => {
    try {
      setLoading(true);
      setError(null);
      const postId = await PostService.createPost(
        userId,
        userName,
        content,
        type,
        mediaUris,
        villageId,
        villageName,
        visibility,
        tags
      );
      return postId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading, error };
};

export const useLikePost = () => {
  const [loading, setLoading] = useState(false);

  const likePost = async (postId: string, userId: string, isLiked: boolean) => {
    try {
      setLoading(true);
      if (isLiked) {
        await PostService.unlikePost(postId, userId);
      } else {
        await PostService.likePost(postId, userId);
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { likePost, loading };
};
