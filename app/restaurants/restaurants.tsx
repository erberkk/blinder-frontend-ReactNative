import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Dimensions, Linking, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapComponent from "@/component/MapComponent";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const { width } = Dimensions.get("window");

type Restaurant = {
    name: string;
    address: string;
    rating: number;
    phone: string;
    latitude: number;
    longitude: number;
};

const RestaurantsScreen: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [categories, setCategories] = useState<{ name: string; restaurants: Restaurant[] }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [universityLocation, setUniversityLocation] = useState<string>("");

    const handleNavigateToMaps = (name: string) => {
        const query = `${name}, ${universityLocation}`;
        const url = `http://maps.google.com/?q=$${encodeURIComponent(query)}`;
        Linking.openURL(url);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            setRestaurants([]);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                alert("Lütfen giriş yapın.");
                setLoading(false);
                return;
            }

            const response = await fetch("http://127.0.0.1:5000/restaurant/restaurants", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.error || "Restoran verileri alınamadı.");
            }

            setUniversityLocation(json.location || "Bilinmeyen Şehir");

            setCategories(json.data.categories);
            if (json.data.categories.length > 0) {
                const firstCategory = json.data.categories[0].name;
                setSelectedCategory(firstCategory);
                handleCategorySelect(firstCategory, json.data.categories);
            } else {
                setRestaurants([]);
                setSelectedCategory(null);
            }
        } catch (error) {
            console.error(error);
            alert("Veriler alınırken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (categoryName: string, existingCategories = categories) => {
        setSelectedCategory(categoryName);
        const selectedCategoryObj = existingCategories.find((cat) => cat.name === categoryName);

        if (selectedCategoryObj && selectedCategoryObj.restaurants) {
            const formattedRestaurants: Restaurant[] = selectedCategoryObj.restaurants.map((r: any) => ({
                name: r.name,
                address: r.address,
                rating: r.rating,
                phone: r.phone,
                latitude: r.lat,
                longitude: r.lon,
            }));

            setRestaurants(formattedRestaurants);
        } else {
            setRestaurants([]);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#805AD5" />
                <Text style={styles.loadingText}>Restoranlar Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={["#9F7AEA", "#B794F4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.background}>
            <View style={styles.container}>
                <Text style={styles.header}>Restoranları Keşfet</Text>

                <View style={styles.categoryWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.name}
                                style={[styles.categoryButton, selectedCategory === category.name && styles.activeCategory]}
                                onPress={() => handleCategorySelect(category.name)}>
                                <Text style={[styles.categoryText, selectedCategory === category.name && styles.activeCategoryText]}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.contentWrapper}>
                    <View style={styles.listContainer}>
                        <FlatList
                            data={restaurants}
                            keyExtractor={(item) => item.name}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleNavigateToMaps(item.name)}>
                                    <View style={styles.restaurantCard}>
                                        <Text style={styles.restaurantName}>{item.name}</Text>
                                        <Text style={styles.restaurantAddress}>{item.address}</Text>
                                        <View style={styles.infoRow}>
                                            <FontAwesome name="star" size={14} color="#FFD700" style={styles.icon} />
                                            <Text style={styles.restaurantRating}>{item.rating}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Icon name="call" size={14} color="#FFFFFF" style={styles.icon} />
                                            <Text style={styles.restaurantPhone}>{item.phone}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <View style={styles.mapContainer}>
                        {restaurants.length > 0 && <MapComponent restaurants={restaurants} universityLocation={universityLocation} />}
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
    },
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#B794F4",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 20,
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    categoryWrapper: {
        marginBottom: 20,
        alignItems: "center",
    },
    categoryContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
    },
    activeCategory: {
        backgroundColor: "#805AD5",
        borderColor: "#FFFFFF",
    },
    categoryText: {
        fontSize: 14,
        color: "#FFFFFF",
        fontWeight: "600",
    },
    activeCategoryText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    contentWrapper: {
        flexDirection: "row",
        flex: 1,
    },
    listContainer: {
        flex: 1,
        marginRight: 8,
    },
    restaurantCard: {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    restaurantAddress: {
        fontSize: 12,
        color: "#E0CCFF",
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2,
    },
    icon: {
        marginRight: 5,
    },
    restaurantRating: {
        fontSize: 14,
        color: "#FFD700",
    },
    restaurantPhone: {
        fontSize: 12,
        color: "#FFFFFF",
    },
    mapContainer: {
        flex: 1,
        marginLeft: 8,
        borderRadius: 12,
        overflow: "hidden",
    },
});

export default RestaurantsScreen;
