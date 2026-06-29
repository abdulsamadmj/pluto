import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Pressable,
  type RefreshControlProps,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";
import type { DeviceItem } from "./device-list-item";
import { WarrantyCard } from "./warranty-card";

const H_PADDING = 16;
const RATIO = 1.6;
/** Fraction of a card that peeks out behind the one in front of it. */
const PEEK_RATIO = 0.46;

/**
 * Apple-Wallet-style stack: cards overlap into a deck with the FIRST card on
 * top and fully visible, and the rest peeking below it. As you scroll, the top
 * card lifts and fades away to reveal the next one. Driven off a single scroll
 * shared value.
 */
export function WalletDeck({
  devices,
  refreshControl,
  footer,
}: {
  devices: DeviceItem[];
  refreshControl?: ReactElement<RefreshControlProps>;
  footer?: ReactElement | null;
}) {
  const { width: screenW } = useWindowDimensions();
  const cardW = screenW - H_PADDING * 2;
  const cardH = cardW / RATIO;
  const peek = Math.round(cardH * PEEK_RATIO);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const deckHeight = (devices.length - 1) * peek + cardH + 16;

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: H_PADDING,
        paddingTop: 8,
        paddingBottom: 112,
      }}
    >
      <View style={{ height: deckHeight }}>
        {devices.map((device, i) => (
          <DeckCard
            key={device.id}
            device={device}
            index={i}
            total={devices.length}
            cardW={cardW}
            cardH={cardH}
            peek={peek}
            scrollY={scrollY}
          />
        ))}
      </View>
      {footer}
    </Animated.ScrollView>
  );
}

function DeckCard({
  device,
  index,
  total,
  cardW,
  cardH,
  peek,
  scrollY,
}: {
  device: DeviceItem;
  index: number;
  total: number;
  cardW: number;
  cardH: number;
  peek: number;
  scrollY: Animated.SharedValue<number>;
}) {
  const router = useRouter();

  // Per-card mount animation (staggered settle-in).
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withDelay(index * 70, withTiming(1, { duration: 420 }));
  }, [enter, index]);

  // White frame on the focused card (the one fully visible at the top of the
  // stack), fading out for neighbours — the single, clear separator.
  const focusBorder = useAnimatedStyle(() => {
    const dist = Math.abs(scrollY.value / peek - index);
    const alpha = interpolate(dist, [0, 0.45], [1, 0], Extrapolation.CLAMP);
    return { borderColor: `rgba(255,255,255,${alpha})` };
  });

  const style = useAnimatedStyle(() => {
    // Card's top edge relative to the top of the scroll viewport.
    const relativeY = index * peek - scrollY.value;

    // As the front card scrolls above the top, it lifts away: fades + recedes.
    const scale = interpolate(
      relativeY,
      [-cardH * 0.6, 0],
      [0.9, 1],
      Extrapolation.CLAMP
    );
    const leaveOpacity = interpolate(
      relativeY,
      [-cardH * 0.55, -cardH * 0.15],
      [0, 1],
      Extrapolation.CLAMP
    );

    const enterY = (1 - enter.value) * 28;

    return {
      transform: [{ translateY: enterY }, { scale }],
      opacity: leaveOpacity * enter.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: index * peek,
          left: 0,
          right: 0,
          // First card sits in front and fully visible; rest peek behind.
          zIndex: total - index,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: total - index,
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => router.push(`/devices/${device.id}`)}
        className="active:opacity-90"
      >
        <WarrantyCard device={device} width={cardW} />
      </Pressable>
      {/* Focused-card frame (drawn over the card, no layout impact) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
            borderWidth: 2,
          },
          focusBorder,
        ]}
      />
    </Animated.View>
  );
}
