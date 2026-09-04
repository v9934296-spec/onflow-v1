import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { color, glow } from "../tokens";
import { tickCountFilled } from "./engineMarks";

export function TickRuler({
  progress = 0,
  ticks = 28,
}: {
  progress?: number;
  ticks?: number;
}) {
  const filled = tickCountFilled(progress, ticks);
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{
        height: 20,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      {Array.from({ length: ticks }, (_, index) => {
        const major = index % 5 === 0;
        const on = index < filled;
        return (
          <View
            key={index}
            style={{
              width: 2,
              height: major ? 20 : 12,
              borderRadius: 999,
              backgroundColor: on ? color.neon : color.hairlineHi,
              opacity: on && !major ? 0.7 : 1,
            }}
          />
        );
      })}
    </View>
  );
}

export function EngineCore({ active = false, size = 80 }: { active?: boolean; size?: number }) {
  const cx = size / 2;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={size * 0.42} fill="none" stroke={color.hairline} strokeWidth="1" />
        <Circle cx={cx} cy={cx} r={size * 0.28} fill="none" stroke={color.hairlineHi} strokeWidth="1" />
        <Circle cx={cx} cy={cx} r={size * 0.14} fill="none" stroke="rgba(0,255,166,0.4)" strokeWidth="1" />
        <Circle cx={cx} cy={cx} r={6} fill={color.neon} />
      </Svg>
      {active ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: 6,
            ...glow.center,
          }}
        />
      ) : null}
    </View>
  );
}
