import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, List, ScanLine, BarChart2, User } from "lucide-react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/theme/ThemeProvider";

const tabs = [
  { name: "home", labelKey: "tabs.home", icon: Home },
  { name: "lists", labelKey: "tabs.lists", icon: List },
  { name: "scan", labelKey: "tabs.scan", icon: ScanLine },
  { name: "prices", labelKey: "tabs.prices", icon: BarChart2 },
  { name: "profile", labelKey: "tabs.profile", icon: User },
] as const;

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = tabs[index];
        const isActive = state.index === index;
        const isScan = tab.name === "scan";
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            style={styles.tab}
          >
            {isScan ? (
              <View style={styles.scanButton}>
                <Icon size={24} color="#fff" strokeWidth={2} />
              </View>
            ) : (
              <>
                {isActive && <View style={styles.activePill} />}
                <View style={{ position: "relative" }}>
                  <Icon
                    size={24}
                    color={isActive ? colors.primary600 : colors.gray400}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </View>
                <Text style={[styles.label, { color: isActive ? colors.primary600 : colors.gray400, fontWeight: isActive ? "700" : "500" }]}>
                  {t(tab.labelKey)}
                </Text>
              </>
            )}
            {isScan && (
              <Text style={[styles.label, { color: isActive ? colors.primary600 : colors.gray400 }]}> 
                {t(tab.labelKey)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="lists" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="prices" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingVertical: 4,
    position: "relative",
  },
  activePill: {
    position: "absolute",
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 99,
    backgroundColor: colors.primary600,
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary600,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    shadowColor: colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: 10,
  },
  });
}
