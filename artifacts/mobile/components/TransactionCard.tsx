import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface TransactionCardProps {
  tx: {
    id: string;
    type: string;
    amount: number;
    status: string;
    description?: string | null;
    createdAt: string;
  };
}

export function TransactionCard({ tx }: TransactionCardProps) {
  const colors = useColors();

  const isCredit = tx.type === "deposit" || tx.type === "winning";
  const statusColor =
    tx.status === "approved" || tx.status === "completed"
      ? colors.success
      : tx.status === "pending"
      ? colors.warning
      : tx.status === "rejected"
      ? colors.error
      : colors.mutedForeground;

  const iconName =
    tx.type === "deposit" ? "arrow-down-circle" :
    tx.type === "withdrawal" ? "arrow-up-circle" :
    tx.type === "winning" ? "award" : "activity";

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: (isCredit ? colors.success : colors.error) + "20",
    },
    info: { flex: 1 },
    type: { fontSize: 14, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
    desc: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
    right: { alignItems: "flex-end" },
    amount: {
      fontSize: 16,
      fontWeight: "700",
      color: isCredit ? colors.success : colors.error,
    },
    date: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: statusColor + "20",
      marginTop: 4,
    },
    badgeText: { fontSize: 10, color: statusColor, fontWeight: "600", textTransform: "uppercase" },
  });

  return (
    <View style={s.card}>
      <View style={s.iconWrap}>
        <Feather
          name={iconName as "activity"}
          size={18}
          color={isCredit ? colors.success : colors.error}
        />
      </View>
      <View style={s.info}>
        <Text style={s.type}>{tx.type}</Text>
        {tx.description ? <Text style={s.desc}>{tx.description}</Text> : null}
        <Text style={s.desc}>
          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
      <View style={s.right}>
        <Text style={s.amount}>
          {isCredit ? "+" : "-"}₹{tx.amount}
        </Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{tx.status}</Text>
        </View>
      </View>
    </View>
  );
}
