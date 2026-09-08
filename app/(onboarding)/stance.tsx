import { NATURAL_STANCES } from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { OptionList } from "@/ui/components/OptionList";
import { onboardingCopy, stanceCopy } from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";

export default function StanceScreen() {
  const { position, goNext, goBack } = useOnboardingStep("stance");
  const stance = useSkaterProfileStore((s) => s.draft.naturalStance);
  const updateDraft = useSkaterProfileStore((s) => s.updateDraft);
  return (
    <OnboardingFrame
      position={position}
      title={onboardingCopy.stance.title}
      body={onboardingCopy.stance.body}
      nextLabel={onboardingCopy.next}
      nextDisabled={!stance}
      onNext={goNext}
      onBack={goBack}
    >
      <OptionList
        options={NATURAL_STANCES.map((value) => ({ value, ...stanceCopy[value] }))}
        selected={stance ? [stance] : []}
        onToggle={(value) => updateDraft({ naturalStance: value })}
      />
    </OnboardingFrame>
  );
}
