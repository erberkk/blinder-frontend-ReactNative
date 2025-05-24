import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome5";
import Modal from "react-native-modal";

type MatchedUser = {
    match_id: string;
    user_id: number | string;
    name: string;
    picture?: string;
    university?: string;
    university_location?: string;
    birthdate?: string;
    matched_at?: string;
};

type MessageItem = {
    message_id: string;
    match_id: string;
    sender_id: number | string;
    message_text: string;
    timestamp: string;
};

const MessagesScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId?: string; userName?: string }>();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<MatchedUser | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [inputText, setInputText] = useState("");
    const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isUnmatching, setIsUnmatching] = useState<boolean>(false);
    const [isUnmatchModalVisible, setIsUnmatchModalVisible] = useState<boolean>(false);
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState<boolean>(false);
    const [suggestedMessage, setSuggestedMessage] = useState<string>("");

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const fetchCurrentUserId = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                router.replace("/login/login");
                return;
            }
            const res = await fetch("http://127.0.0.1:5000/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Profil alınamadı!");
            const userId = json.user?._id ?? json._id ?? json.user?.id ?? json.id;
            if (userId === undefined || userId === null) throw new Error("Kullanıcı ID'si alınamadı: API yanıtını kontrol edin.");
            const userIdString = String(userId);
            setCurrentUserId(userIdString);
        } catch (err) {
            console.error("Fetch Current User ID error:", err);
            Alert.alert("Oturum Hatası", "Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            await AsyncStorage.removeItem("token");
            router.replace("/login/login");
        }
    }, [router]);

    const fetchMatchedUsers = useCallback(async () => {
        setLoadingMatches(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                router.replace("/login/login");
                return;
            }
            const res = await fetch("http://127.0.0.1:5000/match/my-matches", { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Eşleşmeler alınamadı!");
            const fetchedMatches = json.matches || [];
            setMatchedUsers(fetchedMatches);

            if (selectedMatch) {
                const stillExists = fetchedMatches.find((m: MatchedUser) => m.match_id === selectedMatch.match_id);
                if (!stillExists) {
                    setSelectedMatch(null);
                    setMessages([]);
                }
            } else if (params.userId && fetchedMatches.length > 0) {
                const preSelectedMatch = fetchedMatches.find((m: MatchedUser) => String(m.user_id) === params.userId);
                if (preSelectedMatch) {
                    setSelectedMatch(preSelectedMatch);
                }
            }
        } catch (err) {
            console.error("Fetch Matched Users error:", err);
        } finally {
            setLoadingMatches(false);
        }
    }, [router, params.userId, selectedMatch?.match_id]);

    const fetchMessages = useCallback(
        async (showError = true, isInitialFetch = false) => {
            if (!selectedMatch?.match_id) return;
            if (isInitialFetch) setLoadingMessages(true);
            try {
                const token = await AsyncStorage.getItem("token");
                if (!token) {
                    router.replace("/login/login");
                    return;
                }
                const res = await fetch(`http://127.0.0.1:5000/message/conversation?match_id=${selectedMatch.match_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (!res.ok) {
                    if (res.status === 404) {
                        console.log("Match not found (404), removing from list.");
                        const removedMatchId = selectedMatch.match_id;
                        setMatchedUsers((prev) => prev.filter((m) => m.match_id !== removedMatchId));
                        setSelectedMatch(null);
                        setMessages([]);
                        return;
                    }
                    throw new Error(json.error || "Mesajlar alınamadı!");
                }
                setMessages((prevMessages) => {
                    const newMessages = json.messages || [];
                    if (
                        prevMessages.length !== newMessages.length ||
                        (prevMessages.length > 0 &&
                            newMessages.length > 0 &&
                            prevMessages[prevMessages.length - 1].message_id !== newMessages[newMessages.length - 1]?.message_id)
                    ) {
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
                        return newMessages;
                    }
                    return prevMessages;
                });
            } catch (err) {
                if (showError) {
                    console.error("Fetch Messages error:", err);
                } else {
                    console.warn("Silent fetch messages error (polling):", err);
                }
            } finally {
                if (isInitialFetch) setLoadingMessages(false);
            }
        },
        [selectedMatch?.match_id, router]
    );

    const sendMessage = useCallback(async () => {
        const textToSend = inputText.trim();
        if (!textToSend || !selectedMatch?.match_id || !currentUserId || isSending) return;
        setIsSending(true);
        const tempMessageId = `temp_${Date.now()}`;
        const optimisticMessage: MessageItem = {
            message_id: tempMessageId,
            match_id: selectedMatch.match_id,
            sender_id: currentUserId,
            message_text: textToSend,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setInputText("");
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) throw new Error("Oturum bulunamadı.");
            const res = await fetch("http://127.0.0.1:5000/message/send", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ match_id: selectedMatch.match_id, message_text: textToSend }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Mesaj gönderilemedi!");

            setMessages((prev) => prev.map((msg) => (msg.message_id === tempMessageId ? { ...json.message } : msg)));
        } catch (err) {
            console.error("Send Message error:", err);
            Alert.alert("Gönderim Hatası", err instanceof Error ? err.message : "Mesaj gönderilirken bir sorun oluştu.");
            setMessages((prev) => prev.filter((msg) => msg.message_id !== tempMessageId));
            setInputText(textToSend);
        } finally {
            setIsSending(false);
        }
    }, [inputText, selectedMatch?.match_id, currentUserId, isSending]);

    const handleUnmatch = useCallback(() => {
        if (!selectedMatch) {
            Alert.alert("Hata", "Eşleşmeyi kaldırmak için önce bir sohbet seçmelisiniz.");
            return;
        }
        if (isUnmatching) {
            return;
        }
        setIsUnmatchModalVisible(true);
    }, [selectedMatch, isUnmatching]);

    const confirmUnmatch = useCallback(async () => {
        if (!selectedMatch || isUnmatching) {
            return;
        }
        setIsUnmatching(true);
        setIsUnmatchModalVisible(false);

        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
                router.replace("/login/login");
                throw new Error("Oturum bulunamadı.");
            }

            const matchIdToUnmatch = selectedMatch.match_id;

            const res = await fetch("http://127.0.0.1:5000/match/unmatch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ match_id: matchIdToUnmatch }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Eşleşme kaldırılamadı.");
            }
            console.log("Unmatch successful:", json.message || "Eşleşme kaldırıldı.");
            setSelectedMatch(null);
            setMessages([]);
            setMatchedUsers((prev) => prev.filter((match) => match.match_id !== matchIdToUnmatch));
        } catch (err) {
            console.error("Unmatch error:", err);
            Alert.alert("Hata", err instanceof Error ? err.message : "Eşleşme kaldırılırken bir sorun oluştu.");
        } finally {
            setIsUnmatching(false);
        }
    }, [selectedMatch, isUnmatching, router, setMatchedUsers, setSelectedMatch, setMessages]);

    const translateToTurkish = async (englishText: string): Promise<string> => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishText)}&langpair=en|tr`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText.trim();
        }
        throw new Error("Çeviri yapılamadı");
    };

    const generateMessageSuggestion = useCallback(async () => {
        if (!selectedMatch?.match_id || !currentUserId || isGeneratingSuggestion) return;

        setIsGeneratingSuggestion(true);
        try {
            const lastMessage = messages[messages.length - 1];
            const previousMessage = messages[messages.length - 2];
            if (!lastMessage) return;

            const isLastMessageFromMe = String(lastMessage.sender_id) === currentUserId;
            const messageToRespondTo = isLastMessageFromMe ? previousMessage : lastMessage;
            if (!messageToRespondTo) return;

            // 1. İngilizce cevap üret
            const englishPrompt = `
    You are a chat assistant. Suggest a short, natural, and casual reply in English to the message below. Make it sound like a real chat between friends. Do not add explanations. Only reply with the message, nothing else (no names, no emojis, no formal language).

    Message to reply:
    "${messageToRespondTo.message_text}"
            `.trim();

            const englishResponse = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "mistral:latest",
                    prompt: englishPrompt,
                    stream: false,
                    options: {
                        temperature: 0.92,
                        top_p: 0.98,
                        max_tokens: 32,
                    },
                }),
            });

            const englishData = await englishResponse.json();
            console.log(englishData.response);
            if (!englishData.response) throw new Error("No English response generated");

            // 2. İngilizce cevabı Türkçe'ye çevir (LibreTranslate ile)
            const turkishText = await translateToTurkish(englishData.response);

            // 3. (İsteğe bağlı) Temizlik veya native tweakler burada yapılabilir

            setSuggestedMessage(turkishText);
        } catch (err) {
            console.error("Generate suggestion error:", err);
            Alert.alert("Hata", "Mesaj önerisi oluşturulurken bir sorun oluştu.");
        } finally {
            setIsGeneratingSuggestion(false);
        }
    }, [messages, selectedMatch, currentUserId, isGeneratingSuggestion]);

    const useSuggestion = useCallback(() => {
        if (suggestedMessage) {
            setInputText(suggestedMessage);
            setSuggestedMessage("");
        }
    }, [suggestedMessage]);

    useEffect(() => {
        fetchCurrentUserId();
    }, [fetchCurrentUserId]);

    useEffect(() => {
        if (currentUserId) {
            fetchMatchedUsers();
        }
    }, [currentUserId, fetchMatchedUsers]);

    useEffect(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        if (selectedMatch?.match_id && currentUserId) {
            fetchMessages(true, true);
            pollingIntervalRef.current = setInterval(() => fetchMessages(false, false), 5000);
        } else {
            setMessages([]);
        }
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [selectedMatch?.match_id, fetchMessages, currentUserId]);

    const renderMatchedUserItem = useCallback(
        ({ item }: { item: MatchedUser }) => (
            <TouchableOpacity
                style={[styles.matchedUserItem, selectedMatch?.match_id === item.match_id && styles.matchedUserItemSelected]}
                onPress={() => {
                    setSelectedMatch(item);
                }}
                key={item.match_id}>
                <View style={styles.userRow}>
                    <Image source={item.picture ? { uri: item.picture } : require("../../assets/images/icon.png")} style={styles.userAvatar} />
                    <View style={styles.userNameContainer}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {item.name}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        ),
        [selectedMatch?.match_id]
    );

    const renderMessageItem = useCallback(
        ({ item }: { item: MessageItem }) => {
            const isMyMessage = String(item.sender_id) === currentUserId;
            return (
                <View key={item.message_id} style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
                    <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item.message_text}</Text>
                        <Text style={[styles.messageTimestamp, isMyMessage && styles.myMessageTimestamp]}>{formatDate(item.timestamp)}</Text>
                    </View>
                </View>
            );
        },
        [currentUserId]
    );

    const formatDate = (isoString: string): string => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return isoString;
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.mainContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
            <View style={styles.columnsContainer}>
                <View style={styles.leftColumn}>
                    <Text style={styles.columnTitle}>Sohbetler</Text>
                    {loadingMatches ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color="#6C5DD3" />
                    ) : matchedUsers.length === 0 ? (
                        <Text style={styles.emptyListText}>Henüz eşleşmen yok.</Text>
                    ) : (
                        <FlatList
                            data={matchedUsers}
                            keyExtractor={(item) => item.match_id}
                            renderItem={renderMatchedUserItem}
                            contentContainerStyle={{ flexGrow: 1 }}
                        />
                    )}
                </View>

                <View style={styles.rightColumn}>
                    {!selectedMatch ? (
                        <View style={styles.noChatSelectedContainer}>
                            <Icon name="comments" size={60} color="#CED4DA" />
                            <Text style={styles.noChatSelectedText}>Sohbet etmek için bir eşleşme seçin.</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.chatHeader}>
                                <Image
                                    source={selectedMatch.picture ? { uri: selectedMatch.picture } : require("../../assets/images/icon.png")}
                                    style={styles.chatHeaderAvatar}
                                />
                                <Text style={styles.chatHeaderName} numberOfLines={1}>
                                    {selectedMatch.name}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleUnmatch}
                                    disabled={isUnmatching}
                                    style={styles.unmatchButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Icon name="user-times" size={20} color="#DC3545" />
                                </TouchableOpacity>
                            </View>

                            {loadingMessages ? (
                                <View style={styles.messageLoadingContainer}>
                                    <ActivityIndicator color="#6C5DD3" />
                                    <Text style={styles.messageLoadingText}>Mesajlar yükleniyor...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    renderItem={renderMessageItem}
                                    keyExtractor={(item) => item.message_id}
                                    style={styles.flatList}
                                    contentContainerStyle={styles.flatListContent}
                                    ListEmptyComponent={
                                        <View style={styles.emptyChatContainer}>
                                            <Text style={styles.emptyChatText}>Henüz mesaj yok. İlk mesajı gönderin!</Text>
                                        </View>
                                    }
                                />
                            )}

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Mesajını yaz..."
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholderTextColor="#999"
                                    multiline
                                    editable={!isUnmatching}
                                />
                                <View style={styles.suggestionContainer}>
                                    {suggestedMessage ? (
                                        <TouchableOpacity style={styles.suggestionButton} onPress={useSuggestion}>
                                            <Text style={styles.suggestionText} numberOfLines={1}>
                                                {suggestedMessage}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.aiButton, isGeneratingSuggestion && styles.aiButtonDisabled]}
                                            onPress={generateMessageSuggestion}
                                            disabled={isGeneratingSuggestion}>
                                            {isGeneratingSuggestion ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Icon name="robot" size={18} color="#fff" solid />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.sendButton, (isSending || !inputText.trim() || isUnmatching) && styles.sendButtonDisabled]}
                                    onPress={sendMessage}
                                    disabled={isSending || !inputText.trim() || isUnmatching}>
                                    {isSending ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="paper-plane" size={18} color="#fff" solid />}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {selectedMatch && (
                <Modal
                    isVisible={isUnmatchModalVisible}
                    onBackdropPress={() => !isUnmatching && setIsUnmatchModalVisible(false)}
                    onBackButtonPress={() => !isUnmatching && setIsUnmatchModalVisible(false)}
                    animationIn="fadeInUp"
                    animationOut="fadeOutDown"
                    backdropTransitionOutTiming={0}
                    style={styles.modalStyle}
                    deviceWidth={Dimensions.get("window").width}
                    deviceHeight={Dimensions.get("window").height}
                    useNativeDriver={Platform.OS !== "web"}
                    useNativeDriverForBackdrop={Platform.OS !== "web"}
                    hideModalContentWhileAnimating>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Emin misiniz?</Text>
                        <Text style={styles.modalMessage}>
                            <Text style={{ fontWeight: "bold" }}>{selectedMatch.name}</Text> ile eşleşmeyi kaldırmak istediğinize emin misiniz? Bu işlem geri
                            alınamaz ve bu kişiyle olan sohbetiniz silinir.
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsUnmatchModalVisible(false)}
                                disabled={isUnmatching}>
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmUnmatch} disabled={isUnmatching}>
                                {isUnmatching ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Eşleşmeyi Kaldır</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: "#F8F9FA" },
    columnsContainer: { flex: 1, flexDirection: "row" },
    leftColumn: {
        width: Platform.OS === "web" ? 300 : "35%",
        maxWidth: 350,
        minWidth: Platform.OS === "web" ? 250 : 100,
        backgroundColor: "#FFFFFF",
        borderRightWidth: 1,
        borderRightColor: "#E9ECEF",
        flexDirection: "column",
    },
    columnTitle: {
        fontSize: 20,
        fontWeight: "600",
        paddingHorizontal: 16,
        paddingVertical: 18,
        color: "#343A40",
        borderBottomWidth: 1,
        borderBottomColor: "#E9ECEF",
        flexShrink: 0,
    },
    matchedUserItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F1F3F5", backgroundColor: "transparent" },
    matchedUserItemSelected: { backgroundColor: "#E9ECEF" },
    userRow: { flexDirection: "row", alignItems: "center" },
    userAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: "#E9ECEF" },
    userNameContainer: { flex: 1 },
    userName: { fontSize: 16, fontWeight: "500", color: "#212529" },
    emptyListText: { padding: 20, textAlign: "center", color: "#6C757D", fontSize: 14, marginTop: 20, flex: 1, textAlignVertical: "center" },
    rightColumn: { flex: 1, backgroundColor: "#F8F9FA", flexDirection: "column" },
    noChatSelectedContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    noChatSelectedText: { fontSize: 16, color: "#ADB5BD", marginTop: 15, textAlign: "center" },
    chatHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E9ECEF",
        flexShrink: 0,
    },
    chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#E9ECEF" },
    chatHeaderName: { fontSize: 17, fontWeight: "600", color: "#343A40", flex: 1, marginRight: 8 },
    unmatchButton: { padding: 8, justifyContent: "center", alignItems: "center" },
    flatList: { flex: 1 },
    flatListContent: { paddingVertical: 10, paddingHorizontal: 10, flexGrow: 1, justifyContent: "flex-end" },
    messageLoadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    messageLoadingText: { marginTop: 8, fontSize: 14, color: "#6C757D" },
    emptyChatContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    emptyChatText: { fontSize: 14, color: "#6C757D", textAlign: "center" },
    messageRow: { flexDirection: "row", marginVertical: 5 },
    myMessageRow: { justifyContent: "flex-end" },
    otherMessageRow: { justifyContent: "flex-start" },
    messageBubble: { borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, maxWidth: "85%" },
    myMessageBubble: { backgroundColor: "#6C5DD3", borderBottomRightRadius: 5 },
    otherMessageBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#E9ECEF" },
    messageText: { fontSize: 15, lineHeight: 21, color: "#212529" },
    myMessageText: { color: "#FFFFFF" },
    messageTimestamp: { fontSize: 11, color: "#ADB5BD", alignSelf: "flex-end", marginTop: 4 },
    myMessageTimestamp: { color: "rgba(255, 255, 255, 0.7)" },
    inputContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E9ECEF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: "flex-end",
        flexShrink: 0,
    },
    textInput: {
        flex: 1,
        minHeight: 42,
        maxHeight: 100,
        backgroundColor: "#F1F3F5",
        borderRadius: 21,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        marginRight: 10,
    },
    sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#6C5DD3", justifyContent: "center", alignItems: "center", marginBottom: 0 },
    sendButtonDisabled: { backgroundColor: "#BDBDBD", opacity: 0.7 },
    modalStyle: {
        justifyContent: "center",
        alignItems: "center",
        margin: 0,
    },
    modalContent: {
        backgroundColor: "white",
        padding: 22,
        borderRadius: 8,
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        width: "90%",
        maxWidth: 400,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 12,
        color: "#343A40",
    },
    modalMessage: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        marginBottom: 25,
        color: "#495057",
    },
    modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 5,
        minHeight: 44,
    },
    cancelButton: {
        backgroundColor: "#F8F9FA",
        borderWidth: 1,
        borderColor: "#DEE2E6",
    },
    cancelButtonText: {
        color: "#495057",
        fontSize: 16,
        fontWeight: "500",
    },
    confirmButton: {
        backgroundColor: "#DC3545",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "500",
    },
    suggestionContainer: {
        marginRight: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    aiButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0,
    },
    aiButtonDisabled: {
        backgroundColor: "#BDBDBD",
        opacity: 0.7,
    },
    suggestionButton: {
        backgroundColor: "#E3F2FD",
        borderRadius: 21,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxWidth: 200,
        marginBottom: 0,
    },
    suggestionText: {
        color: "#1976D2",
        fontSize: 14,
    },
});

export default MessagesScreen;
