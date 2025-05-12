import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { View, Text } from "react-native";
import { useFonts } from "expo-font";
import styles from "./toastProviderStyles";

const CustomToast = ({ message, color, icon }: { message: string; color: string; icon: string }) => {
    return (
        <View style={[styles.toastContainer, { borderLeftColor: color }]}>
            <Text style={[styles.icon, { color }]}>{icon}</Text>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

export const showToast = {
    success: (message: string) => toast.custom(() => <CustomToast message={message} color="#2B9348" icon="✅" />),
    error: (message: string) => toast.custom(() => <CustomToast message={message} color="#D32F2F" icon="❌" />),
    info: (message: string) => toast.custom(() => <CustomToast message={message} color="#1E40AF" icon="ℹ️" />),
    warning: (message: string) => toast.custom(() => <CustomToast message={message} color="#B45309" icon="⚠️" />),
};

const ToastProvider = () => {
    const [fontsLoaded] = useFonts({
        "AzeretMono-Regular": require("../../assets/fonts/AzeretMono-Regular.ttf"),
    });

    if (!fontsLoaded) return null;

    return <Toaster position="bottom-right" reverseOrder={false} />;
};

export default ToastProvider;
