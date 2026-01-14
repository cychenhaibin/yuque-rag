import React from 'react';
import Svg, {
  G,
  Defs,
  Path,
  Mask,
  Circle,
  Rect,
  ClipPath,
  LinearGradient,
  Stop,
  Line,
  Text,
} from 'react-native-svg';
interface CropIconProps {
  width?: number;
  height?: number;
  color?: string;
  colorbg?: string;
  isFavorite?: boolean;
}

export const Logo: React.FC<CropIconProps> = ({
  width = 200,
  height = 100,
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 700 300"
      fill="none"
    >
      <Defs>
        <LinearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#ee4d2d" />
          <Stop offset="100%" stopColor="#ff6b4a" />
        </LinearGradient>
      </Defs>
      <G opacity="0.3">
        <Line
          x1="50"
          y1="120"
          x2="180"
          y2="120"
          stroke="#ee4d2d"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Line
          x1="60"
          y1="145"
          x2="160"
          y2="145"
          stroke="#ee4d2d"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Line
          x1="40"
          y1="170"
          x2="150"
          y2="170"
          stroke="#ee4d2d"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      <G transform="skewX(-10)">
        <Text
          x="200"
          y="180"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="120"
          fontWeight="900"
          fill="url(#mainGradient)"
          letterSpacing="-3"
        >
          QuickQue
        </Text>
      </G>
      <Path
        d="M 150 155 L 650 140"
        stroke="#ee4d2d"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <Path
        d="M 180 180 L 620 167"
        stroke="#ee4d2d"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <G transform="skewX(-10)">
        <Text
          x="520"
          y="210"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="32"
          fontWeight="700"
          fill="#ee4d2d"
          letterSpacing="1"
        >
          INTELLIGENT
        </Text>
      </G>
    </Svg>
  );
};
