import { useRouter } from "expo-router";
import { ProfileScreen } from "../../src/components/screens/ProfileScreen";
import { useAuth } from "../../src/auth/AuthProvider";

export default function ProfileTab() {
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <ProfileScreen
      user={user}
      onLogout={() => {
        void logout().finally(() => router.replace("/auth"));
      }}
    />
  );
}
