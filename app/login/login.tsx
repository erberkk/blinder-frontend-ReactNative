import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Button } from "react-native-paper";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { showToast } from "../toastProvider/toastProvider";
import { ResponseType } from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "your-google-cliend-id";
const MICROSOFT_CLIENT_ID = "your-microsoft-cliend-id";
const MICROSOFT_TENANT_ID = "common";

const MView = motion(View);

export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useAuth();

    const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        redirectUri: makeRedirectUri(),
        scopes: ["openid", "email", "profile"],
        prompt: "select_account" as any,
    });

    const [microsoftRequest, microsoftResponse, microsoftPromptAsync] = useAuthRequest(
        {
            clientId: MICROSOFT_CLIENT_ID,
            redirectUri: makeRedirectUri(),
            scopes: ["openid", "profile", "email", "User.Read"],
            responseType: ResponseType.Code,
        },
        {
            authorizationEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
            tokenEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        }
    );

    useEffect(() => {
        if (googleResponse?.type === "success") {
            const { id_token } = googleResponse.params;
            handleLogin(id_token, "google");
        }
    }, [googleResponse]);

    useEffect(() => {
        if (microsoftResponse?.type === "success") {
            const { code } = microsoftResponse.params;
            handleLogin(code, "microsoft");
        } else if (microsoftResponse?.type === "error") {
            console.error("Microsoft OAuth hatası:", microsoftResponse);
            showToast.error("Microsoft girişinde hata oluştu. Lütfen ayarlarınızı kontrol edin.");
        }
    }, [microsoftResponse]);

    const handleLogin = async (tokenOrCode: string, provider: "google" | "microsoft") => {
        try {
            console.log(`🔄 ${provider} giriş denemesi başlatılıyor...`);
            const requestBody =
                provider === "microsoft"
                    ? {
                          idToken: tokenOrCode,
                          codeVerifier: microsoftRequest?.codeVerifier,
                      }
                    : { idToken: tokenOrCode };

            const res = await fetch(`http://127.0.0.1:5000/auth/${provider}-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();
            console.log(`✅ ${provider} giriş sonucu:`, data);

            if (data.access_token) {
                await AsyncStorage.setItem("token", data.access_token);
                setUser(data.user);
                showToast.success("Giriş başarılı!");

                const { university, birthdate, gender } = data.user;
                if (!university || !birthdate || !gender) {
                    router.replace("/profileSetup/profileSetup");
                } else {
                    router.replace("/profile/profile");
                }
            } else {
                showToast.error("Giriş başarısız! Lütfen tekrar deneyin.");
            }
        } catch (error) {
            console.error(`${provider} Login Hatası:`, error);
            showToast.error(`${provider} girişinde hata oluştu. Lütfen tekrar deneyin.`);
        }
    };

    return (
        <LinearGradient colors={["#B794F4", "#9F7AEA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.backgroundGradient}>
            <View style={styles.container}>
                <MView initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={styles.card}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Blinder'a Hoşgeldiniz</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.description}>Bu uygulama sadece üniversite öğrencileri için tasarlandı.</Text>
                        <Text style={styles.description}>Yalnızca .edu uzantılı e-posta adresleri ile giriş yapabilirsiniz.</Text>
                    </View>
                    <View style={styles.spacer} />
                    <View style={styles.textContainer}>
                        <Text style={styles.subtitle}>Google veya Microsoft ile hızlı ve güvenli giriş yapın</Text>
                    </View>
                    <View style={styles.spacer} />
                    <MView whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }} style={styles.buttonContainer}>
                        <Button
                            mode="contained"
                            onPress={() => googlePromptAsync()}
                            disabled={!googleRequest}
                            icon={() => <MaterialCommunityIcons name="google" size={22} color="#fff" />}
                            style={styles.googleButton}>
                            Google ile Giriş Yap
                        </Button>
                    </MView>
                    <View style={styles.spacer} />
                    <MView whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }} style={styles.buttonContainer}>
                        <Button
                            mode="contained"
                            onPress={() => microsoftPromptAsync()}
                            disabled={!microsoftRequest}
                            icon={() => <MaterialCommunityIcons name="microsoft" size={22} color="#fff" />}
                            style={styles.microsoftButton}>
                            Microsoft ile Giriş Yap
                        </Button>
                    </MView>
                </MView>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    backgroundGradient: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        padding: 20,
    },
    card: {
        width: "90%",
        maxWidth: 400,
        padding: 30,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 10,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    description: {
        fontSize: 15,
        color: "#E0CCFF",
        textAlign: "center",
        marginBottom: 5,
        lineHeight: 20,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 22,
    },
    spacer: {
        height: 25,
    },
    buttonContainer: {
        width: "100%",
    },
    googleButton: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#805AD5",
        paddingVertical: 12,
        shadowColor: "#805AD5",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    microsoftButton: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#6B46C1",
        paddingVertical: 12,
        shadowColor: "#6B46C1",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});
