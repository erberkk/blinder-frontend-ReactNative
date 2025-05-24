import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Dimensions, Linking, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapComponent from "@/component/MapComponent";
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
        <View style={styles.background}>
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
                    <View style={styles.categoryDivider} />
                </View>

                <View style={styles.contentWrapper}>
                    <View style={styles.listContainerBox}>
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
                                            <Icon name="call" size={14} color="#805AD5" style={styles.icon} />
                                            <Text style={styles.restaurantPhone}>{item.phone}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <View style={styles.mapContainerBox}>
                        {restaurants.length > 0 && <MapComponent restaurants={restaurants} universityLocation={universityLocation} />}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        backgroundColor: "#F7F7FA",
    },
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F7F7FA",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: "#805AD5",
        fontWeight: "bold",
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#805AD5",
        marginBottom: 20,
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.04)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    categoryWrapper: {
        marginBottom: 10,
        alignItems: "center",
    },
    categoryContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 4,
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: "#F0F0F5",
        borderWidth: 1,
        borderColor: "#E0E0EA",
    },
    activeCategory: {
        backgroundColor: "#805AD5",
        borderColor: "#805AD5",
    },
    categoryText: {
        fontSize: 14,
        color: "#444",
        fontWeight: "600",
    },
    activeCategoryText: {
        color: "#FFF",
        fontWeight: "700",
    },
    categoryDivider: {
        height: 1,
        backgroundColor: "#E0E0EA",
        marginTop: 8,
        width: "100%",
    },
    contentWrapper: {
        flexDirection: "row",
        flex: 1,
        gap: 12,
    },
    listContainerBox: {
        flex: 1,
        marginRight: 6,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    restaurantCard: {
        backgroundColor: "#F7F7FA",
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: "#ECECF2",
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 4,
    },
    restaurantAddress: {
        fontSize: 12,
        color: "#888",
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
        color: "#805AD5",
        fontWeight: "bold",
    },
    restaurantPhone: {
        fontSize: 12,
        color: "#444",
    },
    mapContainerBox: {
        flex: 1,
        marginLeft: 6,
        backgroundColor: "#FFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
});

export default RestaurantsScreen;
