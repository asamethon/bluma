import { Redirect } from "expo-router";

// Taslak listesi artık Yazı Stüdyosu (Hub) içinde. Bu rota, eski derin
// bağlantılar kırılmasın diye korunur ve Hub'a yönlendirir.
export default function DraftsScreen() {
  return <Redirect href="/(tabs)/write" />;
}
