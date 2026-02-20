import FloatingHeader from "@/components/FloatingHeader";
import ShowPost from "@/components/ShowPost";
import SuccessNotification from "@/components/SuccessNotification";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/contexts/ThemeContext";
import { useAnimatedRefresh } from "@/hooks/useAnimatedRefresh";
import { useSuccessNotification } from "@/hooks/useSuccessNotification";
import { Filter, Search } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import styles from "../styles/postStyles";

const STATUS = ["All", "Draft", "Pending", "Approved", "Rejected", "Scheduled", "Published"];

/* =======================
   THEME COLORS
======================= */
const lightTheme = {
  background: "#F9FAFB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  inputBg: "#F1F5F9",
  chipBg: "#E5E7EB",
  chipText: "#374151",
  activeChip: "#2563EB",
  icon: "#6B7280",
};

const darkTheme = {
  background: "#0F172A",
  textPrimary: "#F9FAFB",
  textSecondary: "#9CA3AF",
  inputBg: "#1E293B",
  chipBg: "#334155",
  chipText: "#CBD5E1",
  activeChip: "#3B82F6",
  icon: "#94A3B8",
};

export default function PostScreen() {
  const { theme } = useTheme();
  const colors = theme === "dark" ? darkTheme : lightTheme;
  const { showSuccess, notificationProps } = useSuccessNotification();
  const { spinAnim, pulseAnim, startAnimation: startRefreshAnimation, stopAnimation: stopRefreshAnimation } = useAnimatedRefresh();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    startRefreshAnimation();
    try {
      // Trigger ShowPost to refresh its data
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
      stopRefreshAnimation();
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SuccessNotification {...notificationProps} />
      <FloatingHeader />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Posts
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create, schedule, and manage social posts.
        </Text>
      </View>

      {/* SEARCH + FILTER */}
      <View style={styles.controls}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg }]}>
          <Search size={18} color={colors.icon} />
          <TextInput
            placeholder="Search posts..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <View style={[styles.dropdown, { backgroundColor: colors.inputBg }]}>
          <Filter size={16} color={colors.icon} />
          <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
            {selectedStatus}
          </Text>
        </View>
      </View>

      {/* STATUS FILTER */}
<View style={styles.statusRow}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
  >
    {STATUS.map((status) => {
      const active = selectedStatus === status;
      return (
        <Pressable
          key={status}
          onPress={() => setSelectedStatus(status)}
          style={[
            styles.statusChip,
            {
              backgroundColor: active
                ? colors.activeChip
                : colors.chipBg,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: active ? "#fff" : colors.chipText,
              },
            ]}
          >
            {status}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
</View>

      {/* POSTS LIST */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.activeChip}
            colors={[colors.activeChip]}
          />
        }
      >
        <ShowPost searchQuery={search} statusFilter={selectedStatus} isDashboard={true} onNotify={showSuccess} />
      </ScrollView>
    </ThemedView>
  );
}

