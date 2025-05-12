import { StyleSheet } from "react-native";

const loginStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    card: {
        width: 360,
        padding: 30,
        borderRadius: 20,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        alignItems: "center",
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#6A0DAD",
        textAlign: "center",
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#444",
        textAlign: "center",
    },
    spacer: {
        height: 20,
    },
    buttonContainer: {
        width: "100%",
    },
    googleButton: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#8A2BE2",
        paddingVertical: 12,
    },
    microsoftButton: {
        width: "100%",
        borderRadius: 12,
        backgroundColor: "#0078D4",
        paddingVertical: 12,
    },
});

export default loginStyles;
