import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { OnboardingScreen } from "../src/components/screens/OnboardingScreen";

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <OnboardingScreen onComplete={() => router.replace("/auth")} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
