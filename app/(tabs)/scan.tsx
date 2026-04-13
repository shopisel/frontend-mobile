import { useRouter } from "expo-router";
import { ScanScreen } from "../../src/components/screens/ScanScreen";

export default function ScanTab() {
  const router = useRouter();

  return (
    <ScanScreen
      onNavigate={(tab) => {
        if (tab === "alerts") {
          router.push("/alerts");
          return;
        }

        router.push(`/(tabs)/${tab}` as never);
      }}
    />
  );
}
