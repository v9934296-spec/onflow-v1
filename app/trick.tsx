import { useEffect, useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { color, space, textStyle } from "@/ui/tokens";
import { Button } from "@/ui/components/Button";
import { TrickCard } from "@/ui/components/Cards";
import { Chip, FilterPill } from "@/ui/components/Chip";
import { TextField } from "@/ui/components/Form";
import { EmptyState, ErrorPanel, Skeleton } from "@/ui/components/States";
import { ScreenHeader, ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { loadTrickCatalog, readRecentTrickIds, rememberConfirmedTrick } from "@/store/tricks";
import { selectCatalogTrick } from "@/store/sessionActions";
import { useSessionStore } from "@/store/sessionStore";
import type { CatalogTrick } from "@/domain/models";
import {
  DIRECTION_OPTIONS,
  STANCE_OPTIONS,
  categoriesOf,
  filterTricks,
  nearestTricks,
  popularFromRecent,
} from "@/domain/tricks";

export default function TrickScreen() {
  const router = useRouter();
  const existing = useSessionStore((s) => s.trick);
  const [tricks, setTricks] = useState<CatalogTrick[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [picked, setPicked] = useState<CatalogTrick | null>(null);
  const [stance, setStance] = useState<string | null>(existing?.stance ?? null);
  const [direction, setDirection] = useState<string | null>(existing?.direction ?? null);

  useEffect(() => {
    void loadTrickCatalog().then((res) => {
      if (!res.ok) setError(true);
      else setTricks(res.data);
    });
  }, []);

  useEffect(() => {
    if (!tricks || !existing) return;
    const match = tricks.find((item) => item.trickId === existing.trickId);
    if (match) setPicked(match);
  }, [tricks, existing]);

  const categories = useMemo(() => (tricks ? categoriesOf(tricks) : []), [tricks]);
  const recent = useMemo(() => {
    if (!tricks) return [];
    const ids = readRecentTrickIds();
    return ids.map((id) => tricks.find((t) => t.trickId === id)).filter((t): t is CatalogTrick => t != null);
  }, [tricks]);
  const popular = useMemo(() => (tricks ? popularFromRecent(tricks, readRecentTrickIds()) : []), [tricks]);

  const filtered = useMemo(() => {
    if (!tricks) return [];
    const hits = filterTricks(tricks, query, category);
    if (hits.length > 0) return hits;
    return nearestTricks(tricks, query);
  }, [tricks, query, category]);

  const exactEmpty = Boolean(tricks && filterTricks(tricks, query, category).length === 0);

  if (error) return <ErrorPanel kind="offline" onPrimary={() => router.back()} />;
  if (!tricks) {
    return (
      <ScreenSafeArea style={{ padding: space.xl }}>
        <Skeleton height={48} />
        <Skeleton height={48} />
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea style={{ padding: space.xl, gap: space.md }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScreenHeader kicker="Call" title="CHOOSE TRICK" />
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        accessibilityLabel="Search tricks"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        <FilterPill label="All" selected={category == null} onPress={() => setCategory(null)} />
        {categories.map((item) => (
          <FilterPill
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }}>
        {recent.length > 0 && !query ? (
          <View style={{ marginBottom: space.lg, gap: space.sm }}>
            <Text style={{ ...textStyle.label, color: color.textSecondary }}>Recent</Text>
            {recent.slice(0, 4).map((trick) => (
              <TrickCard
                key={`recent-${trick.trickId}`}
                trick={trick}
                selected={picked?.trickId === trick.trickId}
                onPress={() => setPicked(trick)}
              />
            ))}
          </View>
        ) : null}
        {popular.length > 0 && !query ? (
          <View style={{ marginBottom: space.lg, gap: space.sm }}>
            <Text style={{ ...textStyle.label, color: color.textSecondary }}>Popular</Text>
            {popular.map((trick) => (
              <TrickCard
                key={`popular-${trick.trickId}`}
                trick={trick}
                selected={picked?.trickId === trick.trickId}
                onPress={() => setPicked(trick)}
              />
            ))}
          </View>
        ) : null}
        {filtered.length === 0 ? (
          <EmptyState title="No matches" body="Try a shorter name. Custom names aren't in the registry yet." />
        ) : (
          <>
            {exactEmpty ? (
              <Text style={{ ...textStyle.bodySm, color: color.textTertiary, marginBottom: space.sm }}>
                Nearest matches from the registry.
              </Text>
            ) : null}
            {filtered.map((trick) => (
              <View key={trick.trickId} style={{ marginBottom: space.sm }}>
                <TrickCard
                  trick={trick}
                  selected={picked?.trickId === trick.trickId}
                  onPress={() => setPicked(trick)}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <Text style={{ ...textStyle.label, color: color.textSecondary }}>Stance</Text>
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        {STANCE_OPTIONS.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={stance === item}
            onPress={() => setStance(stance === item ? null : item)}
          />
        ))}
      </ScrollView>
      <Text style={{ ...textStyle.label, color: color.textSecondary }}>Direction</Text>
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm }}>
        {DIRECTION_OPTIONS.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={direction === item}
            onPress={() => setDirection(direction === item ? null : item)}
          />
        ))}
      </ScrollView>
      <Button
        label="Confirm trick"
        disabled={!picked}
        onPress={() => {
          if (!picked) return;
          Keyboard.dismiss();
          useSessionStore.getState().setTrick(selectCatalogTrick(picked, { stance, direction }));
          rememberConfirmedTrick(picked.trickId);
          router.replace("/capture");
        }}
      />
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
