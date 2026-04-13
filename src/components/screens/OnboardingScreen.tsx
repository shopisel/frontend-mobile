import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated
} from "react-native";
import { MapPin, List, Bell, ChevronRight } from "lucide-react-native";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";

const slides = [
  {
    icon: MapPin,
    color: Colors.primary600,
    title: "Compare Prices Nearby",
    subtitle: "Instantly see the best prices across stores near you and never overpay again.",
    image: "https://images.unsplash.com/photo-1760463921652-78b38572da45?w=800&q=80",
  },
  {
    icon: List,
    color: Colors.success500,
    title: "Smart Shopping Lists",
    subtitle: "Create intelligent lists that organize items by store aisle and track your spending.",
    image: "https://images.unsplash.com/photo-1552825896-8059df63a1fb?w=800&q=80",
  },
  {
    icon: Bell,
    color: Colors.warning500,
    title: "Real-Time Price Alerts",
    subtitle: "Get notified instantly when prices drop on your favourite products and deals.",
    image: "https://images.unsplash.com/photo-1730817403595-d78d929eb856?w=800&q=80",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const Icon = slide.icon;

  const goNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: slide.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.imageOverlay} />
        {current < slides.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={onComplete} activeOpacity={0.8}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: slide.color }]}>
          <Icon size={28} color="#fff" strokeWidth={2} />
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCurrent(i)}
              style={[
                styles.dot,
                {
                  width:  i === current ? 24 : 8,
                  backgroundColor: i === current ? slide.color : Colors.gray200,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: slide.color }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {current === slides.length - 1 ? "Get Started" : "Continue"}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  imageWrap: { height: "48%", overflow: "hidden", position: "relative" },
  image: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skipBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  skipText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 40,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: Radii.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.gray900,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
  },
  dot: {
    height: 8,
    borderRadius: 99,
  },
  cta: {
    marginTop: "auto",
    width: "100%",
    height: 52,
    borderRadius: Radii["2xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
