import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, Flashlight, Image as ImageIcon, X } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Colors } from "../../styles/colors";
import { Radii, Typography } from "../../styles/typography";
import { ProductResponse, useProducts } from "../../api/useProducts";
import { useLists, type ListResponse } from "../../api/useLists";
import { usePrices } from "../../api/usePrices";
import { getCategoryImage } from "../../utils/categoryImages";
import { extractEanFromQrPayload } from "../../utils/qrCode";
import { extractKeywordsFromOff, fetchOpenFoodFactsProduct } from "../../utils/openFoodFacts";
import { clearScannedProduct, saveScannedProduct } from "../../utils/scannedProductStore";

interface ScanScreenProps {
  onNavigate?: (route: string) => void;
}

type ScanResult = {
  barcode: string;
  matchType: "exact" | "related" | string;
  product?: ProductResponse | null;
  relatedProducts: ProductResponse[];
};

const MOCK_SCAN_RESULT: ScanResult = {
  barcode: "5601234567890",
  matchType: "exact",
  product: {
    id: "0167284433664441b4de2500e5303385",
    name: "Preparado Sopa Juliana Embalado",
    brand: "Pingo Doce",
    barcode: "5601234567890",
    categoryId: "mock-category",
    image: "https://www.pingodoce.pt/dw/image/v2/BLJJ_PRD/on/demandware.static/-/Sites-pingo-doce-master/default/dwd2cd5256/images/medium/955143_aba9f0d892659ee05105ab26638a5939.png?sw=198",
  },
  relatedProducts: [
    {
      id: "mock-product-2",
      name: "Produto semelhante",
      brand: "Shopisel",
      barcode: "5601234567891",
      categoryId: "mock-category",
      image: "",
    },
  ],
};

const getProductImageSource = (product?: ProductResponse | null) => {
  if (!product) return null;
  return getCategoryImage(product.image, product.categoryId ?? product.name);
};

