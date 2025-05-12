import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/useAuth";
import Navbar from "../component/navbar";
import ToastProvider from "./toastProvider/toastProvider";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";
import "../assets/global.css";

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        "AzeretMono-Regular": require("../assets/fonts/AzeretMono-Regular.ttf"),
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <AuthProvider>
            <Navbar />
            <ToastProvider />
            <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
    );
}
