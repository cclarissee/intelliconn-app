import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },

  header: {
    padding: 20,
    paddingTop: 70,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  controls: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 45,
    gap: 6,
  },

  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
  },

  statusRow: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
  },

statusChip: {
  paddingHorizontal: 17,
  paddingVertical: 8,
  borderRadius: 20,
  marginRight: 8,
  alignSelf: "flex-start", 
},

  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default styles;
