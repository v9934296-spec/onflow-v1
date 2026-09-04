import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { color, textStyle } from "../tokens";
import { engineRingDashOffset } from "./engineMarks";

export function EngineRing({
  label,
  score,
  size = 112,
}: {
  label: string;
  score: number | null;
  size?: number;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = engineRingDashOffset(score, c);
  const present = offset != null;
  const clamped = present && score != null ? Math.max(0, Math.min(10, score)) : 0;

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <View
        accessibilityLabel={present ? `${label} ${Math.round(clamped)} of 10` : `${label}, no score`}
        style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      >
        <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color.hairline}
            strokeWidth={stroke}
          />
          {present ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color.neon}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${c} ${c}`}
              strokeDashoffset={offset}
            />
          ) : null}
        </Svg>
        <Text
          style={{
            ...textStyle.mono,
            fontSize: present ? 22 : 11,
            color: present ? color.textPrimary : color.textTertiary,
            letterSpacing: present ? 0 : 1.2,
            textTransform: present ? "none" : "uppercase",
          }}
        >
          {present ? String(Math.round(clamped)) : "—"}
        </Text>
      </View>
      <Text style={{ ...textStyle.h2, fontSize: 18, lineHeight: 18, color: color.textPrimary }}>
        {label}
      </Text>
      <Text
        style={{
          ...textStyle.mono,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: present ? color.neon : color.textTertiary,
        }}
      >
        {present ? "Returned" : "No score"}
      </Text>
    </View>
  );
}
