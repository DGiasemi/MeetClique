import "../global.css";

import * as Font from 'expo-font';
import * as SplashScreen from "expo-splash-screen";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, useRouter } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "@/utils/request";
import { useColorScheme } from "@/components/useColorScheme";
import { useEffect } from "react";
import { useFonts } from "expo-font";

export {
  ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const router = useRouter();

    const checkAuth = async () => {
      await getAuth(router, "/isauthenticated");
    };

    checkAuth();

    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync(Ionicons.font);
    };
    loadFont();
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <SafeAreaView className="flex-1 bg-black">
            <Slot />
          </SafeAreaView>
        </ThemeProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
