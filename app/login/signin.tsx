import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../toastProvider/toastProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

export default function SignInScreen() {
    const router = useRouter();
    const { setUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            if (!email || !password) {
                showToast.error("Lütfen e-posta ve şifrenizi girin");
                return;
            }

            if (!email.includes(".edu")) {
                showToast.error("Lütfen akademik e-posta adresinizi girin");
                return;
            }

            setIsLoading(true);
            const res = await fetch("http://127.0.0.1:5000/auth/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.ok) {
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
                if (res.status === 404) {
                    showToast.error("Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı");
                } else if (res.status === 401) {
                    showToast.error("E-posta veya şifre hatalı");
                } else {
                    showToast.error(data.error || "Giriş yapılırken bir hata oluştu");
                }
            }
        } catch (error) {
            console.error("Giriş hatası:", error);
            showToast.error("İnternet bağlantınızı kontrol edin");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={["#B794F4", "#9F7AEA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.backgroundGradient}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Giriş Yap</Text>
                    <View style={styles.inputGroup}>
                        <TextInput
                            style={styles.input}
                            placeholder="E-posta adresiniz"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifreniz"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isLoading}
                            placeholderTextColor="#888"
                        />
                    </View>
                    <View style={styles.buttonRow}>
                        <Button
                            mode="contained"
                            onPress={handleSignIn}
                            style={styles.signinButton}
                            disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                "Giriş Yap"
                            )}
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => router.back()}
                            style={styles.backButton}
                            disabled={isLoading}>
                            Geri Dön
                        </Button>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    backgroundGradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        width: "92%",
        maxWidth: 370,
        padding: 26,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.97)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 16,
        elevation: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#805AD5",
        marginBottom: 18,
        textAlign: "center",
    },
    inputGroup: {
        width: "100%",
        marginBottom: 18,
    },
    input: {
        width: "100%",
        height: 46,
        backgroundColor: "#F3F0FF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#D6BCFA",
        paddingHorizontal: 14,
        marginBottom: 12,
        fontSize: 15,
        color: "#222",
    },
    buttonRow: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        gap: 10,
    },
    signinButton: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: "#805AD5",
        paddingVertical: 10,
        marginRight: 5,
    },
    backButton: {
        flex: 1,
        borderRadius: 10,
        borderColor: "#805AD5",
        paddingVertical: 10,
        marginLeft: 5,
    },
}); 