const getBadge = (value?: string) => {
  return (value ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "PK";
};

export function ScanScreen({ onNavigate }: ScanScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const { qrCodeLookup } = useProducts();
  const { getLists, getList, updateList } = useLists();
  const { getPrices } = usePrices();
  const [torchOn, setTorchOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [added, setAdded] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraSession, setCameraSession] = useState(0);
  const isFocused = useIsFocused();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [lists, setLists] = useState<ListResponse[]>([]);
  const [listPickerLoading, setListPickerLoading] = useState(false);
  const [listPickerSaving, setListPickerSaving] = useState(false);
  const [listPickerError, setListPickerError] = useState<string | null>(null);

  const canAddToList = useMemo(() => Boolean(scanResult?.product && !scanning && !scanError), [scanResult, scanning, scanError]);
  const log = (...args: unknown[]) => {
    if (__DEV__) {
      console.log("[ScanScreen]", ...args);
    }
  };

  const resetScan = useCallback(() => {
    setScanning(false);
    setScanned(false);
    setAdded(false);
    setScanError(null);
    setScanResult(null);
    setShowListPicker(false);
    setListPickerError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCameraSession((value) => value + 1);
      const timer = setTimeout(() => {
        setCameraVisible(true);
      }, 180);

      return () => {
        clearTimeout(timer);
        setCameraVisible(false);
        resetScan();
        setTorchOn(false);
      };
    }, [resetScan]),
  );

  const handleScannedPayload = async (payload: string) => {
    setScanError(null);
    setScanResult(null);
    setScanning(true);
    setScanned(true);

    try {
      const barcode = extractEanFromQrPayload(payload);
      if (!barcode) throw new Error("EAN_INVALID");

      const off = await fetchOpenFoodFactsProduct(barcode);
      const keywords = extractKeywordsFromOff(off);
      const backendRes = await qrCodeLookup(barcode, keywords);
      log("scan result", {
        barcode,
        matchType: backendRes.matchType,
        productId: backendRes.product?.id,
        relatedIds: (backendRes.relatedProducts ?? []).map((product) => product.id),
      });
      const nextProduct = backendRes.product
        ? {
            id: backendRes.product.id,
            name: backendRes.product.name,
            brand: backendRes.product.brand ?? undefined,
            barcode: backendRes.product.barcode,
            categoryId: backendRes.product.categoryId,
            image: backendRes.product.image,
          }
        : null;

      setScanResult({
        barcode,
        matchType: backendRes.matchType,
        product: backendRes.product,
        relatedProducts: backendRes.relatedProducts ?? [],
      });

      if (nextProduct) {
        log("persist scanned product", nextProduct.id);
        void saveScannedProduct(nextProduct).catch((error) => {
          console.error("[ScanScreen] failed to persist scanned product", error);
        });
      }
    } catch (err) {
      console.error("[ScanScreen] scan failed", err);
      setScanError(typeof err === "object" && err && "message" in err ? String((err as any).message) : t("errors.requestFailed"));
    } finally {
      setScanning(false);
    }
  };

  const handleAddToList = async () => {
    if (!canAddToList) return;
    setListPickerError(null);
    setListPickerLoading(true);

    try {
      const data = await getLists();
      setLists(Array.isArray(data) ? data : []);
      setShowListPicker(true);
    } catch (error) {
      console.error("[ScanScreen] failed to load lists", error);
      setListPickerError(typeof error === "object" && error && "message" in error ? String((error as any).message) : t("errors.requestFailed"));
    } finally {
      setListPickerLoading(false);
    }
  };

  const goToPricesWithProduct = async (product: ProductResponse) => {
    try {
      await saveScannedProduct({
        id: product.id,
        name: product.name,
        brand: product.brand ?? undefined,
        barcode: product.barcode,
        categoryId: product.categoryId,
        image: product.image,
      });
    } catch (error) {
      console.error("[ScanScreen] failed to persist scanned product", error);
    } finally {
      onNavigate?.("prices");
    }
  };

  const handleSearchByName = async () => {
    await clearScannedProduct().catch((error) => console.error("[ScanScreen] failed to clear scanned product", error));
    onNavigate?.("prices");
  };

  const handleRetry = () => {
    resetScan();
    setTorchOn(false);
  };

  const handleSelectList = async (list: ListResponse) => {
    if (!scanResult?.product) return;

    setListPickerSaving(true);
    setListPickerError(null);

    try {
      const prices = await getPrices(scanResult.product.id).catch(() => []);
      const bestPrice = prices.reduce((currentBest, nextPrice) => {
        const currentValue = typeof currentBest.sale === "number" && currentBest.sale > 0 ? currentBest.sale : currentBest.price;
        const nextValue = typeof nextPrice.sale === "number" && nextPrice.sale > 0 ? nextPrice.sale : nextPrice.price;
        return nextValue < currentValue ? nextPrice : currentBest;
      }, prices[0]);

      if (!bestPrice) {
        setListPickerError(t("scanScreen.noPriceToAdd"));
        return;
      }

      const listDetails = await getList(list.id);
      const updatedItems = [
        ...(listDetails.items ?? []).map((item) => ({
          productId: item.productId,
          storeId: item.storeId,
          quantity: item.quantity,
          price: item.price,
          checked: item.checked,
        })),
        {
          productId: scanResult.product.id,
          storeId: bestPrice.storeId,
          quantity: 1,
          price: typeof bestPrice.sale === "number" && bestPrice.sale > 0 ? bestPrice.sale : bestPrice.price,
          checked: false,
        },
      ];

      await updateList(list.id, listDetails.version, undefined, updatedItems);
      setAdded(true);
      setShowListPicker(false);
    } catch (error) {
      console.error("[ScanScreen] failed to add product to list", error);
      setListPickerError(typeof error === "object" && error && "message" in error ? String((error as any).message) : t("errors.requestFailed"));
    } finally {
      setListPickerSaving(false);
      setTimeout(() => setAdded(false), 1000);
    }
  };

  const openProductPage = () => {
    if (!scanResult?.product) return;
    log("open product page", scanResult.product.id);
    void goToPricesWithProduct(scanResult.product);
  };

  const loadMockScan = () => {
    setScanError(null);
    setScanning(false);
    setScanned(true);
    setAdded(false);
    setScanResult(MOCK_SCAN_RESULT);
    log("load mock scan", MOCK_SCAN_RESULT.product?.id);
    void saveScannedProduct({
      id: MOCK_SCAN_RESULT.product!.id,
      name: MOCK_SCAN_RESULT.product!.name,
      brand: MOCK_SCAN_RESULT.product!.brand ?? undefined,
      barcode: MOCK_SCAN_RESULT.product!.barcode,
      categoryId: MOCK_SCAN_RESULT.product!.categoryId,
      image: MOCK_SCAN_RESULT.product!.image,
    }).catch((error) => console.error("[ScanScreen] failed to persist scanned product", error));
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

      {!scanned ? (
        <>
          <View style={styles.preview}>
            {permission == null || !cameraVisible || !isFocused ? (
              <View style={styles.permissionLoadingCard}>
                <ActivityIndicator color={Colors.surface} />
              </View>
            ) : permission.granted ? (
              <View style={styles.cameraFrame}>
                <CameraView
                  key={cameraSession}
                  style={styles.cameraView}
                  facing="back"
                  enableTorch={torchOn}
                  onBarcodeScanned={scanned ? undefined : (event) => void handleScannedPayload(event.data)}
                />
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.previewText}>
                  {scanning ? t("scanScreen.looking") : t("scanScreen.ready")}
                </Text>
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

            {__DEV__ ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={loadMockScan} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>{t("scanScreen.loadExample")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      ) : (
        <View style={styles.resultMode}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.productBubble}>
                {getProductImageSource(scanResult?.product) ? (
                  <Image source={getProductImageSource(scanResult?.product)!} style={styles.productImage} />
                ) : (
                  <Text style={styles.productEmoji}>{getBadge(scanResult?.product?.name)}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                {scanResult?.matchType ? <Text style={styles.resultBrand}>{String(scanResult.matchType)}</Text> : null}
                <Text style={styles.resultName}>
                  {scanResult?.product?.name ?? t("common.unknownProduct")}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={resetScan}>
                <X size={16} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            {scanning ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>{t("addProduct.scanning")}</Text>
              </View>
            ) : scanError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{scanError}</Text>
              </View>
            ) : scanResult?.product ? (
              <>
                <View style={styles.highlight}>
                  <Text style={styles.highlightLabel}>{t("scanScreen.identified")}</Text>
                  <Text style={styles.highlightPrice}>{scanResult.product.name}</Text>
                  {scanResult.product.brand ? <Text style={styles.highlightStore}>{scanResult.product.brand}</Text> : null}
                </View>

                {scanResult.relatedProducts?.length ? (
                  <ScrollView
                    style={styles.relatedList}
                    contentContainerStyle={styles.relatedListContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    {scanResult.relatedProducts.map((p) => {
                      const imageSource = getProductImageSource(p);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={styles.relatedRow}
                          onPress={() => void goToPricesWithProduct(p)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.relatedImageBox}>
                            {imageSource ? (
                              <Image source={imageSource} style={styles.relatedImage} resizeMode="cover" />
                            ) : (
                              <Text style={styles.relatedFallback}>{getBadge(p.name)}</Text>
                            )}
                          </View>
                          <View style={styles.relatedInfo}>
                            <Text style={styles.relatedName} numberOfLines={2}>
                              {p.name}
                            </Text>
                            {p.brand ? (
                              <Text style={styles.relatedBrand} numberOfLines={1}>
                                {p.brand}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}

                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.primarySplitButton} onPress={() => void handleAddToList()} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>{added ? t("scanScreen.added") : t("scanScreen.addToList")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondarySplitButton}
                    onPress={openProductPage}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondaryActionText}>{t("scanScreen.viewRelated")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : scanResult?.relatedProducts?.length ? (
              <ScrollView
                style={styles.relatedList}
                contentContainerStyle={styles.relatedListContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {scanResult.relatedProducts.map((p) => {
                  const imageSource = getProductImageSource(p);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.relatedRow}
                      onPress={() => void goToPricesWithProduct(p)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.relatedImageBox}>
                        {imageSource ? (
                          <Image source={imageSource} style={styles.relatedImage} resizeMode="cover" />
                        ) : (
                          <Text style={styles.relatedFallback}>{getBadge(p.name)}</Text>
                        )}
                      </View>
                      <View style={styles.relatedInfo}>
                        <Text style={styles.relatedName} numberOfLines={2}>
                          {p.name}
                        </Text>
                        {p.brand ? (
                          <Text style={styles.relatedBrand} numberOfLines={1}>
                            {p.brand}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{t("scanScreen.noResultMessage")}</Text>
                <View style={styles.noResultActions}>
                  <TouchableOpacity style={styles.secondaryButtonDark} onPress={handleRetry} activeOpacity={0.85}>
                    <Text style={styles.secondaryButtonDarkText}>{t("scanScreen.tryAgain")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => void handleSearchByName()} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>{t("scanScreen.searchByName")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      <Modal visible={showListPicker} transparent animationType="fade" onRequestClose={() => setShowListPicker(false)}>
        <View style={styles.listPickerOverlay}>
          <TouchableOpacity style={styles.listPickerBackdrop} activeOpacity={1} onPress={() => setShowListPicker(false)} />
          <View style={styles.listPickerCard}>
            <View style={styles.listPickerHeader}>
              <Text style={styles.listPickerTitle}>{t("scanScreen.chooseList")}</Text>
              <TouchableOpacity onPress={() => setShowListPicker(false)} activeOpacity={0.85}>
                <X size={16} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            {listPickerLoading ? (
              <View style={styles.listPickerLoading}>
                <ActivityIndicator color={Colors.primary600} />
              </View>
            ) : listPickerError ? (
              <View style={styles.listPickerEmpty}>
                <Text style={styles.listPickerEmptyText}>{listPickerError}</Text>
              </View>
            ) : lists.length ? (
              <ScrollView contentContainerStyle={styles.listPickerContent} showsVerticalScrollIndicator={false}>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.listPickerRow}
                    onPress={() => void handleSelectList(list)}
                    disabled={listPickerSaving}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listPickerRowTitle}>{list.name}</Text>
                      <Text style={styles.listPickerRowSubtitle}>{t("lists.itemCount", { count: list.items?.length ?? 0 })}</Text>
                    </View>
                    <Text style={styles.listPickerRowArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.listPickerEmpty}>
                <Text style={styles.listPickerEmptyText}>{t("scanScreen.noListsAvailable")}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
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
  permissionLoadingCard: {
    width: "100%",
    maxWidth: 310,
    minHeight: 180,
    borderRadius: Radii["3xl"],
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
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
  resultMode: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    flex: 1,
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
  productImage: {
    width: 56,
    height: 56,
    resizeMode: "cover",
    borderRadius: Radii.xl,
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
  loadingBox: {
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.gray50,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: Typography.base,
    fontWeight: "600",
    color: Colors.gray700,
  },
  errorBox: {
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.gray50,
    padding: 14,
  },
  errorText: {
    fontSize: Typography.base,
    fontWeight: "600",
    color: Colors.gray700,
    textAlign: "center",
  },
  noResultActions: {
    gap: 10,
    marginTop: 14,
  },
  secondaryButtonDark: {
    height: 52,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonDarkText: {
    fontSize: Typography.md,
    fontWeight: "700",
    color: Colors.gray700,
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
  relatedList: {
    maxHeight: 240,
  },
  relatedListContent: {
    gap: 10,
    paddingBottom: 2,
  },
  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.xl,
    backgroundColor: Colors.gray50,
  },
  relatedImageBox: {
    width: 42,
    height: 42,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  relatedImage: {
    width: "100%",
    height: "100%",
  },
  relatedFallback: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.gray900,
  },
  relatedInfo: {
    flex: 1,
    minWidth: 0,
  },
  relatedName: {
    fontSize: Typography.base,
    fontWeight: "700",
    color: Colors.gray900,
    lineHeight: 18,
  },
  relatedBrand: {
    marginTop: 2,
    fontSize: Typography.sm,
    color: Colors.gray500,
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
  secondarySplitButtonDisabled: {
    opacity: 0.5,
  },
  secondaryActionText: {
    fontSize: Typography.md,
    fontWeight: "700",
    color: Colors.primary600,
  },
  listPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  listPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  listPickerCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii["3xl"],
    borderTopRightRadius: Radii["3xl"],
    padding: 20,
    maxHeight: "75%",
  },
  listPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  listPickerTitle: {
    fontSize: Typography.lg,
    fontWeight: "800",
    color: Colors.gray900,
  },
  listPickerLoading: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  listPickerContent: {
    gap: 10,
    paddingBottom: 8,
  },
  listPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: Radii["2xl"],
    backgroundColor: Colors.gray50,
  },
  listPickerRowTitle: {
    fontSize: Typography.base,
    fontWeight: "700",
    color: Colors.gray900,
  },
  listPickerRowSubtitle: {
    marginTop: 2,
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  listPickerRowArrow: {
    fontSize: 24,
    lineHeight: 24,
    color: Colors.primary600,
    fontWeight: "700",
  },
  listPickerEmpty: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  listPickerEmptyText: {
    fontSize: Typography.base,
    color: Colors.gray500,
    textAlign: "center",
  },
});
