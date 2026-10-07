import type { ReactNode } from "react";
import { Text, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { color, radius, space, textStyle } from "../tokens";
import { AsphaltBackdrop } from "./AsphaltSurface";

export function ScreenSafeArea({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <SafeAreaView
      testID={testID}
      edges={["top"]}
      style={[{ flex: 1, backgroundColor: color.bg }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  kicker,
  subtitle,
}: {
  title: string;
  kicker?: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: space.sm }}>
      {kicker ? (
        <Text
          style={{
            ...textStyle.label,
            fontSize: 11,
            letterSpacing: 1.4,
            color: color.neon,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </Text>
      ) : null}
      <Text style={{ ...textStyle.h1, color: color.textPrimary }}>{title}</Text>
      {subtitle ? (
        <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function ScreenHero({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.hairline,
        backgroundColor: color.surface,
        overflow: "hidden",
      }}
    >
      <AsphaltBackdrop opacity={0.8} />
      <View
        style={{
          paddingHorizontal: space.lg,
          paddingTop: space.xl,
          paddingBottom: space.lg,
          gap: space.sm,
        }}
      >
        {kicker ? (
          <Text
            style={{
              ...textStyle.label,
              fontSize: 11,
              letterSpacing: 1.4,
              color: color.neon,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </Text>
        ) : null}
        <Text style={{ ...textStyle.hero, color: color.textPrimary }} maxFontSizeMultiplier={2}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

export function DeckMark() {
  return (
    <Svg width="100%" height={56} viewBox="0 0 220 56" accessible={false} importantForAccessibility="no">
      <Rect x="18" y="18" width="184" height="20" rx="10" fill={color.surfaceAlt} />
      <Rect x="22" y="21" width="176" height="14" rx="7" fill={color.hairlineHi} />
      <Circle cx="48" cy="28" r="11" fill="none" stroke={color.neon} strokeWidth="3" />
      <Circle cx="172" cy="28" r="11" fill="none" stroke={color.alum} strokeWidth="3" />
      <Circle cx="48" cy="28" r="3" fill={color.neon} />
      <Circle cx="172" cy="28" r="3" fill={color.alum} />
    </Svg>
  );
}

export function RailMark() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 180" accessible={false} importantForAccessibility="no">
      <Line x1="28" y1="42" x2="362" y2="148" stroke={color.hairlineHi} strokeWidth="14" strokeLinecap="round" />
      <Line x1="28" y1="42" x2="362" y2="148" stroke={color.alum} strokeWidth="2" />
      <Circle cx="48" cy="50" r="5" fill={color.neon} />
      <Circle cx="342" cy="140" r="5" fill={color.alum} />
    </Svg>
  );
}
