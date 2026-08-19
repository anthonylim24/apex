import React from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, touch, type } from '../theme';

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

const buttonColors: Record<ButtonVariant, { bg: string; pressed: string; text: string }> = {
  primary: { bg: colors.accent, pressed: colors.accentPressed, text: colors.textInverse },
  secondary: { bg: colors.surfaceRaised, pressed: colors.surfacePressed, text: colors.text },
  ghost: { bg: 'transparent', pressed: colors.surface, text: colors.textSecondary },
  danger: { bg: colors.dangerMuted, pressed: '#4D2A30', text: colors.danger },
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
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
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}) => {
  const palette = buttonColors[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      hitSlop={touch.hitSlop}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: pressed ? palette.pressed : palette.bg },
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <AppText variant="bodyBold" color={palette.text}>
          {label}
        </AppText>
      )}
    </Pressable>
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
  <View testID={testID} style={[styles.card, style]}>
    {children}
  </View>
);

export const Badge = ({
  label,
  color = colors.textSecondary,
  background = colors.surfaceRaised,
}: {
  label: string;
  color?: string;
  background?: string;
}) => (
  <View style={[styles.badge, { backgroundColor: background }]}>
    <AppText variant="caption" color={color}>
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
  if (!scroll) {
    return (
      <View testID={testID} style={[styles.screen, { paddingTop: insets.top }, padding]}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      testID={testID}
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[padding, { paddingBottom: spacing.xxxl + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
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
    <View style={styles.emptyGlyph}>
      <AppText variant="title" color={colors.accent}>
        ◆
      </AppText>
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
    <View style={styles.segmented} testID={testID} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <AppText
              variant="caption"
              color={selected ? colors.textInverse : colors.textSecondary}
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
  return (
    <View style={styles.chipRow} testID={testID}>
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
            accessibilityLabel={option.label}
            onPress={() => onToggle(option.value)}
            style={[styles.chip, isOn && styles.chipSelected]}
          >
            <AppText variant="caption" color={isOn ? colors.textInverse : colors.textSecondary}>
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
    minHeight: touch.min,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonCompact: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: { opacity: 0.45 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  screen: { flex: 1, backgroundColor: colors.bg },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyGlyph: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { marginBottom: spacing.sm, textAlign: 'center' },
  emptyMessage: { textAlign: 'center', lineHeight: 22 },
  emptyAction: { marginTop: spacing.xl, alignSelf: 'stretch' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: colors.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 44,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
});
