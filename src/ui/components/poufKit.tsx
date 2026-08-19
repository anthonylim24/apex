import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { clay } from '../clay';
import { colors, fonts, radius, spacing, tones, touch, type Tone } from '../theme';
import { AppText } from './primitives';

type FieldInputProps = Omit<TextInputProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/** Recessed clay text field — 1st-Pouf `--pouf-field`. */
export const FieldInput = ({ style, ...rest }: FieldInputProps) => (
  <View style={[styles.fieldShell, clay.field, style]}>
    <TextInput placeholderTextColor={colors.textTertiary} {...rest} style={styles.field} />
  </View>
);

export const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.fieldWrap}>
    <AppText variant="label" color={colors.textTertiary}>
      {label}
    </AppText>
    {children}
    {hint ? (
      <AppText variant="caption" color={colors.textTertiary}>
        {hint}
      </AppText>
    ) : null}
  </View>
);

/** Clay avatar — initials sit on a pastel blob. */
export const Avatar = ({
  initials,
  tone = 'pink',
  size = 64,
  testID,
}: {
  initials: string;
  tone?: Tone;
  size?: number;
  testID?: string;
}) => (
  <View
    testID={testID}
    style={[
      styles.avatar,
      clay.blob,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: tones[tone] },
    ]}
    accessibilityRole="image"
    accessibilityLabel={initials}
  >
    <AppText variant="heading" color={colors.onAccent}>
      {initials.slice(0, 2).toUpperCase()}
    </AppText>
  </View>
);

/** Clay switch — thumb is a cushion that slides onto mint. */
export const Switch = ({
  value,
  onValueChange,
  label,
  testID,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
  testID?: string;
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
    accessibilityLabel={label}
    onPress={() => onValueChange(!value)}
    hitSlop={touch.hitSlop}
    style={styles.switchRow}
  >
    <View style={[styles.switchTrack, clay.field, value && styles.switchTrackOn]}>
      <View style={[styles.switchThumb, clay.control, value && styles.switchThumbOn]} />
    </View>
    <AppText variant="bodyBold">{label}</AppText>
  </Pressable>
);

/** Segmented clay pips for wizards and the player exercise track. */
export const ProgressPips = ({
  total,
  current,
  testID,
}: {
  total: number;
  current: number;
  testID?: string;
}) => (
  <View
    style={styles.pips}
    testID={testID}
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 1, max: total, now: current + 1 }}
  >
    {Array.from({ length: total }, (_, index) => (
      <View
        key={index}
        style={[
          styles.pip,
          index < current && styles.pipDone,
          index === current && styles.pipNow,
        ]}
      />
    ))}
  </View>
);

/** Tinted clay cushion for coach notes, suggestions, sync status. */
export const Callout = ({
  tone = 'mint',
  title,
  children,
  testID,
  style,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.callout, clay.control, { backgroundColor: tones[tone] }, style]} testID={testID}>
    {title ? (
      <AppText variant="bodyBold" color={colors.onAccent}>
        {title}
      </AppText>
    ) : null}
    {typeof children === 'string' ? (
      <AppText variant="body" color={colors.onAccent}>
        {children}
      </AppText>
    ) : (
      children
    )}
  </View>
);

/** Pressable clay row for logs and trend lists. */
export const ListRow = ({
  title,
  subtitle,
  meta,
  onPress,
  testID,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? title}
    onPress={onPress}
    style={({ pressed }) => [styles.listRow, clay.row, pressed && styles.listRowPressed]}
  >
    <View style={styles.listRowMain}>
      {meta ? (
        <AppText variant="caption" color={colors.mint}>
          {meta}
        </AppText>
      ) : null}
      <AppText variant="bodyBold">{title}</AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
    <AppText variant="body" color={colors.textTertiary}>
      ›
    </AppText>
  </Pressable>
);

export const Divider = () => <View style={styles.divider} />;

/** Resting Pouf Pal still — empty states and idle chrome. */
export const PoufIdle = ({ size = 88 }: { size?: number }) => (
  <Image
    source={require('../../../assets/pouf-pals/idle.jpg')}
    style={{ width: size, height: size, borderRadius: radius.lg }}
    accessibilityIgnoresInvertColors
  />
);

const styles = StyleSheet.create({
  fieldWrap: { gap: spacing.sm },
  fieldShell: {
    minHeight: touch.min,
    borderRadius: radius.md,
    backgroundColor: colors.surfacePressed,
    justifyContent: 'center',
  },
  field: {
    minHeight: touch.min,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.min,
  },
  switchTrack: {
    width: 56,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  switchTrackOn: { backgroundColor: colors.mint },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.purple,
  },
  switchThumbOn: { alignSelf: 'flex-end', backgroundColor: colors.yellow },
  pips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  pip: {
    flex: 1,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfacePressed,
  },
  pipDone: { backgroundColor: colors.purple },
  pipNow: { backgroundColor: colors.mint, height: 12 },
  callout: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
    gap: spacing.md,
  },
  listRowPressed: { backgroundColor: colors.surfacePressed },
  listRowMain: { flex: 1, gap: 2 },
  divider: {
    height: 2,
    backgroundColor: 'rgba(201, 168, 255, 0.22)',
    borderRadius: 1,
    marginVertical: spacing.sm,
  },
});
