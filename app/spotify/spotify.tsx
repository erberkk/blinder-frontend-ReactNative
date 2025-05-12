import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./spotifyStyles";

interface Artist {
    name: string;
}

interface Track {
    name: string;
    artists: Artist[];
}

const SpotifyScreen: React.FC = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchTopTracks = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Hata", "Lütfen giriş yapın.");
                return;
            }

            const response = await fetch("http://127.0.0.1:5000/spotify/top-tracks", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Spotify verisi alınamadı!");

            const json = await response.json();

            if (!json.items || !Array.isArray(json.items)) {
                throw new Error("Geçersiz veri formatı");
            }

            setTracks(json.items);
        } catch (error) {
            console.error("Hata:", error);
            Alert.alert("Hata", error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopTracks();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Button mode="contained" onPress={fetchTopTracks} style={styles.refreshButton}>
                🔄 Yenile
            </Button>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1DB954" />
                    <Text style={styles.loadingText}>Spotify Verileri Yükleniyor...</Text>
                </View>
            ) : tracks.length > 0 ? (
                tracks.map((track, index) => (
                    <View key={index} style={styles.trackContainer}>
                        <Text style={styles.trackName}>{track.name}</Text>
                        <Text style={styles.trackArtists}>🎤 {track.artists.map((a) => a.name).join(", ")}</Text>
                    </View>
                ))
            ) : (
                <View style={styles.noTracksContainer}>
                    <Text style={styles.noTracksText}>🎵 En çok dinlediğiniz şarkılar bulunamadı!</Text>
                </View>
            )}
        </ScrollView>
    );
};

export default SpotifyScreen;
