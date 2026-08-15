import ReportSheet from "@/components/ReportSheet";
import { storyActions } from "@/store/storyStore";
import { useAppSelector } from "@/store/hooks";
import { Comment } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/features/story/utils/time";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from '@shopify/flash-list';
import { Screen } from "@/components/ui";
import { useTheme } from "@/constants/theme";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { logger } from '@/utils/logger';

export default function CommentsScreen() {
  const { id, chapter } = useLocalSearchParams<{
    id: string;
    chapter?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentUser = useAppSelector((s) => s.auth.user);
  const storyComments = useAppSelector((s) => s.story.storyComments) ?? [];
  const hasMoreComments = useAppSelector((s) => s.story.storyCommentsHasMore);
  const currentChapterIndex =
    chapter !== undefined ? parseInt(chapter, 10) || 0 : undefined;

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetId: string;
    reportedUserId?: string;
  } | null>(null);
  const [filterChapter, setFilterChapter] = useState(
    currentChapterIndex !== undefined,
  );
  const visibleComments =
    filterChapter && currentChapterIndex !== undefined
      ? storyComments.filter((c) => c.chapterIndex === currentChapterIndex)
      : storyComments;

  const keyboardHeight = useSharedValue(0);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (id) {
      storyActions.setupCommentsListener(id);
    }
    return () => {
      storyActions.cleanupCommentsListener();
    };
  }, [id]);

  useEffect(() => {
    let showTimeout: any;
    let hideTimeout: any;

    const keyboardWillShow = (event: any) => {
      clearTimeout(hideTimeout);
      const { height } = event.endCoordinates;

      showTimeout = setTimeout(() => {
        keyboardHeight.value = withSpring(height, {
          damping: 20,
          stiffness: 200,
        });
      }, 50);
    };

    const keyboardWillHide = () => {
      clearTimeout(showTimeout);

      hideTimeout = setTimeout(() => {
        keyboardHeight.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }, 50);
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideSubscription = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [keyboardHeight]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(`/story/${id}/preview`);
    }
  };

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(-keyboardHeight.value, {
            damping: 20,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  const animatedInputContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: withSpring(keyboardHeight.value > 0 ? 40 : 40, {
        damping: 20,
        stiffness: 200,
      }),
    };
  });

  const scrollContentStyle = {
    paddingBottom: 180,
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser?.id) {
      Alert.alert(
        t("studio.loginRequiredTitle"),
        t("commentsScreen.actionLoginRequired"),
      );
      return;
    }

    try {
      await storyActions.likeComment(id, commentId);
    } catch (error) {
      logger.error("Like comment error:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    if (!currentUser?.id) {
      Alert.alert(
        t("studio.loginRequiredTitle"),
        t("commentsScreen.commentLoginRequired"),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await storyActions.addComment(
        id,
        newComment,
        replyingTo || undefined,
        currentChapterIndex,
      );

      if (result.success) {
        setNewComment("");
        setReplyingTo(null);
      } else {
        Alert.alert(
          t("common.error"),
          result.error || t("conversations.commentFailed"),
        );
      }
    } catch (error) {
      logger.error("Submit comment error:", error);
      Alert.alert(t("common.error"), t("conversations.commentFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      t("commentsScreen.deleteTitle"),
      t("commentsScreen.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await storyActions.deleteComment(id, commentId);
            } catch (error) {
              logger.error("Delete comment error:", error);
            }
          },
        },
      ],
    );
  };

  const renderComment = (comment: Comment, level: number = 0) => (
    <View
      key={comment.id}
      style={[styles.commentItem, { marginLeft: level * 20 }]}
    >
      <View style={styles.commentHeader}>
        <TouchableOpacity
          style={styles.userAvatar}
          onPress={() => router.push(`/user/${comment.user.id}`)}
        >
          {comment.user.profileImage ? (
            <Image
              source={{ uri: comment.user.profileImage }}
              style={styles.userAvatarImage}
            />
          ) : (
            <Ionicons name="person" size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.commentInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{comment.user.displayName}</Text>
          </View>
          <Text style={styles.userHandle}>
            @{comment.user.username || "user"}
          </Text>
        </View>
        <Text style={styles.commentTime}>
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.commentAction}
          onPress={() => handleLikeComment(comment.id)}
        >
          <Ionicons
            name="heart-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.actionText}>{comment.likesCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.commentAction}
          onPress={() => setReplyingTo(comment.id)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.actionText}>{t("commentsScreen.reply")}</Text>
        </TouchableOpacity>

        {currentUser?.id === comment.user.id ? (
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => handleDeleteComment(comment.id)}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.actionText}>{t("common.delete")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() =>
              setReportTarget({
                targetId: comment.id,
                reportedUserId: comment.user.id,
              })
            }
          >
            <Ionicons
              name="flag-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.actionText}>{t("report.report")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => renderComment(reply, level + 1))}
        </View>
      )}
    </View>
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("commentsScreen.title", { count: visibleComments?.length || 0 })}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {currentChapterIndex !== undefined && (
        <View style={styles.chapterFilterRow}>
          <TouchableOpacity
            style={[
              styles.chapterFilterChip,
              !filterChapter && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilterChapter(false)}
          >
            <Text
              style={[
                styles.chapterFilterText,
                !filterChapter && { color: "#fff" },
              ]}
            >
              {t("challengesScreen.filterAll")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chapterFilterChip,
              filterChapter && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilterChapter(true)}
          >
            <Text
              style={[
                styles.chapterFilterText,
                filterChapter && { color: "#fff" },
              ]}
            >
              {t("commentsScreen.thisChapter", {
                chapter: currentChapterIndex + 1,
              })}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlashList
        data={visibleComments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderComment(item)}
        style={styles.commentsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>
              {t("comments.emptyTitle")}
            </Text>
            <Text style={styles.emptyStateMessage}>
              {t("commentsScreen.emptyMessage")}
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMoreComments ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => storyActions.loadMoreComments()}
            >
              <Text style={styles.loadMoreText}>
                {t("commentsScreen.loadMore")}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <Animated.View style={[styles.keyboardAvoidingView, animatedInputStyle]}>
        <Animated.View
          style={[styles.commentInputContainer, animatedInputContainerStyle]}
        >
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                {t("commentsScreen.replyingTo", {
                  name: (storyComments || []).find((c) => c.id === replyingTo)
                    ?.user.displayName,
                })}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputAvatar}>
              {currentUser?.profileImage ? (
                <Image
                  source={{ uri: currentUser.profileImage }}
                  style={styles.inputAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={16} color={colors.primary} />
              )}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder={
                replyingTo
                  ? t("commentsScreen.replyPlaceholder")
                  : t("commentsScreen.commentPlaceholder")
              }
              placeholderTextColor={colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              editable={!isSubmitting}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || isSubmitting) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              <Ionicons
                name="send"
                size={18}
                color={
                  newComment.trim() && !isSubmitting
                    ? colors.white
                    : colors.textLight
                }
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>

      <ReportSheet
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={
          reportTarget
            ? {
                type: "comment",
                targetId: reportTarget.targetId,
                reportedUserId: reportTarget.reportedUserId,
                contextId: String(id),
              }
            : null
        }
      />
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "600",
      color: colors.text,
    },
    chapterFilterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    chapterFilterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceVariant,
    },
    chapterFilterText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    commentsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    loadMoreButton: {
      alignSelf: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 8,
    },
    loadMoreText: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "600",
      color: colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyStateTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    commentItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    userAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInfo: {
      flex: 1,
    },
    userNameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    userName: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "600",
      color: colors.text,
    },
    verifiedBadge: {
      width: 14,
      height: 14,
    },
    userHandle: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.primary,
    },
    commentTime: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
    },
    commentContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    commentActions: {
      flexDirection: "row",
      gap: 20,
    },
    commentAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    repliesContainer: {
      marginTop: 8,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      paddingLeft: 12,
    },
    keyboardAvoidingView: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    commentInputContainer: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 20,
      paddingTop: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    replyingToContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.primaryLight + "30",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    replyingToText: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.primary,
      fontWeight: "500",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 12,
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    inputAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      lineHeight: 18,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      backgroundColor: colors.textLight,
    },
  });
