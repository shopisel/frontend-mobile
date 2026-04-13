import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { AuthScreen } from "../src/components/screens/AuthScreen";
import { useAuth } from "../src/auth/AuthProvider";
import { useEffect } from "react";

export default function Auth() {
  const router = useRouter();
  const { isAuthenticated, login, register, configError } = useAuth();
  const [loading, setLoading] = require("react").useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/(tabs)/home");
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    try { await login(); } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true);
    try { await register(); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={loading}
        configError={configError}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
