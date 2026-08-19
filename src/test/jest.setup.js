/* Global Jest setup: silence noisy RN warnings and provide stable mocks for
 * native modules so every test runs headlessly in Node/CI. */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, ScrollView, Image } = require('react-native');
  const passthrough = (Component) => {
    const Wrapped = React.forwardRef((props, ref) =>
      React.createElement(Component, { ...props, ref }),
    );
    Wrapped.displayName = `Animated(${Component.displayName ?? Component.name ?? 'Component'})`;
    return Wrapped;
  };
  return {
    __esModule: true,
    default: {
      View: passthrough(View),
      Text: passthrough(Text),
      ScrollView: passthrough(ScrollView),
      Image: passthrough(Image),
      createAnimatedComponent: (Component) => passthrough(Component),
    },
    useReducedMotion: () => true,
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (factory) => factory(),
    withTiming: (value) => value,
    withSequence: (...values) => values[values.length - 1],
    withDelay: (_delay, value) => value,
    withSpring: (value) => value,
    Easing: { out: () => () => 0, quad: () => 0, linear: () => 0 },
  };
});

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn().mockResolvedValue(undefined),
}));
