import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Navbar() {
    const router = useRouter();
    const currentPath = usePathname();

    const navItems = [
        { label: "Ana Sayfa", route: "/home/home" },
        { label: "Profil", route: "/profile/profile" },
        { label: "Eşleşmeler", route: "/matches/MatchScreen" },
        { label: "Mesajlar", route: "/messages/Messages" },
        { label: "Restoranlar", route: "/restaurants/restaurants" },
        { label: "Giriş", route: "/login/login" },
    ];

    const animatedValues = React.useRef(
        Array(navItems.length)
            .fill(0)
            .map(() => new Animated.Value(1))
    ).current;

    const isActive = (path: string) => currentPath === path;

    const handlePressIn = (index: number) => {
        Animated.spring(animatedValues[index], {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = (index: number) => {
        Animated.spring(animatedValues[index], {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };


    return (
        <LinearGradient
            colors={["#B794F4", "#9F7AEA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.navbar}>
            {/* Logo and App Name Section */}
            <View style={styles.logoContainer}>
                <Image
                    source={require("../assets/images/blinder.png")}
                    style={styles.logo}
                />
                <Text style={styles.appName}>Blinder</Text>
            </View>

            {/* Navigation Items Section */}
            <View style={styles.navItems}>
                {navItems.map(({ label, route }, index) => (
                    <TouchableOpacity
                        key={route}
                        onPress={() => router.push(route as any)}
                        onPressIn={() => handlePressIn(index)}
                        onPressOut={() => handlePressOut(index)}
                        style={styles.navItem}>
                        <Animated.View
                            style={[
                                styles.navItemContent,
                                { transform: [{ scale: animatedValues[index] }] },
                            ]}>
                            <Text
                                style={[
                                    styles.navText,
                                    isActive(route) && styles.activeText,
                                ]}>
                                {label}
                            </Text>
                            {isActive(route) && <View style={styles.activeUnderline} />}
                        </Animated.View>
                    </TouchableOpacity>
                ))}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 70,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        width: 45,
        height: 45,
        marginRight: 10,
    },
    appName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        letterSpacing: 0.8,
        textShadowColor: "rgba(0, 0, 0, 0.15)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1.5,
    },
    navItems: {
        flexDirection: "row",
        gap: 25,
    },
    navItem: {
    },
    navItemContent: {
        alignItems: "center",
        paddingVertical: 5,
    },
    navText: {
        fontSize: 15,
        color: "#E0CCFF",
        fontWeight: "600",
        marginBottom: 4,
    },
    activeText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    activeUnderline: {
        height: 2,
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 1,
    },
});
