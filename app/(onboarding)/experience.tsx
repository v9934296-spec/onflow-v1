import { EXPERIENCE_LEVELS } from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { OptionList } from "@/ui/components/OptionList";
import { experienceCopy, onboardingCopy } from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";

export default function ExperienceScreen() {
  const { position, goNext, goBack } = useOnboardingStep("experience");
  const level = useSkaterProfileStore((s) => s.draft.experienceLevel);
  const updateDraft = useSkaterProfileStore((s) => s.updateDraft);
  return (
    <OnboardingFrame
      position={position}
      title={onboardingCopy.experience.title}
      body={onboardingCopy.experience.body}
      nextLabel={onboardingCopy.next}
      nextDisabled={!level}
      onNext={goNext}
      onBack={goBack}
    >
      <OptionList
        options={EXPERIENCE_LEVELS.map((value) => ({ value, ...experienceCopy[value] }))}
        selected={level ? [level] : []}
        onToggle={(value) => updateDraft({ experienceLevel: value })}
      />
    </OnboardingFrame>
  );
}
