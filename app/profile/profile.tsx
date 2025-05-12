import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Alert,
    ActivityIndicator,
    Linking,
    Image,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StyleProp,
    ViewStyle,
    TextStyle,
    ImageStyle,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { motion } from "framer-motion";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import newLayoutStyles from "./profileStyles";
import Icon from "react-native-vector-icons/FontAwesome5";

const MView = motion(View);

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [spotifyTracks, setSpotifyTracks] = useState<any[]>([]);
    const [spotifyArtists, setSpotifyArtists] = useState<any[]>([]);
    const [loadingSpotify, setLoadingSpotify] = useState<boolean>(false);
    const [userPhotos, setUserPhotos] = useState<any[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; fileExt: string } | null>(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setProfile(null);
                router.replace("/login/login");
                return;
            }
            const response = await fetch("http://127.0.0.1:5000/auth/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            if (response.status === 401) {
                await AsyncStorage.removeItem("token");
                router.replace("/login/login");
                return;
            }
            if (!response.ok) throw new Error(json.error || `Profil verisi alınamadı (${response.status})`);
            setProfile(json.user);
        } catch (error) {
            console.error("Profil alınamadı:", error);
            setProfile(null);
            await AsyncStorage.removeItem("token");
            router.replace("/login/login");
        } finally {
            setLoading(false);
        }
    };

    const handleSpotifyLogin = async () => {
        const SPOTIFY_CLIENT_ID = "your-spotify-client-id";
        const REDIRECT_URI = "http://127.0.0.1:5000/spotify/callback";

        const token = await AsyncStorage.getItem("token");
        if (!token) {
            Alert.alert("Hata", "Lütfen giriş yapın!");
            return;
        }

        const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-top-read&state=${encodeURIComponent(token)}`;

        try {
            await Linking.openURL(authUrl);
        } catch (err) {
            console.error("Spotify linkini açarken hata oluştu:", err);
            Alert.alert("Hata", "Spotify bağlantısı açılamadı.");
        }
    };

    const fetchSpotifyTracks = async () => {
        try {
            setLoadingSpotify(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const response = await fetch("http://127.0.0.1:5000/spotify/top-tracks", {
                // API URL'inizi kontrol edin
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401) {
                await AsyncStorage.removeItem("token");
                router.replace("/login/login");
                return;
            }
            if (!response.ok) throw new Error(`Spotify şarkı verisi alınamadı (${response.status})`);
            const json = await response.json();
            if (!json.tracks || !Array.isArray(json.tracks)) {
                setSpotifyTracks([]);
                return;
            }
            setSpotifyTracks(json.tracks.slice(0, 5));
        } catch (error) {
            console.error("Spotify şarkı hatası:", error);
            setSpotifyTracks([]);
        } finally {
            setLoadingSpotify(false);
        }
    };

    const fetchSpotifyArtists = async () => {
        try {
            setLoadingSpotify(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const response = await fetch("http://127.0.0.1:5000/spotify/top-artists", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401) {
                await AsyncStorage.removeItem("token");
                router.replace("/login/login");
                return;
            }
            if (!response.ok) throw new Error(`Spotify sanatçı verisi alınamadı (${response.status})`);
            const json = await response.json();
            if (!json.artists || !Array.isArray(json.artists)) {
                setSpotifyArtists([]);
                return;
            }
            setSpotifyArtists(json.artists.slice(0, 5));
        } catch (error) {
            console.error("Spotify sanatçı hatası:", error);
            setSpotifyArtists([]);
        } finally {
            setLoadingSpotify(false);
        }
    };

    const fetchUserPhotos = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const response = await fetch("http://127.0.0.1:5000/auth/photos", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401) {
                await AsyncStorage.removeItem("token");
                router.replace("/login/login");
                return;
            }
            if (!response.ok) throw new Error(`Fotoğraflar alınamadı (${response.status})`);
            const json = await response.json();
            setUserPhotos(json.photos || []);
        } catch (error) {
            console.error("Fotoğraf çekme hatası:", error);
            setUserPhotos([]);
        }
    };

    const calculateAge = (birthdate: string) => {
        if (!birthdate) return "-";
        try {
            const birthDate = new Date(birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return isNaN(age) || age < 0 ? "-" : age;
        } catch (e) {
            return "-";
        }
    };

    const uriToBase64 = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result.split(",")[1]);
                } else {
                    reject(new Error("Dosya data URL olarak okunamadı."));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(blob);
        });
    };

    const handlePhotoUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni vermelisiniz.");
                return;
            }
            if (userPhotos.length >= 3) {
                Alert.alert("Sınır Dolu", "Maksimum 3 fotoğraf yükleyebilirsiniz.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                allowsEditing: true,
                aspect: [1, 1],
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                let fileExt = "jpg";
                if (asset.uri) {
                    if (asset.mimeType) {
                        fileExt = asset.mimeType.split("/")[1]?.toLowerCase() || "jpg";
                    } else {
                        const uriParts = asset.uri.split(".");
                        const ext = uriParts.pop()?.toLowerCase();
                        if (ext) fileExt = ext;
                    }
                }
                const allowedExtensions = ["jpg", "jpeg", "png"];
                if (!allowedExtensions.includes(fileExt)) {
                    Alert.alert("Geçersiz Dosya Türü", "Lütfen sadece JPG, JPEG veya PNG formatında bir fotoğraf seçin.");
                    return;
                }
                setSelectedPhoto({ uri: asset.uri, fileExt });
            }
        } catch (error) {
            console.error("Fotoğraf seçme işlemi sırasında hata:", error);
            Alert.alert("İşlem Başarısız", "Fotoğraf seçilirken beklenmedik bir sorun oluştu.");
        }
    };

    const uploadSelectedPhoto = async () => {
        if (!selectedPhoto) return;
        setLoading(true);
        try {
            const base64Data = await uriToBase64(selectedPhoto.uri);
            const photoData = {
                file_name: `profile_${Date.now()}.${selectedPhoto.fileExt}`,
                data: base64Data,
            };
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Oturum Hatası", "Lütfen tekrar giriş yapın.");
                setLoading(false);
                router.replace("/login/login");
                return;
            }
            const response = await fetch("http://127.0.0.1:5000/auth/photos/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ photos: [photoData] }),
            });
            if (response.status === 401) {
                await AsyncStorage.removeItem("token");
                router.replace("/login/login");
                return;
            }
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || `Fotoğraf yüklenemedi (${response.status})`);
            setSelectedPhoto(null);
            await fetchUserPhotos();
            Alert.alert("Başarılı!", "Fotoğrafınız başarıyla yüklendi.");
        } catch (error) {
            console.error("Fotoğraf yükleme işlemi hatası:", error);
            Alert.alert("Yükleme Başarısız", error instanceof Error ? error.message : "Fotoğraf yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const deletePhoto = async (photoId: string) => {
        Alert.alert(
            "Emin misiniz?",
            "Bu fotoğrafı kalıcı olarak silmek istediğinizden emin misiniz?",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const token = await AsyncStorage.getItem("token");
                            if (!token) {
                                Alert.alert("Oturum Hatası", "Lütfen tekrar giriş yapın.");
                                setLoading(false);
                                router.replace("/login/login");
                                return;
                            }
                            const response = await fetch(`http://127.0.0.1:5000/auth/photos/${photoId}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (response.status === 401) {
                                await AsyncStorage.removeItem("token");
                                router.replace("/login/login");
                                return;
                            }
                            const json = await response.json();
                            if (!response.ok) throw new Error(json.error || `Fotoğraf silinemedi (${response.status})`);
                            Alert.alert("Silindi!", "Fotoğraf başarıyla silindi.");
                            await fetchUserPhotos();
                        } catch (error) {
                            console.error("Fotoğraf silme hatası:", error);
                            Alert.alert("Silme Başarısız", error instanceof Error ? error.message : "Fotoğraf silinirken bir sorun oluştu.");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            return () => {};
        }, [])
    );
    useEffect(() => {
        if (profile) {
            fetchUserPhotos();
            if (profile.spotify_connected) {
                fetchSpotifyTracks();
                fetchSpotifyArtists();
            } else {
                setSpotifyTracks([]);
                setSpotifyArtists([]);
            }
        } else {
            setUserPhotos([]);
            setSpotifyTracks([]);
            setSpotifyArtists([]);
            setSelectedPhoto(null);
        }
    }, [profile]);

    const renderDetailRow = (iconName: string, label: string, value: string | number | null | undefined) => {
        if (value === null || value === undefined || String(value).trim() === "" || value === "-") {
            return null;
        }
        return (
            <View style={newLayoutStyles.detailRow as StyleProp<ViewStyle>}>
                <Icon name={iconName} style={newLayoutStyles.detailIcon as any} />
                <Text style={newLayoutStyles.detailLabel as StyleProp<TextStyle>}>{label}:</Text>
                <Text style={newLayoutStyles.detailValue as StyleProp<TextStyle>}>{value}</Text>
            </View>
        );
    };

    const renderListDetailRow = (iconName: string, label: string, values: string[] | null | undefined) => {
        if (!values || values.length === 0) return null;
        return renderDetailRow(iconName, label, values.join(", "));
    };

    if (loading && !profile) {
        return (
            <View style={newLayoutStyles.loadingContainer as StyleProp<ViewStyle>}>
                <ActivityIndicator size="large" color="#6C5DD3" />
                <Text style={newLayoutStyles.loadingText as StyleProp<TextStyle>}>Profil Yükleniyor...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={newLayoutStyles.loadingContainer as StyleProp<ViewStyle>}>
                <Text style={newLayoutStyles.errorText as StyleProp<TextStyle>}>Profil bilgileri alınamadı veya oturumunuz sonlanmış.</Text>
                <TouchableOpacity
                    onPress={() => router.replace("/login/login")}
                    style={[newLayoutStyles.button, { backgroundColor: "#6C5DD3" }] as StyleProp<ViewStyle>}>
                    <Text style={newLayoutStyles.buttonText as StyleProp<TextStyle>}>Giriş Ekranına Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={newLayoutStyles.container as StyleProp<ViewStyle>}>
            {(loading || loadingSpotify) && (
                <ActivityIndicator style={newLayoutStyles.inlineLoadingIndicator as StyleProp<ViewStyle>} size="small" color="#6C5DD3" />
            )}

            <MView style={newLayoutStyles.mainContentContainer as any} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                {/* SOL SÜTUN */}
                <MView style={newLayoutStyles.leftColumn as any} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                    <Text style={newLayoutStyles.sectionTitle as StyleProp<TextStyle>}>Profilim</Text>

                    <MView style={newLayoutStyles.infoCard as any}>
                        <Text style={newLayoutStyles.profileName as StyleProp<TextStyle>}>{profile.name || "İsim Yok"}</Text>
                        {renderDetailRow("birthday-cake", "Yaş", calculateAge(profile.birthdate))}
                        {renderDetailRow("venus-mars", "Cinsiyet", profile.gender)}
                        {renderDetailRow("heart", "Tercih", profile.gender_preference)}
                        {renderDetailRow("bullseye", "İlişki Hedefi", profile.relationship_goal)}
                        {renderDetailRow("star", "Burç", profile.zodiac_sign)}
                        {renderDetailRow("ruler-vertical", "Boy", profile.height ? `${profile.height} cm` : null)}
                    </MView>

                    <MView style={newLayoutStyles.infoCard as any}>
                        <Text style={newLayoutStyles.cardTitle as StyleProp<TextStyle>}>Eğitim & Konum</Text>
                        {renderDetailRow("university", "Üniversite", profile.university)}
                        {renderDetailRow("map-marker-alt", "Konum", profile.university_location)}
                    </MView>

                    {profile.about && (
                        <MView style={newLayoutStyles.infoCard as any} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Text style={newLayoutStyles.cardTitle as StyleProp<TextStyle>}>Hakkında</Text>
                            <Text style={newLayoutStyles.aboutText as StyleProp<TextStyle>}>{profile.about}</Text>
                        </MView>
                    )}

                    <MView style={newLayoutStyles.infoCard as any}>
                        <Text style={newLayoutStyles.cardTitle as StyleProp<TextStyle>}>Yaşam Tarzı & İlgi Alanları</Text>
                        {renderListDetailRow("utensils", "Favori Yiyecekler", profile.favorite_food)}
                        {renderDetailRow("praying-hands", "Din", profile.religion)}
                        {renderDetailRow("landmark", "Politik Görüş", profile.political_view)}
                        {renderDetailRow("glass-cheers", "Alkol", profile.alcohol)}
                        {renderDetailRow("smoking", "Sigara", profile.smoking)}
                        {renderListDetailRow("gem", "Değerler", profile.values)}
                        {renderListDetailRow("thumbs-up", "Beğeniler", profile.likes)}
                    </MView>
                </MView>

                {/* SAĞ SÜTUN */}
                <MView
                    style={newLayoutStyles.rightColumn as any}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}>
                    <MView
                        style={newLayoutStyles.photoSectionCard as any}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}>
                        <Text style={newLayoutStyles.sectionTitle as StyleProp<TextStyle>}>Fotoğraflarım</Text>

                        {selectedPhoto && (
                            <MView style={newLayoutStyles.previewContainer as any}>
                                <Image source={{ uri: selectedPhoto.uri }} style={newLayoutStyles.previewImage as StyleProp<ImageStyle>} />
                                <MView style={newLayoutStyles.previewButtonsContainer as any}>
                                    <TouchableOpacity
                                        onPress={uploadSelectedPhoto}
                                        style={[newLayoutStyles.button, newLayoutStyles.confirmUploadButton] as StyleProp<ViewStyle>}
                                        disabled={loading}>
                                        <Text style={newLayoutStyles.buttonText as StyleProp<TextStyle>}>Yükle</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setSelectedPhoto(null)}
                                        style={[newLayoutStyles.button, newLayoutStyles.cancelUploadButton] as StyleProp<ViewStyle>}
                                        disabled={loading}>
                                        <Text style={newLayoutStyles.buttonText as StyleProp<TextStyle>}>İptal</Text>
                                    </TouchableOpacity>
                                </MView>
                            </MView>
                        )}

                        <MView style={newLayoutStyles.photosGridContainer as any}>
                            {userPhotos.length > 0 &&
                                userPhotos.map((photo, index) => (
                                    <MView key={photo.photo_id || index} style={newLayoutStyles.photoBox as any}>
                                        <Image
                                            source={{ uri: `data:image/${photo.file_name?.split(".").pop() || "jpeg"};base64,${photo.data}` }}
                                            style={newLayoutStyles.photoThumbnail as StyleProp<ImageStyle>}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            onPress={() => deletePhoto(photo.photo_id)}
                                            style={newLayoutStyles.deletePhotoIcon as StyleProp<ViewStyle>}
                                            disabled={loading}>
                                            <Icon name="times-circle" size={24} color="#E74C3C" />
                                        </TouchableOpacity>
                                    </MView>
                                ))}
                            {userPhotos.length < 3 && !selectedPhoto && (
                                <TouchableOpacity
                                    onPress={handlePhotoUpload}
                                    style={[newLayoutStyles.photoBox, newLayoutStyles.addPhotoBox] as StyleProp<ViewStyle>}
                                    disabled={loading}>
                                    <Icon name="plus" size={30} color="#A5B4CB" />
                                    <Text style={newLayoutStyles.addPhotoText as StyleProp<TextStyle>}>Ekle</Text>
                                </TouchableOpacity>
                            )}
                            {userPhotos.length === 0 && !selectedPhoto && (
                                <Text style={newLayoutStyles.infoText as StyleProp<TextStyle>}>Henüz fotoğraf eklemediniz.</Text>
                            )}
                        </MView>
                    </MView>

                    <MView
                        style={newLayoutStyles.spotifySectionCard as any}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}>
                        <Text style={newLayoutStyles.sectionTitle as StyleProp<TextStyle>}>
                            <Icon name="spotify" size={20} color="#1DB954" /> Spotify
                        </Text>

                        {profile.spotify_connected ? (
                            <View>
                                <Text style={newLayoutStyles.subTitle as StyleProp<TextStyle>}>Favori Sanatçılar</Text>
                                {loadingSpotify ? (
                                    <ActivityIndicator size="small" color="#1DB954" style={{ marginVertical: 10 }} />
                                ) : spotifyArtists.length > 0 ? (
                                    <FlatList
                                        horizontal
                                        data={spotifyArtists}
                                        keyExtractor={(item, index) => item.id || index.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={newLayoutStyles.spotifyItemBox as StyleProp<ViewStyle>}
                                                onPress={() => Linking.openURL(item.spotify_url).catch((err) => console.error("Link açılamadı:", err))}>
                                                <Image source={{ uri: item.image }} style={newLayoutStyles.spotifyItemImage as StyleProp<ImageStyle>} />
                                                <Text style={newLayoutStyles.spotifyItemName as StyleProp<TextStyle>} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 5 } as StyleProp<ViewStyle>}
                                    />
                                ) : (
                                    <Text style={newLayoutStyles.infoText as StyleProp<TextStyle>}>Spotify sanatçı verisi bulunamadı.</Text>
                                )}

                                <Text style={[newLayoutStyles.subTitle, { marginTop: 15 }] as StyleProp<TextStyle>}>Favori Şarkılar</Text>
                                {loadingSpotify ? (
                                    <ActivityIndicator size="small" color="#1DB954" style={{ marginVertical: 10 }} />
                                ) : spotifyTracks.length > 0 ? (
                                    <FlatList
                                        horizontal
                                        data={spotifyTracks}
                                        keyExtractor={(item, index) => item.id || index.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={newLayoutStyles.spotifyItemBox as StyleProp<ViewStyle>}
                                                onPress={() => Linking.openURL(item.spotify_url).catch((err) => console.error("Link açılamadı:", err))}>
                                                <Image source={{ uri: item.image }} style={newLayoutStyles.spotifyItemImage as StyleProp<ImageStyle>} />
                                                <Text style={newLayoutStyles.spotifyItemName as StyleProp<TextStyle>} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 5 } as StyleProp<ViewStyle>}
                                    />
                                ) : (
                                    <Text style={newLayoutStyles.infoText as StyleProp<TextStyle>}>Spotify şarkı verisi bulunamadı.</Text>
                                )}
                            </View>
                        ) : (
                            <MView style={newLayoutStyles.spotifyConnectContainer as any}>
                                <Text style={newLayoutStyles.infoText as StyleProp<TextStyle>}>Müzik zevkini paylaşmak için Spotify hesabını bağla!</Text>
                                <TouchableOpacity
                                    onPress={handleSpotifyLogin}
                                    style={[newLayoutStyles.button, newLayoutStyles.spotifyButton] as StyleProp<ViewStyle>}
                                    disabled={loading}>
                                    <Icon name="spotify" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={newLayoutStyles.buttonText as StyleProp<TextStyle>}>Spotify ile Bağlan</Text>
                                </TouchableOpacity>
                            </MView>
                        )}
                    </MView>
                </MView>
            </MView>
        </ScrollView>
    );
};

export default ProfileScreen;
