import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetUserBalance, useGetWalletHistory } from "@workspace/api-client-react";
import { TransactionCard } from "@/components/TransactionCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, balanceTrigger } = useAuth();

  const { data: balData, refetch: refetchBal } = useGetUserBalance({
    query: { queryKey: ["walletBalance", balanceTrigger] },
  });
  const { data: histData, isLoading, refetch: refetchHist } = useGetWalletHistory();

  const onRefresh = useCallback(() => {
    refetchBal();
    refetchHist();
  }, [refetchBal, refetchHist]);

  const balance = balData?.balance ?? user?.balance ?? 0;
  const transactions = histData?.transactions ?? [];
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const s = styles(colors);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Text style={s.headerTitle}>Wallet</Text>
      </View>

      <View style={s.balCard}>
        <Text style={s.balLabel}>Available Balance</Text>
        <Text style={s.balAmount}>₹{Number(balance).toLocaleString("en-IN")}</Text>
        <View style={s.actionRow}>
          <Pressable
            style={s.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/add-money");
            }}
          >
            <Feather name="arrow-down-circle" size={20} color="#fff" />
            <Text style={s.actionBtnText}>Add Money</Text>
          </Pressable>
          <Pressable
            style={[s.actionBtn, s.withdrawBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/withdraw");
            }}
          >
            <Feather name="arrow-up-circle" size={20} color={colors.primary} />
            <Text style={[s.actionBtnText, { color: colors.primary }]}>Withdraw</Text>
          </Pressable>
        </View>
      </View>

      <Text style={s.sectionTitle}>Transactions</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TransactionCard tx={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90,
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={s.emptyText}>No transactions yet</Text>
            </View>
          }
          refreshControl={
            <RefreshControl onRefresh={onRefresh} refreshing={false} tintColor={colors.primary} />
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
    headerTitle: { fontSize: 24, fontWeight: "800", color: c.text },
    balCard: {
      marginHorizontal: 16,
      marginBottom: 20,
      padding: 24,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.primary + "40",
    },
    balLabel: { fontSize: 13, color: c.mutedForeground, marginBottom: 4 },
    balAmount: { fontSize: 36, fontWeight: "800", color: c.text, marginBottom: 20 },
    actionRow: { flexDirection: "row", gap: 12 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 12,
    },
    withdrawBtn: { backgroundColor: c.primary + "15", borderWidth: 1, borderColor: c.primary },
    actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    empty: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 15, color: c.mutedForeground },
  });
