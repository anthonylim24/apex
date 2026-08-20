import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clay } from '../clay';
import { colors, radius, spacing, tones, touch, type, type Tone } from '../theme';

const PRESS_SPRING = { damping: 16, stiffness: 380, mass: 0.4 } as const;

type TypeToken = keyof typeof type;

export const AppText = ({
  variant = 'body',
  color = colors.text,
  style,
  children,
  ...rest
}: React.ComponentProps<typeof Text> & {
  variant?: TypeToken;
  color?: ColorValue;
}) => (
  <Text {...rest} style={[type[variant] as TextStyle, { color }, style]}>
    {children}
  </Text>
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

const buttonTone: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: colors.mint, text: colors.onAccent },
  secondary: { bg: colors.purple, text: colors.onAccent },
  ghost: { bg: 'transparent', text: colors.textSecondary },
  danger: { bg: colors.pink, text: colors.onAccent },
};

const sizeForVariant: Record<ButtonVariant, ButtonSize> = {
  primary: 'lg',
  secondary: 'md',
  danger: 'md',
  ghost: 'sm',
};

const SINK: Record<ButtonSize, number> = { lg: 7, md: 4, sm: 3 };

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size,
  disabled = false,
  loading = false,
  compact = false,
  style,
  testID,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}) => {
  const palette = buttonTone[variant];
  const weight: ButtonSize = compact ? 'sm' : (size ?? sizeForVariant[variant]);
  const reducedMotion = useReducedMotion();
  const sink = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sink.value }],
  }));
  const flatStyle = StyleSheet.flatten(style);
  const sprungMinHeight = flatStyle && 'minHeight' in flatStyle ? flatStyle.minHeight : undefined;

  const springTo = (next: number) => {
    if (reducedMotion) return;
    // eslint-disable-next-line react-hooks/immutability -- SharedValue
    sink.value = withSpring(next, PRESS_SPRING);
  };

  const isQuiet = variant === 'ghost';
  const cushion = weight === 'lg' ? clay.controlLg : clay.control;

  return (
    <Animated.View style={[animatedStyle, !isQuiet && cushion, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => springTo(SINK[weight])}
        onPressOut={() => springTo(0)}
        hitSlop={touch.hitSlop}
        style={({ pressed }) => [
          styles.button,
          weight === 'lg' && styles.buttonLg,
          weight === 'md' && styles.buttonMd,
          weight === 'sm' && styles.buttonSm,
          isQuiet && styles.buttonQuiet,
          { backgroundColor: isQuiet ? 'transparent' : palette.bg },
          pressed && !isQuiet ? clay.controlActive : null,
          (disabled || loading) && styles.buttonDisabled,
          sprungMinHeight != null ? { minHeight: sprungMinHeight } : null,
        ]}
      >
        {!isQuiet ? (
          <View
            style={[styles.buttonShine, weight === 'lg' && styles.buttonShineLg]}
            pointerEvents="none"
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <AppText
            variant="bodyBold"
            color={palette.text}
            style={[
              styles.buttonLabel,
              weight === 'lg' && styles.buttonLabelLg,
              weight === 'md' && styles.buttonLabelMd,
              weight === 'sm' && styles.buttonLabelSm,
            ]}
          >
            {label}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const Card = ({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) => (
  <View testID={testID} style={[styles.card, clay.card, style]}>
    <View style={styles.cardShine} pointerEvents="none" />
    <View style={styles.cardLip} pointerEvents="none" />
    {children}
  </View>
);

export const Badge = ({
  label,
  color,
  background,
  tone,
}: {
  label: string;
  color?: string;
  background?: string;
  tone?: Tone;
}) => {
  const bg = tone ? tones[tone] : (background ?? colors.purple);
  const fg = tone || !color ? colors.onAccent : color;
  return (
    <View style={[styles.badge, clay.control, { backgroundColor: bg }]}>
      <AppText variant="caption" color={fg} style={styles.badgeLabel}>
        {label}
      </AppText>
    </View>
  );
};

export const Blob = ({
  tone = 'purple',
  size = 56,
  bounce = false,
  delay = 0,
  children,
}: {
  tone?: Tone;
  size?: number;
  bounce?: boolean;
  delay?: number;
  children?: React.ReactNode;
}) => {
  const reducedMotion = useReducedMotion();
  const hop = useSharedValue(0);
  useEffect(() => {
    if (!bounce || reducedMotion) return;
    hop.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 640, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 640, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [bounce, delay, reducedMotion, hop]);
  const hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.value }],
  }));
  return (
    <Animated.View
      style={[
        styles.blob,
        clay.blob,
        hopStyle,
        {
          width: size,
          height: size,
          borderRadius: radius.blob,
          backgroundColor: tones[tone],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const Stat = ({
  label,
  value,
  tone = 'mint',
  testID,
}: {
  label: string;
  value: string;
  tone?: keyof typeof tones;
  testID?: string;
}) => (
  <View style={[styles.stat, clay.card]} testID={testID}>
    <AppText variant="display" color={tones[tone]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </AppText>
    <AppText variant="caption" color={colors.textSecondary}>
      {label}
    </AppText>
  </View>
);

export const Screen = ({
  children,
  scroll = true,
  padded = true,
  testID,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  testID?: string;
}) => {
  const insets = useSafeAreaInsets();
  const padding = padded
    ? { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }
    : undefined;
  const ambientLight = (
    <LinearGradient
      colors={[colors.bgTop, colors.bg]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screenLight}
      pointerEvents="none"
    />
  );
  if (!scroll) {
    return (
      <View testID={testID} style={[styles.screen, { paddingTop: insets.top }, padding]}>
        {ambientLight}
        {children}
      </View>
    );
  }
  return (
    <View style={styles.screen}>
      {ambientLight}
      <ScrollView
        testID={testID}
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={[padding, { paddingBottom: spacing.xxxl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
};

export const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) => (
  <View style={styles.empty} testID={testID}>
    <View style={[styles.emptyPal, clay.card]}>
      <Image
        source={require('../../../assets/pouf-pals/idle.jpg')}
        style={styles.emptyPalImage}
        accessibilityIgnoresInvertColors
      />
    </View>
    <AppText variant="heading" style={styles.emptyTitle}>
      {title}
    </AppText>
    <AppText variant="body" color={colors.textSecondary} style={styles.emptyMessage}>
      {message}
    </AppText>
    {actionLabel && onAction ? (
      <Button label={actionLabel} onPress={onAction} style={styles.emptyAction} />
    ) : null}
  </View>
);

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  testID?: string;
}) {
  return (
    <View style={[styles.segmented, clay.field]} testID={testID} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected, selected && clay.control]}
          >
            <AppText
              variant="caption"
              color={selected ? colors.onAccent : colors.textSecondary}
              style={styles.buttonLabel}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Multi-select chip row used by the library filters and onboarding. */
export function ChipRow<T extends string>({
  options,
  selected,
  onToggle,
  testID,
}: {
  options: { value: T; label: string }[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  testID?: string;
}) {
  const chipTones = [tones.mint, tones.pink, tones.purple, tones.blue, tones.yellow, tones.orange];
  return (
    <View style={styles.chipRow} testID={testID}>
      {options.map((option, index) => {
        const isOn = selected.includes(option.value);
        const fill = chipTones[index % chipTones.length];
        return (
          <Pressable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
            accessibilityLabel={option.label}
            onPress={() => onToggle(option.value)}
            style={[
              styles.chip,
              isOn ? clay.control : clay.field,
              { backgroundColor: isOn ? fill : colors.surface },
            ]}
          >
            <AppText variant="caption" color={isOn ? colors.onAccent : colors.textSecondary} style={styles.buttonLabel}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  buttonLg: { minHeight: 72, paddingHorizontal: spacing.xxl },
  buttonMd: { minHeight: 52, paddingHorizontal: spacing.xl },
  buttonSm: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: 16 },
  buttonQuiet: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(201, 168, 255, 0.55)',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: { fontFamily: type.bodyBold.fontFamily, fontWeight: '800' },
  buttonLabelLg: { fontSize: 18, fontWeight: '800' },
  buttonLabelMd: { fontSize: 15, fontWeight: '800' },
  buttonLabelSm: { fontSize: 13, fontWeight: '800' },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  buttonShineLg: { height: 9, backgroundColor: 'rgba(255,255,255,0.46)' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xl + 10,
    marginBottom: 4,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 10,
    backgroundColor: 'rgba(156, 124, 220, 0.22)',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  screenLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeLabel: { fontWeight: '800' },
  blob: { alignItems: 'center', justifyContent: 'center' },
  stat: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.lg + 10,
    gap: spacing.xs,
  },
  screen: { flex: 1, backgroundColor: colors.bg },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.md },
  emptyPal: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  emptyPalImage: { width: '100%', height: '100%' },
  emptyTitle: { marginBottom: spacing.sm, textAlign: 'center' },
  emptyMessage: { textAlign: 'center', lineHeight: 22 },
  emptyAction: { marginTop: spacing.xl, alignSelf: 'stretch' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfacePressed,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: colors.mint },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 44,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
});
