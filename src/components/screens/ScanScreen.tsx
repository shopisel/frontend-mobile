import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, Flashlight, Image as ImageIcon, X } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { formatCurrency } from "../../i18n/formatters";

interface ScanScreenProps {
  onNavigate?: (route: string) => void;
}

const scannedProduct = {
  name: "Organic Oat Milk",
  brand: "Oatly",
  bestPrice: 3.29,
  bestStore: "NatureMart",
  emoji: "??",
  stores: [
    { name: "NatureMart", price: 3.29 },
    { name: "FreshMart", price: 3.79 },
    { name: "CostPlus", price: 4.1 },
  ],
};

export function ScanScreen({ onNavigate }: ScanScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!scanning || scanned) return;

    const timer = setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [scanning]);

  const handleAddToList = () => {
    setAdded(true);
    setTimeout(() => {
      onNavigate?.("lists");
      setAdded(false);
      setScanned(false);
    }, 700);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.title}>{t("scanScreen.title")}</Text>
          <Text style={styles.subtitle}>{t("scanScreen.subtitle")}</Text>
        </View>
        <TouchableOpacity
          style={[styles.roundButton, torchOn && styles.roundButtonActive]}
          onPress={() => setTorchOn((value) => !value)}
        >
          <Flashlight size={18} color={torchOn ? Colors.warning500 : Colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.preview}>
        {permission?.granted ? (
          <View style={styles.cameraFrame}>
            <CameraView
              style={styles.cameraView}
              facing="back"
              enableTorch={torchOn}
              onBarcodeScanned={scanned ? undefined : () => {
                setScanning(false);
                setScanned(true);
              }}
            />
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {!scanned ? (
              <Text style={styles.previewText}>
                {scanning ? t("scanScreen.looking") : t("scanScreen.ready")}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.cameraPermissionCard}>
            <Text style={styles.permissionTitle}>{t("prices.cameraPermissionTitle")}</Text>
            <Text style={styles.permissionText}>{t("prices.cameraPermissionBody")}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => void requestPermission()} activeOpacity={0.85}>
              <Camera size={18} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>{t("prices.grantCameraPermission")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!scanned ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, scanning && styles.primaryButtonDisabled]}
              onPress={() => !scanning && setScanning(true)}
              activeOpacity={0.85}
            >
              <Camera size={18} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>{scanning ? t("addProduct.scanning") : t("scanScreen.scanBarcode")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
              <ImageIcon size={18} color={Colors.gray600} />
              <Text style={styles.secondaryButtonText}>{t("scanScreen.chooseGallery")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.productBubble}>
                <Text style={styles.productEmoji}>{scannedProduct.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultBrand}>{scannedProduct.brand}</Text>
                <Text style={styles.resultName}>{scannedProduct.name}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setScanned(false)}>
                <X size={16} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.highlight}>
              <Text style={styles.highlightLabel}>{t("scanScreen.bestPrice")}</Text>
              <Text style={styles.highlightPrice}>{formatCurrency(scannedProduct.bestPrice, i18n.language)}</Text>
              <Text style={styles.highlightStore}>{scannedProduct.bestStore}</Text>
            </View>

            <View style={styles.storeList}>
              {scannedProduct.stores.map((store) => (
                <View key={store.name} style={styles.storeRow}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storePrice}>{formatCurrency(store.price, i18n.language)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.primarySplitButton} onPress={handleAddToList} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>{added ? t("scanScreen.added") : t("scanScreen.addToList")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondarySplitButton}
                onPress={() => onNavigate?.("prices")}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionText}>{t("scanScreen.compare")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: Typography["3xl"],
    fontWeight: "700",
    color: Colors.surface,
  },
  subtitle: {
    fontSize: Typography.base,
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonActive: {
    backgroundColor: "#FEF3C7",
  },
  preview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cameraFrame: {
    width: "100%",
    maxWidth: 310,
    aspectRatio: 1,
    borderRadius: Radii["3xl"],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cameraView: { ...StyleSheet.absoluteFillObject },
  cameraPermissionCard: {
    width: "100%",
    maxWidth: 310,
    borderRadius: Radii["3xl"],
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 24,
    gap: 14,
    alignItems: "center",
  },
  permissionTitle: {
    fontSize: Typography.xl,
    fontWeight: "700",
    color: Colors.surface,
    textAlign: "center",
  },
  permissionText: {
    fontSize: Typography.base,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: Colors.primary600,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  previewText: {
    position: "absolute",
    bottom: 26,
    fontSize: Typography.md,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    backgroundColor: "rgba(15,23,42,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.xl,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  primaryButton: {
    height: 54,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.primary600,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    fontSize: Typography.md,
    fontWeight: "700",
    color: Colors.surface,
  },
  secondaryButton: {
    height: 52,
    borderRadius: Radii["2xl"],
    backgroundColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: Typography.md,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii["3xl"],
    padding: 18,
    gap: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productBubble: {
    width: 56,
    height: 56,
    borderRadius: Radii.xl,
    backgroundColor: Colors.primary50,
    alignItems: "center",
    justifyContent: "center",
  },
  productEmoji: {
    fontSize: 28,
  },
  resultBrand: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  resultName: {
    fontSize: Typography.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  highlight: {
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.success50,
    padding: 16,
  },
  highlightLabel: {
    fontSize: Typography.sm,
    fontWeight: "600",
    color: Colors.success500,
  },
  highlightPrice: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.gray900,
    marginTop: 6,
  },
  highlightStore: {
    fontSize: Typography.base,
    color: Colors.gray600,
    marginTop: 2,
  },
  storeList: {
    gap: 10,
  },
  storeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radii.xl,
    backgroundColor: Colors.gray50,
  },
  storeName: {
    fontSize: Typography.base,
    fontWeight: "600",
    color: Colors.gray900,
  },
  storePrice: {
    fontSize: Typography.md,
    fontWeight: "700",
    color: Colors.gray900,
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
  },
  primarySplitButton: {
    flex: 1,
    height: 50,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.primary600,
    alignItems: "center",
    justifyContent: "center",
  },
  secondarySplitButton: {
    flex: 1,
    height: 50,
    borderRadius: Radii["2xl"],
    borderWidth: 1,
    borderColor: Colors.primary100,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: Typography.md,
    fontWeight: "700",
    color: Colors.primary600,
  },
});
