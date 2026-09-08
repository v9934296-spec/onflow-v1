import { Fragment, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CatalogTrick } from "@/domain/models";
import { rankTricksForProfile } from "@/domain/skaterProfile";
import {
  DIRECTION_OPTIONS,
  STANCE_OPTIONS,
  categoriesOf,
  filterTricks,
  nearestTricks,
  popularFromUsage,
  usageCount,
} from "@/domain/tricks";
import { selectCatalogTrick } from "@/store/sessionActions";
import { useSessionStore } from "@/store/sessionStore";
import { useSkaterProfileStore } from "@/store/skaterProfileStore";
import {
  loadTrickCatalog,
  readRecentTrickIds,
  readTrickUsage,
  rememberConfirmedTrick,
} from "@/store/tricks";
import { TextField } from "@/ui/components/Form";
import { OnFlowButton } from "@/ui/components/OnFlowButton";
import { OnFlowDivider } from "@/ui/components/OnFlowDivider";
import { OnFlowHeader } from "@/ui/components/OnFlowHeader";
import { OnFlowMeta } from "@/ui/components/OnFlowMeta";
import { ScreenSafeArea } from "@/ui/components/ScreenChrome";
import { SegmentedSelector } from "@/ui/components/SegmentedSelector";
import { EmptyState, ErrorPanel, Skeleton } from "@/ui/components/States";
import { TrickRow } from "@/ui/components/TrickRow";
import { stanceExplainer } from "@/ui/copy/personalization";
import { color, space, textStyle } from "@/ui/tokens";

/**
 * Calling the trick. A list of names until one is picked, then a footer for
 * the modifiers and one confirm — the modifiers only matter once there is a
 * trick to modify, and keeping them out of the way until then leaves the list
 * as tall as the screen allows.
 *
 * Canonical identity always comes from the server registry: search can fall
 * back to nearest names, never to an invented one.
 */
export default function TrickScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const existing = useSessionStore((s) => s.trick);
  const profile = useSkaterProfileStore((s) => s.profile);
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

  const usage = useMemo(() => readTrickUsage(), [tricks]);
  const categories = useMemo(() => (tricks ? categoriesOf(tricks) : []), [tricks]);

  const recent = useMemo(() => {
    if (!tricks) return [];
    return readRecentTrickIds()
      .map((id) => tricks.find((t) => t.trickId === id))
      .filter((t): t is CatalogTrick => t != null)
      .slice(0, 4);
  }, [tricks]);

  const popular = useMemo(() => (tricks ? popularFromUsage(tricks, usage) : []), [tricks, usage]);

  const filtered = useMemo(() => {
    if (!tricks) return [];
    const hits = filterTricks(tricks, query, category);
    // Profile styles reorder; they never remove a registry trick.
    return rankTricksForProfile(hits.length > 0 ? hits : nearestTricks(tricks, query), profile);
  }, [tricks, query, category, profile]);

  const browsing = !query && !category;
  const exactEmpty = Boolean(tricks && filterTricks(tricks, query, category).length === 0);

  if (error) {
    return (
      <ScreenSafeArea style={{ justifyContent: "center" }}>
        <ErrorPanel kind="offline" onPrimary={() => router.back()} />
      </ScreenSafeArea>
    );
  }

  if (!tricks) {
    return (
      <ScreenSafeArea style={{ padding: space.lg }}>
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </ScreenSafeArea>
    );
  }

  const explainer = stanceExplainer(profile?.naturalStance ?? null);

  return (
    <ScreenSafeArea>
      <OnFlowHeader
        title="CHOOSE TRICK"
        right={<OnFlowButton label="Close" size="compact" variant="quiet" onPress={() => router.back()} />}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md }}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            accessibilityLabel="Search tricks"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.lg }}
        >
          <CategoryTab label="All" selected={category == null} onPress={() => setCategory(null)} />
          {categories.map((item) => (
            <CategoryTab
              key={item}
              label={item}
              selected={category === item}
              onPress={() => setCategory(category === item ? null : item)}
            />
          ))}
        </ScrollView>

        <OnFlowDivider />

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {browsing && recent.length > 0 ? (
            <Section label="Recent">
              {recent.map((trick) => (
                <Fragment key={`recent-${trick.trickId}`}>
                  <TrickRow
                    trick={trick}
                    uses={usageCount(usage, trick.trickId)}
                    selected={picked?.trickId === trick.trickId}
                    onPress={() => setPicked(trick)}
                  />
                  <OnFlowDivider />
                </Fragment>
              ))}
            </Section>
          ) : null}

          {browsing && popular.length > 0 ? (
            <Section label="Most called">
              {popular.map((trick) => (
                <Fragment key={`popular-${trick.trickId}`}>
                  <TrickRow
                    trick={trick}
                    uses={usageCount(usage, trick.trickId)}
                    selected={picked?.trickId === trick.trickId}
                    onPress={() => setPicked(trick)}
                  />
                  <OnFlowDivider />
                </Fragment>
              ))}
            </Section>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              title="No matches"
              body="Try a shorter name. Custom names aren't in the registry yet."
            />
          ) : (
            <Section label={browsing ? "All tricks" : "Results"}>
              {exactEmpty ? (
                <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
                  <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>
                    Nearest matches from the registry.
                  </Text>
                </View>
              ) : null}
              {filtered.map((trick) => (
                <Fragment key={trick.trickId}>
                  <TrickRow
                    trick={trick}
                    uses={usageCount(usage, trick.trickId)}
                    selected={picked?.trickId === trick.trickId}
                    onPress={() => setPicked(trick)}
                  />
                  <OnFlowDivider />
                </Fragment>
              ))}
            </Section>
          )}
        </ScrollView>

        {picked ? (
          <View>
            <OnFlowDivider weight="rule" />
            <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm }}>
              <Text numberOfLines={1} style={{ ...textStyle.slateSm, color: color.textPrimary }}>
                {picked.name.toUpperCase()}
              </Text>
              <OnFlowMeta items={["Stance"]} tone="tertiary" />
              <SegmentedSelector
                options={STANCE_OPTIONS}
                value={stance}
                onChange={setStance}
                accessibilityLabel="Stance"
              />
              {explainer ? (
                <Text style={{ ...textStyle.bodySm, color: color.textTertiary }}>{explainer}</Text>
              ) : null}
              <OnFlowMeta items={["Direction"]} tone="tertiary" />
              <SegmentedSelector
                options={DIRECTION_OPTIONS}
                value={direction}
                onChange={setDirection}
                accessibilityLabel="Direction"
              />
            </View>
            <View
              style={{
                paddingHorizontal: space.lg,
                paddingTop: space.md,
                paddingBottom: Math.max(insets.bottom, space.md),
              }}
            >
              <OnFlowButton
                label="Confirm"
                size="hero"
                haptic
                onPress={() => {
                  useSessionStore.getState().setTrick(selectCatalogTrick(picked, { stance, direction }));
                  rememberConfirmedTrick(picked.trickId);
                  router.replace("/capture");
                }}
              />
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
        <OnFlowMeta items={[label]} tone="tertiary" />
      </View>
      <OnFlowDivider />
      {children}
    </View>
  );
}

/** A category is a filter, not a tag: text with a volt rule under the active one. */
function CategoryTab({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ paddingVertical: space.md, minHeight: 48, justifyContent: "center" }}
    >
      <Text
        style={{
          ...textStyle.meta,
          color: selected ? color.neon : color.textTertiary,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
