import React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

/** Authored tab marks — one stroke family, no unicode stand-ins. */
export const TrainTabIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" accessibilityElementsHidden>
    <Line x1={3} y1={11} x2={19} y2={11} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    <Rect x={5} y={6} width={3} height={10} rx={1} fill={color} />
    <Rect x={14} y={6} width={3} height={10} rx={1} fill={color} />
  </Svg>
);

export const LibraryTabIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" accessibilityElementsHidden>
    <Circle cx={11} cy={5.5} r={2.2} fill="none" stroke={color} strokeWidth={2} />
    <Polyline
      points="11,8 11,13 7,18"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={11} y1={13} x2={15.5} y2={17} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const ProgressTabIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" accessibilityElementsHidden>
    <Polyline
      points="3,16 8,11 11,13 18,5"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={18.5} cy={4.8} r={2.2} fill="none" stroke={color} strokeWidth={2} />
  </Svg>
);

export const ProfileTabIcon = ({ color }: { color: ColorValue }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" accessibilityElementsHidden>
    <Circle cx={11} cy={7} r={3} fill="none" stroke={color} strokeWidth={2.2} />
    <Polyline
      points="5,18 5,16 9,13 13,13 17,16 17,18"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
