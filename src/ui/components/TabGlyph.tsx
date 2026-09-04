import Svg, { Circle, Path, Rect } from "react-native-svg";

type Glyph = "home" | "flow" | "history" | "profile";

export function TabGlyph({
  name,
  color,
  focused,
}: {
  name: Glyph;
  color: string;
  focused: boolean;
}) {
  const stroke = focused ? 2.2 : 1.8;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no">
      {name === "home" ? (
        <Path
          d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      ) : null}
      {name === "flow" ? (
        <Path
          d="M4 14c2.4-4 4.4-6 8-6s5.6 2 8 6M4 10c2.4 4 4.4 6 8 6s5.6-2 8-6"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ) : null}
      {name === "history" ? (
        <>
          <Circle cx="12" cy="13" r="7" fill="none" stroke={color} strokeWidth={stroke} />
          <Path d="M12 10v3.2L14 15" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <Rect x="9" y="3" width="6" height="2" rx="1" fill={color} />
        </>
      ) : null}
      {name === "profile" ? (
        <>
          <Circle cx="12" cy="8" r="3.2" fill="none" stroke={color} strokeWidth={stroke} />
          <Path
            d="M5.5 19c.8-3.2 3-5 6.5-5s5.7 1.8 6.5 5"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </>
      ) : null}
    </Svg>
  );
}
