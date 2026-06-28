import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRouter } from "expo-router";
import { BellOff, CheckCheck, ShieldAlert, ShieldX } from "lucide-react-native";
import { useLayoutEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { timeAgo } from "../../lib/format";
import { Muted } from "../../components/ui";
import {
  markAllNotificationsReadMutationOptions,
  markNotificationReadMutationOptions,
  notificationsQueryOptions,
} from "../../queries/notifications.queries";

const LIST_QUERY = { query: { pageSize: "50" } } as const;

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch, isRefetching } = useQuery(
    notificationsQueryOptions(LIST_QUERY)
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation(
    markNotificationReadMutationOptions({ onSuccess: invalidate })
  );
  const markAll = useMutation(
    markAllNotificationsReadMutationOptions({ onSuccess: invalidate })
  );

  const unread = data?.meta.unread ?? 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        unread > 0 ? (
          <Pressable
            onPress={() => markAll.mutate({})}
            className="mr-3 flex-row items-center gap-1.5 active:opacity-70"
          >
            <CheckCheck color="#00DE6F" size={16} />
            <Text className="text-sm text-primary">Mark all read</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, unread, markAll]);

  const onPress = (id: string, read: boolean, deviceId: string | null) => {
    if (!read) markRead.mutate({ param: { id } });
    if (deviceId) router.push(`/devices/${deviceId}`);
  };

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#00DE6F" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Muted>Failed to load notifications. Pull to retry.</Muted>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={data.data}
        keyExtractor={(n) => n.id}
        contentContainerClassName="gap-2 px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#00DE6F"
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).duration(260)}>
            <NotificationRow
              notification={item}
              onPress={() => onPress(item.id, item.read, item.deviceId)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View className="items-center gap-3 py-24">
            <BellOff color="#52525b" size={40} />
            <Text className="text-base font-medium text-zinc-200">
              You're all caught up
            </Text>
            <Muted className="px-10 text-center">
              No warranty alerts right now — we'll let you know when something
              needs attention.
            </Muted>
          </View>
        }
      />
    </View>
  );
}

type NotificationData = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  deviceId: string | null;
  read: boolean;
  createdAt: string;
};

function NotificationRow({
  notification: n,
  onPress,
}: {
  notification: NotificationData;
  onPress: () => void;
}) {
  const expired = n.type === "expired";
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start gap-3 rounded-2xl border p-4 active:opacity-80 ${
        n.read ? "border-border bg-card" : "border-primary/30 bg-primary/[0.06]"
      }`}
    >
      <View
        className={`size-10 items-center justify-center rounded-full ${
          expired ? "bg-red-500/10" : "bg-amber-500/10"
        }`}
      >
        {expired ? (
          <ShieldX color="#f87171" size={20} />
        ) : (
          <ShieldAlert color="#fbbf24" size={20} />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-base font-semibold text-zinc-100" numberOfLines={1}>
            {n.title}
          </Text>
          {!n.read && <View className="size-2 rounded-full bg-primary" />}
        </View>
        {n.body ? (
          <Text className="mt-0.5 text-sm text-muted" numberOfLines={2}>
            {n.body}
          </Text>
        ) : null}
        <Text className="mt-1 text-xs text-zinc-500">{timeAgo(n.createdAt)}</Text>
      </View>
    </Pressable>
  );
}
