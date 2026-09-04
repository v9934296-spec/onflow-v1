import { useId, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

/**
 * Informal grit for non-camera surfaces only. Never drawn over a live feed.
 */
export function AsphaltBackdrop({ opacity = 1 }: { opacity?: number }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const patternId = `asphalt-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
      style={[StyleSheet.absoluteFill, { backgroundColor: "#0C0C0D", opacity }]}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <Pattern id={patternId} x="0" y="0" width="19" height="23" patternUnits="userSpaceOnUse">
              <Line x1="18" y1="0" x2="18" y2="23" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <Line x1="0" y1="22" x2="19" y2="22" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${patternId})`} />
        </Svg>
      ) : null}
    </View>
  );
}

export function AsphaltSurface({ children }: { children?: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0C0C0D" }}>
      <AsphaltBackdrop />
      {children}
    </View>
  );
}
