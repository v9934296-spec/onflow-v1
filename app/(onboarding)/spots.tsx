import { useState } from "react";
import { View } from "react-native";
import { PROFILE_LIMITS } from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { TextField } from "@/ui/components/Form";
import { onboardingCopy } from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";
import { space } from "@/ui/tokens";

export default function SpotsScreen() {
  const { position, goNext, goBack } = useOnboardingStep("spots");
  const draft = useSkaterProfileStore((s) => s.draft);
  const updateDraft = useSkaterProfileStore((s) => s.updateDraft);
  const [city, setCity] = useState(draft.city ?? "");
  const [homePark, setHomePark] = useState(draft.homePark ?? "");

  const save = () => updateDraft({ city, homePark });

  return (
    <OnboardingFrame
      position={position}
      title={onboardingCopy.spots.title}
      body={onboardingCopy.spots.body}
      nextLabel={onboardingCopy.next}
      onNext={() => {
        save();
        goNext();
      }}
      onBack={() => {
        save();
        goBack?.();
      }}
      onSkip={goNext}
    >
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <TextField
          value={city}
          onChangeText={(next) => setCity(next.slice(0, PROFILE_LIMITS.city))}
          placeholder={onboardingCopy.spots.city}
          accessibilityLabel={onboardingCopy.spots.city}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <TextField
          value={homePark}
          onChangeText={(next) => setHomePark(next.slice(0, PROFILE_LIMITS.homePark))}
          placeholder={onboardingCopy.spots.homePark}
          accessibilityLabel={onboardingCopy.spots.homePark}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>
    </OnboardingFrame>
  );
}
