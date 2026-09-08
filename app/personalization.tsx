import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EXPERIENCE_LEVELS,
  NATURAL_STANCES,
  PROFILE_LIMITS,
  SKATE_STYLES,
  completionErrors,
  dedupeBrands,
  draftFromProfile,
  isOnboardingComplete,
  setPrimaryStyle,
  toggleStyle,
} from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnFlowButton } from "@/ui/components/OnFlowButton";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowHeader } from "@/ui/components/OnFlowHeader";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { OptionList } from "@/ui/components/OptionList";
import { TagInput } from "@/ui/components/TagInput";
import { TextField } from "@/ui/components/Form";
import { ErrorPanel } from "@/ui/components/States";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import {
  experienceCopy,
  onboardingCopy,
  stanceCopy,
  styleCopy,
} from "@/ui/copy/personalization";
import { space } from "@/ui/tokens";

/**
 * Edits every profile field after onboarding under the same rules. The save is
 * optimistic only because the store restores the last server-confirmed profile
 * on failure.
 */
export default function PersonalizationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useSkaterProfileStore((s) => s.profile);
  const saving = useSkaterProfileStore((s) => s.saving);
  const error = useSkaterProfileStore((s) => s.error);
  const saveProfile = useSkaterProfileStore((s) => s.saveProfile);
  const clearError = useSkaterProfileStore((s) => s.clearError);
  const [local, setLocal] = useState(() => draftFromProfile(profile));

  const completed = isOnboardingComplete(profile);
  const blocked = completed && completionErrors(local).length > 0;

  return (
    <ScreenSafeArea>
      <OnFlowHeader
        title="PERSONALIZATION"
        meta={["Private", completed ? "Complete" : "Incomplete"]}
        right={<OnFlowButton label="Close" size="compact" variant="ghost" onPress={() => router.back()} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space.xl }}>
          <Section label="Stance">
            <OptionList
              options={NATURAL_STANCES.map((value) => ({ value, ...stanceCopy[value] }))}
              selected={local.naturalStance ? [local.naturalStance] : []}
              onToggle={(value) => setLocal({ ...local, naturalStance: value })}
            />
          </Section>
          <Section label="Styles">
            <OptionList
              options={SKATE_STYLES.map((value) => ({ value, ...styleCopy[value] }))}
              selected={local.skateStyles}
              primary={local.primarySkateStyle}
              onToggle={(value) => setLocal(toggleStyle(local, value))}
              onSetPrimary={(value) => setLocal(setPrimaryStyle(local, value))}
            />
          </Section>
          <Section label="Level">
            <OptionList
              options={EXPERIENCE_LEVELS.map((value) => ({ value, ...experienceCopy[value] }))}
              selected={local.experienceLevel ? [local.experienceLevel] : []}
              onToggle={(value) => setLocal({ ...local, experienceLevel: value })}
            />
          </Section>
          <Section label="Spots">
            <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
              <TextField
                value={local.city ?? ""}
                onChangeText={(next) => setLocal({ ...local, city: next.slice(0, PROFILE_LIMITS.city) })}
                placeholder={onboardingCopy.spots.city}
                autoCapitalize="words"
              />
              <TextField
                value={local.homePark ?? ""}
                onChangeText={(next) => setLocal({ ...local, homePark: next.slice(0, PROFILE_LIMITS.homePark) })}
                placeholder={onboardingCopy.spots.homePark}
                autoCapitalize="words"
              />
            </View>
          </Section>
          <Section label="Brands">
            <TagInput
              values={local.favoriteBrands}
              onChange={(next) => setLocal({ ...local, favoriteBrands: next })}
              normalize={dedupeBrands}
              placeholder={onboardingCopy.brands.placeholder}
              addLabel={onboardingCopy.brands.add}
              maxLength={PROFILE_LIMITS.brand}
            />
          </Section>
          {error ? <ErrorPanel kind={error} onPrimary={clearError} /> : null}
        </ScrollView>
        <OnFlowDivider />
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.md),
          }}
        >
          <OnFlowButton
            label="Save"
            loading={saving}
            disabled={blocked}
            onPress={() => {
              void saveProfile(local).then((ok) => {
                if (ok) router.back();
              });
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
        <OnFlowMeta items={[label]} tone="neon" />
      </View>
      {children}
    </View>
  );
}
