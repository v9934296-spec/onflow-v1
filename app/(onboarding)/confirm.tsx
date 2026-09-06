import { Fragment } from "react";
import { Text, View } from "react-native";
import {
  completionErrors,
  normalizeDraft,
  type OnboardingStep,
  type RequiredProfileField,
} from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { ErrorPanel } from "@/ui/components/States";
import {
  experienceCopy,
  onboardingCopy,
  stanceCopy,
  styleCopy,
} from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";
import { color, space, textStyle } from "@/ui/tokens";

const STEP_FOR_FIELD: Record<RequiredProfileField, OnboardingStep> = {
  naturalStance: "stance",
  skateStyles: "styles",
  primarySkateStyle: "styles",
  experienceLevel: "experience",
  ageRange: "age",
};

/**
 * Compact summary, then the one action that talks to the server. Failure keeps
 * every answer and offers a single retry; the root router moves the skater to
 * Home only once the server confirms completion.
 */
export default function ConfirmScreen() {
  const { goBack, goTo } = useOnboardingStep("confirm");
  const draft = useSkaterProfileStore((s) => s.draft);
  const saving = useSkaterProfileStore((s) => s.saving);
  const error = useSkaterProfileStore((s) => s.error);
  const completeOnboarding = useSkaterProfileStore((s) => s.completeOnboarding);
  const clearError = useSkaterProfileStore((s) => s.clearError);

  const profile = normalizeDraft(draft);
  const missing = completionErrors(profile);
  const firstMissing = missing[0];

  const rows: Array<[string, string | null]> = [
    ["Stance", profile.naturalStance ? stanceCopy[profile.naturalStance].label : null],
    [
      "Styles",
      profile.skateStyles.length > 0
        ? profile.skateStyles
            .map((s) => (s === profile.primarySkateStyle ? `${styleCopy[s].label} ★` : styleCopy[s].label))
            .join(" · ")
        : null,
    ],
    ["Level", profile.experienceLevel ? experienceCopy[profile.experienceLevel].label : null],
    ["Spots", [profile.homePark, profile.city].filter(Boolean).join(" · ") || null],
    ["Brands", profile.favoriteBrands.length > 0 ? profile.favoriteBrands.join(" · ") : null],
  ];

  return (
    <OnboardingFrame
      title={onboardingCopy.confirm.title}
      body={onboardingCopy.confirm.body}
      nextLabel={onboardingCopy.confirm.action}
      nextDisabled={missing.length > 0}
      nextLoading={saving}
      onNext={() => void completeOnboarding()}
      onBack={goBack}
    >
      {firstMissing ? (
        <ErrorPanel kind="profile_invalid" onPrimary={() => goTo(STEP_FOR_FIELD[firstMissing])} />
      ) : error ? (
        <ErrorPanel
          kind={error}
          onPrimary={() => {
            clearError();
            void completeOnboarding();
          }}
        />
      ) : null}
      <View>
        <OnFlowDivider />
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 }}>
              <OnFlowMeta items={[label]} tone="tertiary" />
              <Text style={{ ...(value ? textStyle.h2 : textStyle.bodySm), color: value ? color.textPrimary : color.textTertiary }}>
                {value ?? "—"}
              </Text>
            </View>
            <OnFlowDivider />
          </Fragment>
        ))}
      </View>
    </OnboardingFrame>
  );
}
