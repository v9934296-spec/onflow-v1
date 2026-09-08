import { PROFILE_LIMITS, dedupeBrands } from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { TagInput } from "@/ui/components/TagInput";
import { onboardingCopy } from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";

export default function BrandsScreen() {
  const { position, goNext, goBack } = useOnboardingStep("brands");
  const brands = useSkaterProfileStore((s) => s.draft.favoriteBrands);
  const updateDraft = useSkaterProfileStore((s) => s.updateDraft);
  return (
    <OnboardingFrame
      position={position}
      title={onboardingCopy.brands.title}
      body={onboardingCopy.brands.body}
      nextLabel={onboardingCopy.next}
      onNext={goNext}
      onBack={goBack}
      onSkip={goNext}
    >
      <TagInput
        values={brands}
        onChange={(next) => updateDraft({ favoriteBrands: next })}
        normalize={dedupeBrands}
        placeholder={onboardingCopy.brands.placeholder}
        addLabel={onboardingCopy.brands.add}
        maxLength={PROFILE_LIMITS.brand}
      />
    </OnboardingFrame>
  );
}
