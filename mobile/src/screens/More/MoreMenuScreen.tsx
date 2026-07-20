import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<MoreStackParamList, "MoreMenu">;

const ITEMS: { label: string; screen: keyof MoreStackParamList; icon: string }[] = [
  { label: "Customers", screen: "CustomersList", icon: "👤" },
  { label: "Products", screen: "ProductsList", icon: "📦" },
  { label: "Places", screen: "PlacesList", icon: "📍" },
  { label: "Charge Rules", screen: "ChargeRulesList", icon: "💰" },
  { label: "Reports", screen: "Reports", icon: "📊" },
];

export function MoreMenuScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => (
        <Pressable
          key={item.screen}
          style={styles.row}
          onPress={() => navigation.navigate(item.screen as any)}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.rowText}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16, gap: 8 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
  },
  icon: { fontSize: 18 },
  rowText: { flex: 1, fontWeight: "600", color: "#111827" },
  chevron: { color: "#9CA3AF", fontSize: 20 },
});
