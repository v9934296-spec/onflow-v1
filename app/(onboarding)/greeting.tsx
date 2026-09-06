import { OnboardingFrame } from "@/ui/components/OnboardingFrame";
import { onboardingCopy } from "@/ui/copy/personalization";
import { useOnboardingStep } from "@/ui/hooks/useOnboardingStep";

export default function GreetingScreen() {
  const { goNext } = useOnboardingStep("greeting");
  return (
    <OnboardingFrame
      title={onboardingCopy.greeting.title}
      body={onboardingCopy.greeting.body}
      nextLabel={onboardingCopy.greeting.action}
      onNext={goNext}
    />
  );
}
