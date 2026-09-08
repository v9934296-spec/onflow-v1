import { SKATE_STYLES, setPrimaryStyle, toggleStyle } from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { OptionList } from "@/ui/components/OptionList";
import { onboardingCopy, styleCopy } from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";

export default function StylesScreen() {
  const { position, goNext, goBack } = useOnboardingStep("styles");
  const draft = useSkaterProfileStore((s) => s.draft);
  const updateDraft = useSkaterProfileStore((s) => s.updateDraft);
  return (
    <OnboardingFrame
      position={position}
      title={onboardingCopy.styles.title}
      body={onboardingCopy.styles.body}
      nextLabel={onboardingCopy.next}
      nextDisabled={draft.skateStyles.length === 0}
      onNext={goNext}
      onBack={goBack}
    >
      <OptionList
        options={SKATE_STYLES.map((value) => ({ value, ...styleCopy[value] }))}
        selected={draft.skateStyles}
        primary={draft.primarySkateStyle}
        onToggle={(value) => updateDraft(toggleStyle(draft, value))}
        onSetPrimary={(value) => updateDraft(setPrimaryStyle(draft, value))}
      />
    </OnboardingFrame>
  );
}
