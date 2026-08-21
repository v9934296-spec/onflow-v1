import * as SecureStore from "expo-secure-store";

const TOKEN = "onflow.session.token";
const USER = "onflow.session.userId";

export async function saveSession(token: string, userId: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN, token);
  await SecureStore.setItemAsync(USER, userId);
}

export async function loadSession(): Promise<{ token: string; userId: string } | null> {
  const token = await SecureStore.getItemAsync(TOKEN);
  const userId = await SecureStore.getItemAsync(USER);
  if (!token || !userId) return null;
  return { token, userId };
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN);
  await SecureStore.deleteItemAsync(USER);
}
