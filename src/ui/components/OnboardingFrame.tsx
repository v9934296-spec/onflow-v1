import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, dynamicTypeMaxScale, space, textStyle } from "../tokens";
import { OnFlowButton } from "./OnFlowButton";
import { OnFlowDivider } from "./OnFlowDivider";
import { OnFlowMeta } from "./OnFlowMeta";
import { ScreenSafeArea } from "./ScreenChrome";

/**
 * One onboarding step. Step counter in meta, title in display type, one
 * sentence of body, the question, and a fixed footer with the primary action.
 * Content goes edge-to-edge; the frame pads only the words.
 */
export function OnboardingFrame({
  position,
  title,
  body,
  children,
  nextLabel,
  nextDisabled = false,
  nextLoading = false,
  onNext,
  onBack,
  onSkip,
  backLabel = "Back",
  skipLabel = "Skip",
}: {
  position?: { index: number; total: number } | null;
  title: string;
  body?: string;
  children?: ReactNode;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  backLabel?: string;
  skipLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScreenSafeArea>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: space.xl }}
        >
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.lg, gap: space.sm }}>
            {position ? (
              <OnFlowMeta items={[`Step ${position.index} / ${position.total}`]} tone="neon" />
            ) : null}
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={dynamicTypeMaxScale.display}
              style={{ ...textStyle.hero, color: color.textPrimary }}
            >
              {title}
            </Text>
            {body ? (
              <Text style={{ ...textStyle.body, color: color.textSecondary }}>{body}</Text>
            ) : null}
          </View>
          {children}
        </ScrollView>
        <OnFlowDivider />
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.md),
            gap: space.sm,
          }}
        >
          <OnFlowButton
            label={nextLabel}
            disabled={nextDisabled}
            loading={nextLoading}
            onPress={onNext}
          />
          {onBack || onSkip ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {onBack ? (
                <OnFlowButton label={backLabel} size="compact" variant="secondary" onPress={onBack} />
              ) : (
                <View />
              )}
              {onSkip ? (
                <OnFlowButton label={skipLabel} size="compact" variant="ghost" onPress={onSkip} />
              ) : null}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
