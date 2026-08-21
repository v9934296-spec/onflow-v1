import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { color, radius, space, textStyle, touchTarget } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { EmptyState, ErrorPanel, Skeleton } from "@/ui/components/States";
import { loadTrickCatalog } from "@/store/tricks";
import { selectCatalogTrick } from "@/store/sessionActions";
import { useSessionStore } from "@/store/sessionStore";
import type { CatalogTrick } from "@/domain/models";

export default function TrickScreen() {
  const router = useRouter();
  const [tricks, setTricks] = useState<CatalogTrick[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<CatalogTrick | null>(null);

  useEffect(() => {
    void loadTrickCatalog().then((res) => {
      if (!res.ok) setError(true);
      else setTricks(res.data);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!tricks) return [];
    const q = query.trim().toLowerCase();
    if (!q) return tricks.slice(0, 12);
    return tricks
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 12);
  }, [tricks, query]);

  if (error) return <ErrorPanel kind="offline" onPrimary={() => router.back()} />;
  if (!tricks) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xl }}>
        <Skeleton height={48} />
        <Skeleton height={48} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, padding: space.xl, gap: space.md }}>
      <Text style={{ ...textStyle.h1, color: color.textPrimary }}>CHOOSE TRICK</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        placeholderTextColor={color.textTertiary}
        style={{
          ...textStyle.body,
          color: color.textPrimary,
          borderWidth: 1,
          borderColor: color.hairlineHi,
          borderRadius: radius.md,
          padding: space.lg,
          minHeight: touchTarget.minimum,
        }}
      />
      <ScrollView style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <EmptyState title="No matches" body="Try a shorter name. Custom names aren't in the registry yet." />
        ) : (
          filtered.map((trick) => {
            const selected = picked?.trickId === trick.trickId;
            return (
              <Pressable
                key={trick.trickId}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPicked(trick)}
                style={{
                  minHeight: touchTarget.minimum,
                  padding: space.lg,
                  borderRadius: radius.md,
                  borderWidth: 2,
                  borderColor: selected ? color.neon : color.hairline,
                  backgroundColor: selected ? color.surfaceAlt : color.surface,
                  marginBottom: space.sm,
                }}
              >
                <Text style={{ ...textStyle.bodyLg, color: color.textPrimary }}>{trick.name}</Text>
                <Text style={{ ...textStyle.mono, color: color.textTertiary }}>{trick.category}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      <Button
        label="Confirm trick"
        disabled={!picked}
        onPress={() => {
          if (!picked) return;
          useSessionStore.getState().setTrick(selectCatalogTrick(picked));
          router.replace("/capture");
        }}
      />
    </View>
  );
}
