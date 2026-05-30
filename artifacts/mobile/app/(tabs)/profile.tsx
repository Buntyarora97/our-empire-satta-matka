import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleCopyReferral() {
    if (!user?.referralCode) return;
    await Clipboard.setStringAsync(user.referralCode);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      logout();
      router.replace("/(auth)/login");
      return;
    }
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const menuItems = [
    { icon: "list", label: "Bet History", onPress: () => router.push("/bet-history") },
    { icon: "bell", label: "Notifications", onPress: () => router.push("/notifications") },
    { icon: "lock", label: "Change Password", onPress: () => {} },
    { icon: "headphones", label: "Support", onPress: () => {} },
    { icon: "info", label: "About App", onPress: () => {} },
  ];

  const s = styles(colors);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.fullName ?? "U")[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.userName}>{user?.fullName ?? "User"}</Text>
          <Text style={s.userPhone}>{user?.phone ?? ""}</Text>
        </View>
        <View style={s.balBadge}>
          <Text style={s.balBadgeLabel}>Balance</Text>
          <Text style={s.balBadgeAmount}>₹{Number(user?.balance ?? 0).toLocaleString("en-IN")}</Text>
        </View>
      </View>

      {user?.referralCode && (
        <Pressable style={s.referralCard} onPress={handleCopyReferral}>
          <View>
            <Text style={s.referralLabel}>Your Referral Code</Text>
            <Text style={s.referralCode}>{user.referralCode}</Text>
          </View>
          <View style={s.copyBtn}>
            <Feather name={copied ? "check" : "copy"} size={16} color={copied ? colors.success : colors.primary} />
            <Text style={[s.copyText, copied && { color: colors.success }]}>
              {copied ? "Copied!" : "Copy"}
            </Text>
          </View>
        </Pressable>
      )}

      <View style={s.menuCard}>
        {menuItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              s.menuItem,
              i < menuItems.length - 1 && s.menuItemBorder,
              pressed && { opacity: 0.7 },
            ]}
            onPress={item.onPress}
          >
            <View style={s.menuIconWrap}>
              <Feather name={item.icon as "list"} size={18} color={colors.primary} />
            </View>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <Pressable style={s.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={colors.error} />
        <Text style={s.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 18,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 22, fontWeight: "800", color: "#fff" },
    userName: { fontSize: 17, fontWeight: "700", color: c.text },
    userPhone: { fontSize: 13, color: c.mutedForeground, marginTop: 2 },
    balBadge: {
      alignItems: "flex-end",
      backgroundColor: c.primary + "15",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    balBadgeLabel: { fontSize: 10, color: c.mutedForeground, marginBottom: 2 },
    balBadgeAmount: { fontSize: 15, fontWeight: "700", color: c.primary },
    referralCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.primary + "40",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    referralLabel: { fontSize: 12, color: c.mutedForeground, marginBottom: 4 },
    referralCode: { fontSize: 20, fontWeight: "800", color: c.gold, letterSpacing: 2 },
    copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    copyText: { color: c.primary, fontWeight: "600", fontSize: 13 },
    menuCard: {
      marginHorizontal: 16,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
    },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    menuLabel: { flex: 1, fontSize: 15, color: c.text, fontWeight: "500" },
    logoutBtn: {
      marginHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: c.error + "15",
      borderWidth: 1,
      borderColor: c.error + "40",
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 8,
    },
    logoutText: { color: c.error, fontWeight: "700", fontSize: 15 },
  });
