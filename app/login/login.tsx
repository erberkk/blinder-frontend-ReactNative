import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TextInput, Modal } from "react-native";
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
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [password, setPassword] = useState("");
    const [tempToken, setTempToken] = useState("");

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
            extraParams: { prompt: "select_account" },
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
        if (microsoftResponse?.type === "success" && microsoftResponse.params?.code) {
            const { code } = microsoftResponse.params;
            handleLogin(code, "microsoft");
        } else if (microsoftResponse?.type === "error") {
            console.error("Microsoft OAuth hatası:", microsoftResponse);
            showToast.error("Microsoft girişinde hata oluştu. Lütfen ayarlarınızı kontrol edin.");
        } else if (microsoftResponse?.type === "dismiss" || microsoftResponse?.type === "cancel") {
            showToast.info("Microsoft hesabı seçilmedi.");
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
                if (data.error === "Sadece akademik e-postalar kabul edilir!") {
                    showToast.error("Lütfen .edu uzantılı bir üniversite e-posta adresi kullanın. Kişisel e-posta adresleriyle kayıt olamazsınız.");
                } else {
                    showToast.error(data.error || "Giriş başarısız! Lütfen tekrar deneyin.");
                }
            }
        } catch (error) {
            console.error(`${provider} Login Hatası:`, error);
            showToast.error(`${provider} girişinde hata oluştu. Lütfen tekrar deneyin.`);
        }
    };

    const handleManualRegister = async () => {
        try {
            if (!email) {
                showToast.error("Lütfen e-posta adresinizi girin");
                return;
            }

            const res = await fetch("http://127.0.0.1:5000/auth/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                showToast.success("Doğrulama kodu gönderildi");
                setShowRegisterModal(false);
                setShowVerificationModal(true);
            } else {
                if (data.error === "Sadece akademik e-postalar kabul edilir!") {
                    showToast.error("Lütfen .edu uzantılı bir üniversite e-posta adresi kullanın. Kişisel e-posta adresleriyle kayıt olamazsınız.");
                } else {
                    showToast.error(data.error || "Bir hata oluştu");
                }
            }
        } catch (error) {
            console.error("Doğrulama kodu gönderme hatası:", error);
            showToast.error("Doğrulama kodu gönderilemedi");
        }
    };

    const handleVerifyCode = async () => {
        try {
            if (!verificationCode) {
                showToast.error("Lütfen doğrulama kodunu girin");
                return;
            }

            const res = await fetch("http://127.0.0.1:5000/auth/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: verificationCode }),
            });

            const data = await res.json();
            if (res.ok) {
                setTempToken(data.temp_token);
                setShowVerificationModal(false);
                setShowPasswordModal(true);
            } else {
                if (data.error === "Sadece akademik e-postalar kabul edilir!") {
                    showToast.error("Lütfen .edu uzantılı bir üniversite e-posta adresi kullanın. Kişisel e-posta adresleriyle kayıt olamazsınız.");
                } else {
                    showToast.error(data.error || "Geçersiz doğrulama kodu");
                }
            }
        } catch (error) {
            console.error("Doğrulama hatası:", error);
            showToast.error("Doğrulama işlemi başarısız");
        }
    };

    const handleSetPassword = async () => {
        try {
            if (!password || password.length < 6) {
                showToast.error("Şifre en az 6 karakter olmalıdır");
                return;
            }

            const res = await fetch("http://127.0.0.1:5000/auth/manual-register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tempToken}`,
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.ok) {
                await AsyncStorage.setItem("token", data.access_token);
                setUser(data.user);
                showToast.success("Kayıt başarılı!");
                setShowPasswordModal(false);

                const { university, birthdate, gender } = data.user;
                if (!university || !birthdate || !gender) {
                    router.replace("/profileSetup/profileSetup");
                } else {
                    router.replace("/profile/profile");
                }
            } else {
                if (data.error === "Sadece akademik e-postalar kabul edilir!") {
                    showToast.error("Lütfen .edu uzantılı bir üniversite e-posta adresi kullanın. Kişisel e-posta adresleriyle kayıt olamazsınız.");
                } else {
                    showToast.error(data.error || "Kayıt işlemi başarısız");
                }
            }
        } catch (error) {
            console.error("Kayıt hatası:", error);
            showToast.error("Kayıt işlemi başarısız");
        }
    };

    const handleManualLogin = async () => {
        try {
            if (!email || !password) {
                showToast.error("Lütfen e-posta ve şifrenizi girin");
                return;
            }

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
                showToast.error(data.error || "Giriş başarısız! Lütfen tekrar deneyin.");
            }
        } catch (error) {
            console.error("Manuel giriş hatası:", error);
            showToast.error("Giriş işlemi başarısız");
        }
    };

    return (
        <LinearGradient
            colors={["#F7FAFC", "#E9D8FD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <View style={styles.container}>
                <MView style={styles.card}>
                    <Text style={styles.title}>Blinder'a Hoşgeldiniz</Text>
                    <Text style={styles.description}>Sadece üniversite öğrencileri için!</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="E-posta adresiniz"
                            placeholderTextColor="#A0AEC0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifreniz"
                            placeholderTextColor="#A0AEC0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <Button
                            mode="contained"
                            onPress={handleManualLogin}
                            style={styles.loginButton}
                            labelStyle={styles.loginLabel}
                        >
                            Giriş Yap
                        </Button>
                        <TouchableOpacity onPress={() => setShowRegisterModal(true)}>
                            <Text style={styles.registerText}>
                                Hesabın yok mu? <Text style={styles.registerLink}>Kayıt Ol</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.orRow}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>veya</Text>
                        <View style={styles.line} />
                    </View>

                    <View style={styles.socialRow}>
                        <Button
                            icon={() => <MaterialCommunityIcons name="google" size={20} color="#2D3748" />}
                            style={styles.googleButton}
                            labelStyle={styles.socialLabel}
                            onPress={() => googlePromptAsync()}
                            disabled={!googleRequest}
                        >
                            Google
                        </Button>
                        <Button
                            icon={() => <MaterialCommunityIcons name="microsoft" size={20} color="#2D3748" />}
                            style={styles.microsoftButton}
                            labelStyle={styles.socialLabel}
                            onPress={() => microsoftPromptAsync()}
                            disabled={!microsoftRequest}
                        >
                            Microsoft
                        </Button>
                    </View>
                </MView>

                <Modal
                    visible={showRegisterModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowRegisterModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Kayıt Ol</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="E-posta adresiniz"
                                placeholderTextColor="#A0AEC0"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <View style={styles.modalButtons}>
                                <Button
                                    mode="contained"
                                    onPress={handleManualRegister}
                                    style={styles.modalButton}
                                    labelStyle={styles.modalButtonLabel}
                                >
                                    Kod Gönder
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowRegisterModal(false)}
                                    style={styles.modalButton}
                                    labelStyle={styles.modalButtonLabel}
                                >
                                    İptal
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={showVerificationModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowVerificationModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Doğrulama Kodu</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="6 haneli doğrulama kodu"
                                placeholderTextColor="#A0AEC0"
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <View style={styles.modalButtons}>
                                <Button
                                    mode="contained"
                                    onPress={handleVerifyCode}
                                    style={styles.modalButton}
                                    labelStyle={styles.modalButtonLabel}
                                >
                                    Doğrula
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowVerificationModal(false)}
                                    style={styles.modalButton}
                                    labelStyle={styles.modalButtonLabel}
                                >
                                    İptal
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={showPasswordModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowPasswordModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Şifre Oluştur</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Şifreniz (en az 6 karakter)"
                                placeholderTextColor="#A0AEC0"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            <View style={styles.modalButtons}>
                                <Button
                                    mode="contained"
                                    onPress={handleSetPassword}
                                    style={styles.modalButton}
                                    labelStyle={styles.modalButtonLabel}
                                >
                                    Kayıt Ol
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowPasswordModal(false)}
                                    style={styles.modalButton}
                                    labelStyle={styles.modalButtonLabel}
                                >
                                    İptal
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>
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
        width: "90%",
        maxWidth: 400,
        padding: 24,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        alignItems: "center",
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#2D3748",
        textAlign: "center",
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: "#718096",
        textAlign: "center",
        marginBottom: 24,
    },
    inputContainer: {
        width: "100%",
        marginBottom: 16,
    },
    input: {
        width: "100%",
        height: 48,
        borderWidth: 1,
        borderColor: "#E9D8FD",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: "#F7FAFC",
        color: "#2D3748",
    },
    loginButton: {
        width: "100%",
        backgroundColor: "#D6BCFA",
        borderRadius: 8,
        paddingVertical: 4,
        marginBottom: 16,
    },
    loginLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2D3748",
    },
    registerText: {
        fontSize: 14,
        color: "#718096",
        textAlign: "center",
    },
    registerLink: {
        color: "#FED7E2",
        fontWeight: "600",
    },
    orRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
        width: "100%",
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#E9D8FD",
    },
    orText: {
        marginHorizontal: 12,
        color: "#718096",
        fontSize: 14,
        fontWeight: "500",
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginVertical: 8,
    },
    googleButton: {
        flex: 1,
        marginRight: 8,
        backgroundColor: "#D6BCFA",
        borderRadius: 8,
        paddingVertical: 4,
    },
    microsoftButton: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: "#D6BCFA",
        borderRadius: 8,
        paddingVertical: 4,
    },
    socialLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2D3748",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "85%",
        maxWidth: 340,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2D3748",
        textAlign: "center",
        marginBottom: 12,
    },
    modalButtons: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 4,
        marginHorizontal: 4,
        backgroundColor: "#D6BCFA",
        borderColor: "#E9D8FD",
    },
    modalButtonLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2D3748",
    },
});
