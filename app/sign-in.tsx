import { useState } from "react";
import { Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { color, space, textStyle } from "@/ui/tokens";
import { ErrorPanel } from "@/ui/components/States";
import { useAuthStore } from "@/store/authStore";

export default function SignInScreen() {
  const completeApple = useAuthStore((s) => s.completeApple);
  const [error, setError] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xxl, justifyContent: "center", gap: space.xl }}>
      <Text style={{ ...textStyle.hero, color: color.textPrimary }}>ONFLOW</Text>
      <Text style={{ ...textStyle.body, color: color.textSecondary }}>
        Sign in with Apple. Cancellation returns you here. Your footage stays on the account that filmed it.
      </Text>
      {error ? <ErrorPanel kind="auth_expired" onPrimary={() => setError(false)} /> : null}
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={8}
        style={{ width: "100%", height: 56 }}
        onPress={() => {
          void (async () => {
            try {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
              });
              if (!credential.identityToken) return;
              const ok = await completeApple(credential.identityToken);
              if (!ok) setError(true);
            } catch (err) {
              const code = (err as { code?: string }).code;
              if (code === "ERR_REQUEST_CANCELED") return;
              setError(true);
            }
          })();
        }}
      />
    </View>
  );
}
