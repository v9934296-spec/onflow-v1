import { Text } from "react-native";
import { color, textStyle } from "../tokens";

export function StateTag({
  children,
  tone = "alum",
}: {
  children: string;
  tone?: "alum" | "neon" | "danger";
}) {
  const tint = tone === "neon" ? color.neon : tone === "danger" ? color.red : color.alum;
  return (
    <Text style={{ ...textStyle.mono, color: tint, textTransform: "uppercase" }}>{children}</Text>
  );
}
