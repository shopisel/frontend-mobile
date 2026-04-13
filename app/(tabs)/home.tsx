import { useRouter } from "expo-router";
import { HomeScreen } from "../../src/components/screens/HomeScreen";

export default function HomeTab() {
  const router = useRouter();

  return (
    <HomeScreen
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
