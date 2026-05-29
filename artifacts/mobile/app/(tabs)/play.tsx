import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetMarkets } from "@workspace/api-client-react";
import { MarketCard } from "@/components/MarketCard";
import { useColors } from "@/hooks/useColors";

export default function PlayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useGetMarkets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const openMarkets = (data?.markets ?? []).filter((m) => {
    if (!m.isActive) return false;
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];
    const closeDt = new Date(`${todayDate}T${m.closeTime}`);
    return now < closeDt;
  });

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Text style={s.title}>Play</Text>
        <Text style={s.subtitle}>Open markets available for betting</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : openMarkets.length === 0 ? (
        <View style={s.empty}>
          <Feather name="clock" size={48} color={colors.mutedForeground} />
          <Text style={s.emptyTitle}>No Open Markets</Text>
          <Text style={s.emptyDesc}>
            All markets are currently closed. Check back during market hours.
          </Text>
        </View>
      ) : (
        <FlatList
          data={openMarkets}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MarketCard
              market={item}
              onPress={() => router.push(`/market/${item.id}`)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90,
          }}
          refreshControl={
            <RefreshControl onRefresh={refetch} refreshing={false} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 20, paddingBottom: 16 },
    title: { fontSize: 24, fontWeight: "800", color: c.text },
    subtitle: { fontSize: 13, color: c.mutedForeground, marginTop: 2 },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      gap: 12,
      marginTop: -80,
    },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: c.text },
    emptyDesc: { fontSize: 14, color: c.mutedForeground, textAlign: "center", lineHeight: 20 },
  });
