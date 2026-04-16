import { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { ShoppingCart, Sparkles } from "lucide-react-native";
import { Colors } from "../../styles/colors";
import { useTranslation } from "react-i18next";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useTranslation();
  const logoScale = new Animated.Value(0.7);
  const logoOpacity = new Animated.Value(0);
  const dotsOpacity = new Animated.Value(0);
  const circle1Scale = new Animated.Value(0);
  const circle2Scale = new Animated.Value(0);

  useEffect(() => {
    // Circles
    Animated.parallel([
      Animated.spring(circle1Scale, { toValue: 1, useNativeDriver: true, delay: 0 }),
      Animated.spring(circle2Scale, { toValue: 1, useNativeDriver: true, delay: 200 }),
    ]).start();

    // Logo
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 100 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Dots
    Animated.timing(dotsOpacity, { toValue: 1, duration: 300, delay: 1000, useNativeDriver: true }).start();

    const timer = setTimeout(onComplete, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background circles */}
      <Animated.View style={[styles.circle1, { transform: [{ scale: circle1Scale }] }]} />
      <Animated.View style={[styles.circle2, { transform: [{ scale: circle2Scale }] }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconBox}>
          <ShoppingCart size={48} color={Colors.primary600} strokeWidth={1.8} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Shopisel</Text>
          <View style={styles.tagline}>
            <Sparkles size={14} color="#C7D2FE" />
            <Text style={styles.taglineText}>{t("splash.tagline")}</Text>
            <Sparkles size={14} color="#C7D2FE" />
          </View>
        </View>
      </Animated.View>

      {/* Dots */}
      <Animated.View style={[styles.dots, { opacity: dotsOpacity }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.dot} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary600,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  circle2: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  logoWrap: {
    alignItems: "center",
    gap: 20,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  titleWrap: { alignItems: "center", gap: 6 },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taglineText: {
    color: "#C7D2FE",
    fontSize: 13,
    fontWeight: "500",
  },
  dots: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
