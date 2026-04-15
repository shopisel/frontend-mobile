import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useAuth } from "../src/auth/AuthProvider";
import { SplashScreen } from "../src/components/screens/SplashScreen";

export default function Index() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    if (initialized && splashFinished) {
      if (isAuthenticated) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [initialized, splashFinished, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <SplashScreen onComplete={() => setSplashFinished(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
