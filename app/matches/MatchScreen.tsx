import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    StyleProp, // Tip uyumluluğu için eklendi (kullanılmadı ama iyi pratik)
    ViewStyle,
    TextStyle,
    ImageStyle,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome"; // Veya FontAwesome5
import { PanGestureHandler, PanGestureHandlerStateChangeEvent, GestureHandlerRootView, State } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient"; // Gradient için

// Kullanıcı Tipi
type PotentialUser = {
    user_id: string;
    name: string;
    university?: string;
    university_location?: string;
    birthdate?: string;
    zodiac_sign?: string;
    gender?: string;
    height?: string;
    relationship_goal?: string;
    likes?: string[];
    values?: string[];
    favorite_food?: string[];
    about?: string;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // Kaydırma eşiği

const MatchScreen: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [potentialMatches, setPotentialMatches] = useState<PotentialUser[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [matchPhotos, setMatchPhotos] = useState<any[]>([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [showMatchPopup, setShowMatchPopup] = useState(false);
    const [matchedUser, setMatchedUser] = useState<PotentialUser | null>(null);

    // Animasyon Değerleri
    const position = useRef(new Animated.ValueXY()).current;
    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ["-15deg", "0deg", "15deg"],
        extrapolate: "clamp",
    });
    const rotateAndTranslate = { transform: [{ rotate: rotate }, ...position.getTranslateTransform()] };
    const likeOpacity = position.x.interpolate({ inputRange: [SWIPE_THRESHOLD / 4, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: "clamp" });
    const nopeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 4], outputRange: [1, 0], extrapolate: "clamp" });
    const nextCardOpacity = useRef(new Animated.Value(0.7)).current;
    const nextCardScale = useRef(new Animated.Value(0.9)).current;

    // --- Fonksiyonlar ---
    const calculateAge = (birthdate?: string) => {
        /* ... (Önceki ile aynı) ... */ if (!birthdate) return null;
        try {
            const birthDate = new Date(birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return isNaN(age) || age < 0 ? null : age;
        } catch (e) {
            return null;
        }
    };
    const onGestureEvent = Animated.event([{ nativeEvent: { translationX: position.x, translationY: position.y } }], { useNativeDriver: false });
    const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            const { translationX } = event.nativeEvent;
            if (translationX > SWIPE_THRESHOLD) {
                forceSwipe("right");
            } else if (translationX < -SWIPE_THRESHOLD) {
                forceSwipe("left");
            } else {
                resetPosition();
            }
        }
    };
    const forceSwipe = (direction: "left" | "right") => {
        const xVal = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        Animated.timing(position, { toValue: { x: xVal, y: 0 }, duration: 250, useNativeDriver: false }).start(() => onSwipeComplete(direction));
    };
    const onSwipeComplete = async (direction: "left" | "right") => {
        if (currentIndex >= potentialMatches.length) return;
        const userSwiped = potentialMatches[currentIndex];
        if (!userSwiped) return;
        const swipeSuccess = await handleSwipeBackend(userSwiped.user_id, direction === "right" ? "like" : "dislike");
        if (swipeSuccess) {
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex((prevIndex) => prevIndex + 1);
            setCurrentPhotoIndex(0);
            Animated.parallel([
                Animated.timing(nextCardOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
                Animated.timing(nextCardScale, { toValue: 1, duration: 200, useNativeDriver: false }),
            ]).start(() => {
                nextCardOpacity.setValue(0.7);
                nextCardScale.setValue(0.9);
            });
        } else {
            resetPosition();
            Alert.alert("Hata", "İşlem gerçekleştirilemedi, lütfen tekrar deneyin.");
        }
    };
    const resetPosition = () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: false }).start();
    };
    const handleButtonSwipe = (action: "like" | "dislike") => {
        if (loading || currentIndex >= potentialMatches.length) return;
        forceSwipe(action === "like" ? "right" : "left");
    };
    const handleSwipeBackend = async (targetUserId: string, action: "like" | "dislike"): Promise<boolean> => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                router.replace("/login/login");
                return false;
            }
            const response = await fetch("http://127.0.0.1:5000/match/swipe", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ target_user_id: targetUserId, action }),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Swipe kaydedilemedi!");
            if (json.match === true && currentIndex < potentialMatches.length) {
                setMatchedUser(potentialMatches[currentIndex]);
                setShowMatchPopup(true);
            }
            return true;
        } catch (error) {
            console.error("Swipe backend error:", error);
            return false;
        }
    };
    const fetchPotentialMatches = async () => {
        try {
            setLoading(true);
            setPotentialMatches([]);
            setCurrentIndex(0);
            setMatchPhotos([]);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                router.replace("/login/login");
                return;
            }
            const response = await fetch("http://127.0.0.1:5000/match/potential", { headers: { Authorization: `Bearer ${token}` } });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Kullanıcılar çekilemedi!");
            setPotentialMatches(json.potential_matches || []);
        } catch (err) {
            console.error("Fetch matches error:", err);
            Alert.alert("Hata", err instanceof Error ? err.message : "Kullanıcılar yüklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };
    const fetchMatchPhotos = async (userId: string) => {
        setMatchPhotos([]);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const response = await fetch(`http://127.0.0.1:5000/auth/user-photos/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Fotoğraflar alınamadı!");
            setMatchPhotos(json.photos || []);
        } catch (error) {
            console.error("Fotoğraf çekme hatası:", userId, error);
            setMatchPhotos([]);
        }
    };

    // --- Effect'ler ---
    useEffect(() => {
        fetchPotentialMatches();
    }, []);
    useEffect(() => {
        if (potentialMatches.length > 0 && currentIndex < potentialMatches.length) {
            const nextUser = potentialMatches[currentIndex];
            if (nextUser) {
                fetchMatchPhotos(nextUser.user_id);
                setCurrentPhotoIndex(0);
            }
        } else if (!loading && potentialMatches.length > 0 && currentIndex >= potentialMatches.length) {
            fetchPotentialMatches();
        } else {
            setMatchPhotos([]);
        }
    }, [currentIndex, potentialMatches]); // potentialMatches bağımlılığı eklendi

    // --- Render Fonksiyonları ---
    const renderPhotoIndicators = () => {
        /* ... (Önceki ile aynı) ... */ if (matchPhotos.length <= 1) return null;
        return (
            <View style={styles.photoIndicatorContainer}>
                {" "}
                {matchPhotos.map((_, index) => (
                    <View key={`dot-${index}`} style={[styles.photoIndicatorDot, { opacity: index === currentPhotoIndex ? 1 : 0.5 }]} />
                ))}{" "}
            </View>
        );
    };

    const renderCards = () => {
        if (loading && potentialMatches.length === 0) {
            return (
                <View style={styles.centerContent}>
                    {" "}
                    <ActivityIndicator size="large" color="#6C5DD3" /> <Text style={styles.infoText}>Kullanıcılar yükleniyor...</Text>{" "}
                </View>
            );
        }
        if (!loading && potentialMatches.length === 0) {
            return (
                <View style={styles.centerContent}>
                    {" "}
                    <Icon name="users" size={50} color="#CED4DA" /> <Text style={[styles.infoText, { marginTop: 15 }]}>Gösterilecek kimse kalmadı!</Text>{" "}
                    <TouchableOpacity style={[styles.buttonSmall, { marginTop: 20 }]} onPress={fetchPotentialMatches}>
                        {" "}
                        <Icon name="refresh" size={16} color="#fff" /> <Text style={styles.buttonSmallText}>Yenile</Text>{" "}
                    </TouchableOpacity>{" "}
                </View>
            );
        }

        return potentialMatches
            .map((user, index) => {
                if (index < currentIndex) {
                    return null;
                }
                if (index === currentIndex) {
                    // Aktif Kart
                    return (
                        <PanGestureHandler key={user.user_id} onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
                            <Animated.View style={[styles.card, rotateAndTranslate]}>
                                {/* Like/Nope Rozetleri */}
                                <Animated.View style={[styles.badgeContainer, styles.likeBadge, { opacity: likeOpacity }]}>
                                    {" "}
                                    <Icon name="heart" size={40} color="#4CAF50" /> <Text style={[styles.badgeText, { color: "#4CAF50" }]}>BEĞENDİN</Text>{" "}
                                </Animated.View>
                                <Animated.View style={[styles.badgeContainer, styles.nopeBadge, { opacity: nopeOpacity }]}>
                                    {" "}
                                    <Icon name="times" size={40} color="#F44336" /> <Text style={[styles.badgeText, { color: "#F44336" }]}>GEÇTİN</Text>{" "}
                                </Animated.View>

                                {/* Fotoğraf Alanı */}
                                <View style={styles.photoSection}>
                                    {matchPhotos.length > 0 && matchPhotos[currentPhotoIndex]?.data ? (
                                        <Image
                                            source={{ uri: `data:image/jpeg;base64,${matchPhotos[currentPhotoIndex]?.data}` }}
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                            onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                                        />
                                    ) : (
                                        <View style={styles.photoPlaceholder}>
                                            {" "}
                                            <ActivityIndicator size="large" color="#fff" />{" "}
                                        </View>
                                    )}
                                    {renderPhotoIndicators()}
                                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.gradientOverlay} />
                                    {matchPhotos.length > 1 && (
                                        <>
                                            {" "}
                                            <TouchableOpacity
                                                style={[styles.arrowButton, styles.arrowLeft]}
                                                onPress={() => setCurrentPhotoIndex((prev) => Math.max(0, prev - 1))}
                                                disabled={currentPhotoIndex === 0}>
                                                {" "}
                                                <Icon name="chevron-left" size={24} color={currentPhotoIndex === 0 ? "rgba(255,255,255,0.3)" : "#fff"} />{" "}
                                            </TouchableOpacity>{" "}
                                            <TouchableOpacity
                                                style={[styles.arrowButton, styles.arrowRight]}
                                                onPress={() => setCurrentPhotoIndex((prev) => Math.min(matchPhotos.length - 1, prev + 1))}
                                                disabled={currentPhotoIndex === matchPhotos.length - 1}>
                                                {" "}
                                                <Icon
                                                    name="chevron-right"
                                                    size={24}
                                                    color={currentPhotoIndex === matchPhotos.length - 1 ? "rgba(255,255,255,0.3)" : "#fff"}
                                                />{" "}
                                            </TouchableOpacity>{" "}
                                        </>
                                    )}
                                    <View style={styles.overlayInfo}>
                                        <Text style={styles.overlayName}>
                                            {user.name}
                                            {calculateAge(user.birthdate) ? `, ${calculateAge(user.birthdate)}` : ""}
                                        </Text>
                                        {user.university && (
                                            <Text style={styles.overlayDetail} numberOfLines={1}>
                                                <Icon name="university" size={12} color="#eee" /> {user.university}
                                            </Text>
                                        )}
                                        {user.university_location && (
                                            <Text style={styles.overlayDetail} numberOfLines={1}>
                                                <Icon name="map-marker" size={12} color="#eee" /> {user.university_location}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Detay Bilgi Alanı */}
                                <ScrollView style={styles.infoContainer} contentContainerStyle={styles.infoContent}>
                                    {user.height && (
                                        <View style={styles.detailRow}>
                                            <Icon name="male" style={styles.detailIcon} />
                                            <Text style={styles.detailText}>{user.height} cm</Text>
                                        </View>
                                    )}
                                    {user.relationship_goal && (
                                        <View style={styles.detailRow}>
                                            <Icon name="heart" style={styles.detailIcon} />
                                            <Text style={styles.detailText}>Hedef: {user.relationship_goal}</Text>
                                        </View>
                                    )}
                                    {user.about && (
                                        <View style={styles.infoBlock}>
                                            <Text style={styles.infoHeader}>Hakkında</Text>
                                            <Text style={styles.userAbout}>{user.about}</Text>
                                        </View>
                                    )}
                                    {user.likes && user.likes.length > 0 && (
                                        <View style={styles.infoBlock}>
                                            <Text style={styles.infoHeader}>Beğeniler</Text>
                                            <View style={styles.tagsContainer}>
                                                {user.likes.map((like, idx) => (
                                                    <View key={`like-${idx}`} style={styles.tagBox}>
                                                        <Text style={styles.tagText}>{like}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                    {user.values && user.values.length > 0 && (
                                        <View style={styles.infoBlock}>
                                            <Text style={styles.infoHeader}>Değerler</Text>
                                            <View style={styles.tagsContainer}>
                                                {user.values.map((value, idx) => (
                                                    <View key={`value-${idx}`} style={styles.tagBox}>
                                                        <Text style={styles.tagText}>{value}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                    {user.favorite_food && user.favorite_food.length > 0 && (
                                        <View style={styles.infoBlock}>
                                            <Text style={styles.infoHeader}>Favori Yemekler</Text>
                                            <View style={styles.tagsContainer}>
                                                {user.favorite_food.map((food, idx) => (
                                                    <View key={`food-${idx}`} style={styles.tagBox}>
                                                        <Text style={styles.tagText}>{food}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                    {!(
                                        user.height ||
                                        user.relationship_goal ||
                                        user.about ||
                                        user.likes?.length ||
                                        user.values?.length ||
                                        user.favorite_food?.length
                                    ) && <Text style={styles.infoText}>Bu kullanıcı hakkında detaylı bilgi bulunmuyor.</Text>}
                                </ScrollView>
                            </Animated.View>
                        </PanGestureHandler>
                    );
                } else if (index === currentIndex + 1) {
                    // Arkadaki Kart
                    return (
                        <Animated.View
                            key={user.user_id}
                            style={[styles.card, styles.nextCard, { opacity: nextCardOpacity, transform: [{ scale: nextCardScale }] }]}>
                            {" "}
                            <View style={styles.photoSection}>
                                {" "}
                                <View style={styles.photoPlaceholder}>
                                    {" "}
                                    <Icon name="user-circle" size={100} color="#e0e0e0" />{" "}
                                </View>{" "}
                                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.gradientOverlay} />{" "}
                                <View style={styles.overlayInfo}>
                                    {" "}
                                    <Text style={styles.overlayName}>
                                        {user.name}
                                        {calculateAge(user.birthdate) ? `, ${calculateAge(user.birthdate)}` : ""}
                                    </Text>{" "}
                                </View>{" "}
                            </View>{" "}
                            <View style={styles.infoContainer}></View>{" "}
                        </Animated.View>
                    );
                } else {
                    return null;
                }
            })
            .reverse();
    };

    // --- Ana Return ---
    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.deckContainer}>{renderCards()}</View>
            {/* Alt Butonlar */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.swipeButton, styles.nopeButton]}
                    onPress={() => handleButtonSwipe("dislike")}
                    disabled={loading || currentIndex >= potentialMatches.length || potentialMatches.length === 0}>
                    {" "}
                    <Icon name="times" size={30} color="#F44336" />{" "}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.swipeButton, styles.likeButton]}
                    onPress={() => handleButtonSwipe("like")}
                    disabled={loading || currentIndex >= potentialMatches.length || potentialMatches.length === 0}>
                    {" "}
                    <Icon name="heart" size={30} color="#4CAF50" />{" "}
                </TouchableOpacity>
            </View>
            {/* Eşleşme Popup */}
            {showMatchPopup && matchedUser && (
                <View style={styles.popupContainer}>
                    {" "}
                    <View style={styles.popupBox}>
                        {" "}
                        <Text style={styles.popupTitle}>Eşleşme!</Text>{" "}
                        <View style={styles.popupImageContainer}>
                            {" "}
                            <Icon name="user-circle" size={60} color="#CED4DA" />{" "}
                        </View>{" "}
                        <Text style={styles.popupText}>Sen ve {matchedUser.name} birbirinizi beğendiniz.</Text>{" "}
                        <View style={styles.popupButtonRow}>
                            {" "}
                            <TouchableOpacity style={styles.popupButtonSecondary} onPress={() => setShowMatchPopup(false)}>
                                {" "}
                                <Text style={[styles.popupButtonText, { color: "#333" }]}>Kapat</Text>{" "}
                            </TouchableOpacity>{" "}
                            <TouchableOpacity
                                style={styles.popupButtonPrimary}
                                onPress={() => {
                                    setShowMatchPopup(false);
                                    router.push({ pathname: "/messages/Messages", params: { userId: matchedUser.user_id, userName: matchedUser.name } });
                                }}>
                                {" "}
                                <Text style={styles.popupButtonText}>Mesaj Gönder</Text>{" "}
                            </TouchableOpacity>{" "}
                        </View>{" "}
                    </View>{" "}
                </View>
            )}
        </GestureHandlerRootView>
    );
};

// --- Stil Tanımları ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA", alignItems: "center", paddingTop: Platform.OS === "android" ? 30 : 60, paddingBottom: 20 },
    deckContainer: { flex: 1, width: SCREEN_WIDTH, justifyContent: "center", alignItems: "center" },
    centerContent: { flex: 1, justifyContent: "center", alignItems: "center", width: SCREEN_WIDTH * 0.8 },
    infoText: { fontSize: 16, color: "#6C757D", textAlign: "center", marginTop: 10 },
    card: {
        width: SCREEN_WIDTH * 0.9,
        maxWidth: 400,
        height: SCREEN_HEIGHT * 0.75,
        maxHeight: 700,
        backgroundColor: "#fff",
        borderRadius: 20,
        position: "absolute",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#E9ECEF",
        flexDirection: "column",
    },
    nextCard: { zIndex: -1 },
    photoSection: {
        width: "100%",
        flex: 2,
        /* <<< Değiştirildi >>> */ backgroundColor: "#E0E0E0",
        position: "relative",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
    },
    photoPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#CED4DA" },
    cardImage: { width: "100%", height: "100%" },
    photoIndicatorContainer: {
        position: "absolute",
        top: 10,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: 15,
        gap: 5,
    },
    photoIndicatorDot: { height: 6, backgroundColor: "#FFF", borderRadius: 3, flex: 1 },
    gradientOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: "40%" },
    overlayInfo: { position: "absolute", bottom: 10, left: 15, right: 15 },
    overlayName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        textShadowColor: "rgba(0, 0, 0, 0.6)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        marginBottom: 3,
    },
    overlayDetail: {
        fontSize: 14,
        color: "#eee",
        textShadowColor: "rgba(0, 0, 0, 0.6)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        marginLeft: 2,
    },
    arrowButton: { position: "absolute", top: "50%", transform: [{ translateY: -18 }], padding: 6 },
    arrowLeft: { left: 5 },
    arrowRight: { right: 5 },
    infoContainer: { flex: 3, /* <<< Değiştirildi >>> */ backgroundColor: "#fff", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, width: "100%" },
    infoContent: { padding: 20, paddingBottom: 40 },
    infoBlock: { marginVertical: 10 },
    detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    detailIcon: { color: "#868E96", marginRight: 10, fontSize: 15, width: 20, textAlign: "center" },
    detailText: { fontSize: 14, color: "#343A40", flexShrink: 1 },
    infoHeader: { fontSize: 15, fontWeight: "600", marginBottom: 8, color: "#495057" },
    userAbout: { fontSize: 14, color: "#495057", lineHeight: 22 },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tagBox: { backgroundColor: "#E9ECEF", borderRadius: 15, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: "#DEE2E6" },
    tagText: { fontSize: 12, color: "#495057", fontWeight: "500" },
    bulletText: { fontSize: 14, color: "#495057", lineHeight: 21 },
    buttonsContainer: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-evenly",
        paddingHorizontal: 30,
        paddingBottom: 15,
        paddingTop: 15,
        position: "absolute",
        bottom: 20,
    },
    swipeButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 6,
    },
    nopeButton: { borderColor: "#F44336", borderWidth: 2 },
    likeButton: { borderColor: "#4CAF50", borderWidth: 2 },
    buttonSmall: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: "#6C5DD3",
    },
    buttonSmallText: { color: "#fff", fontSize: 14, fontWeight: "bold", marginLeft: 5 },
    badgeContainer: {
        position: "absolute",
        top: 30,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 3,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        zIndex: 10,
        alignItems: "center",
    },
    likeBadge: { left: 20, borderColor: "#4CAF50", transform: [{ rotate: "-15deg" }] },
    nopeBadge: { right: 20, borderColor: "#F44336", transform: [{ rotate: "15deg" }] },
    badgeText: { fontSize: 18, fontWeight: "bold", marginTop: 5, textTransform: "uppercase" },
    popupContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
    },
    popupBox: {
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 360,
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 25,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    popupImageContainer: { marginBottom: 15 },
    popupTitle: { fontSize: 24, fontWeight: "bold", color: "#6C5DD3", marginBottom: 15 },
    popupText: { fontSize: 16, textAlign: "center", color: "#495057", marginBottom: 25, lineHeight: 22 },
    popupButtonRow: { flexDirection: "row", width: "100%", justifyContent: "space-between", marginTop: 10, gap: 10 },
    popupButtonSecondary: { backgroundColor: "#E9ECEF", paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: "center" },
    popupButtonPrimary: { backgroundColor: "#6C5DD3", paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: "center" },
    popupButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});

export default MatchScreen;
