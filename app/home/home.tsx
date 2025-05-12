import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";

const { width: screenWidth } = Dimensions.get("window");

const cards = [
    {
        id: 1,
        title: "Blinder",
        subtitle: "Üniversite öğrencileri için sosyal keşif ve restoran önerileri!",
        showLogo: true,
        buttonText: "Başla",
        buttonRoute: "/login/login",
    },
    {
        id: 2,
        title: "Keşfet",
        subtitle: "Yeni insanlarla tanış ve ilgi alanlarını paylaş.",
        showLogo: false,
        buttonText: "Keşfetmeye Başla",
        buttonRoute: "/matches/MatchScreen",
    },
    {
        id: 3,
        title: "Restoranlar",
        subtitle: "En iyi mekanları keşfet ve arkadaşlarınla plan yap.",
        showLogo: false,
        buttonText: "Restoranları Gör",
        buttonRoute: "/restaurants/restaurants",
    },
];

export default function HomeScreen() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const cardTranslateXAnims = useRef(cards.map(() => new Animated.Value(0))).current;
    const cardOpacityAnims = useRef(cards.map(() => new Animated.Value(0.3))).current;
    const cardScaleAnims = useRef(cards.map(() => new Animated.Value(0.9))).current;

    const cardSize = 500;
    const cardOverlap = 80;
    const totalCardSpace = cardSize - cardOverlap;

    const runningAnimations = useRef<Animated.CompositeAnimation[]>([]).current;

    useEffect(() => {
        runningAnimations.forEach((anim) => anim.stop());
        runningAnimations.length = 0;

        cards.forEach((card, index) => {
            const isCurrent = index === activeIndex;
            const isLeft = index === (activeIndex - 1 + cards.length) % cards.length;
            const isRight = index === (activeIndex + 1) % cards.length;

            let targetTranslateX = 0;
            let targetOpacity = 0.3;
            let targetScale = 0.9;

            if (isCurrent) {
                targetTranslateX = 0;
                targetOpacity = 1;
                targetScale = 1;
            } else if (isLeft) {
                targetTranslateX = -(cardSize - cardOverlap);
                targetOpacity = 0.3;
                targetScale = 0.9;
            } else if (isRight) {
                targetTranslateX = cardSize - cardOverlap;
                targetOpacity = 0.3;
                targetScale = 0.9;
            } else {
                targetTranslateX = (index - activeIndex) * screenWidth;
                targetOpacity = 0;
                targetScale = 0.5;
            }

            const animation = Animated.parallel([
                Animated.timing(cardTranslateXAnims[index], {
                    toValue: targetTranslateX,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacityAnims[index], {
                    toValue: targetOpacity,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(cardScaleAnims[index], {
                    toValue: targetScale,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]);

            animation.start();
            runningAnimations.push(animation);
        });

        return () => {
            runningAnimations.forEach((anim) => anim.stop());
            runningAnimations.length = 0;
        };
    }, [activeIndex, cardTranslateXAnims, cardOpacityAnims, cardScaleAnims, cards.length, cardSize, cardOverlap, screenWidth, runningAnimations]);

    const [fontsLoaded] = useFonts({
        AzeretMono: require("../../assets/fonts/AzeretMono-Regular.ttf"),
    });

    if (!fontsLoaded) {
        return null;
    }

    const handleButtonPress = (route: string) => {
        router.push(route as any);
    };

    const handlePrev = () => {
        setActiveIndex((prevIndex) => (prevIndex === 0 ? cards.length - 1 : prevIndex - 1));
    };

    const handleNext = () => {
        setActiveIndex((prevIndex) => (prevIndex === cards.length - 1 ? 0 : prevIndex + 1));
    };

    const handleDotPress = (index: number) => {
        setActiveIndex(index);
    };

    return (
        <LinearGradient colors={["#B794F4", "#9F7AEA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.background}>
            <View style={styles.container}>
                <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={handlePrev}>
                    <Icon name="chevron-back-outline" size={30} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.cardsContainerWrapper}>
                    <View style={styles.cardsContainer}>
                        {cards.map((card, index) => (
                            <Animated.View
                                key={card.id}
                                style={[
                                    styles.card,
                                    { width: cardSize, height: cardSize },
                                    {
                                        transform: [{ translateX: cardTranslateXAnims[index] }, { scale: cardScaleAnims[index] }],
                                    },
                                    { opacity: cardOpacityAnims[index] },
                                    { zIndex: index === activeIndex ? 1 : 0 },
                                ]}>
                                {card.showLogo && <Image source={require("../../assets/images/blinder.png")} style={styles.image} />}
                                <Text style={styles.title}>{card.title}</Text>
                                <Text style={styles.subtitle}>{card.subtitle}</Text>
                                <TouchableOpacity onPress={() => handleButtonPress(card.buttonRoute)} style={styles.button}>
                                    <Text style={styles.buttonText}>{card.buttonText}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext}>
                    <Icon name="chevron-forward-outline" size={30} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.indicatorContainer}>
                    {cards.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.indicatorDot, index === activeIndex && styles.activeIndicatorDot]}
                            onPress={() => handleDotPress(index)}
                        />
                    ))}
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        position: "relative",
        overflow: "hidden",
    },
    cardsContainerWrapper: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    cardsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "100%",
        height: 300,
    },
    card: {
        backgroundColor: "rgba(107, 70, 193, 0.6)",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
        justifyContent: "center",
        position: "absolute",
    },
    image: {
        width: 60,
        height: 60,
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 8,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 12,
        color: "#E0CCFF",
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    button: {
        backgroundColor: "#805AD5",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        shadowColor: "#805AD5",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    buttonText: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    arrowButton: {
        position: "absolute",
        top: "40%",
        zIndex: 2,
        padding: 10,
    },
    leftArrow: {
        left: 10,
    },
    rightArrow: {
        right: 10,
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFFFFF80",
        marginHorizontal: 5,
    },
    activeIndicatorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FFFFFF",
    },
});
