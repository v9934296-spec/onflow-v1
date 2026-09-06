import { useEffect } from "react";
import { useRouter } from "expo-router";
import {
  onboardingSteps,
  stepAfter,
  stepBefore,
  stepPosition,
  type OnboardingStep,
} from "@/domain/skaterProfile";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";

/**
 * Linear onboarding navigation. Every step records itself as the draft's
 * resume point on mount, so an interrupted run comes back to the same screen.
 * Steps `replace` each other — there is no stack to fall out of.
 */
export function useOnboardingStep(step: OnboardingStep) {
  const router = useRouter();
  const setDraftStep = useSkaterProfileStore((s) => s.setDraftStep);
  const steps = onboardingSteps();

  useEffect(() => {
    setDraftStep(step);
  }, [setDraftStep, step]);

  const next = stepAfter(step, steps);
  const back = stepBefore(step, steps);

  return {
    position: stepPosition(step, steps),
    goNext: () => {
      if (next) router.replace(`/(onboarding)/${next}`);
    },
    goBack: back ? () => router.replace(`/(onboarding)/${back}`) : undefined,
    goTo: (target: OnboardingStep) => router.replace(`/(onboarding)/${target}`),
  };
}
