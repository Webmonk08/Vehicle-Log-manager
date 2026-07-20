import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LoadStatus, TripStatus } from "@/types";

const LOAD_STATUS_COLORS: Record<LoadStatus, string> = {
  pending: "#9CA3AF",
  in_transit: "#3B82F6",
  delivered: "#F97316",
  collected: "#22C55E",
};

const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  ongoing: "#3B82F6",
  completed: "#22C55E",
};

const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  pending: "Pending",
  in_transit: "In Transit",
  delivered: "Delivered",
  collected: "Collected",
};

interface Props {
  status: LoadStatus | TripStatus;
  kind?: "load" | "trip";
  onPress?: () => void;
}

export function StatusChip({ status, kind = "load", onPress }: Props) {
  const color =
    kind === "load"
      ? LOAD_STATUS_COLORS[status as LoadStatus]
      : TRIP_STATUS_COLORS[status as TripStatus];
  const label =
    kind === "load" ? LOAD_STATUS_LABELS[status as LoadStatus] : (status as string);

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={[styles.chip, { backgroundColor: `${color}22`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: "600" },
});
