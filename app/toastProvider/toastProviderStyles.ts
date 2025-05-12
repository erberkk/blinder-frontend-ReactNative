import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    toastContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    text: {
        fontSize: 16,
        fontWeight: "500",
        color: "#000",
        marginLeft: 8,
        fontFamily: "AzeretMono-Regular",
    },
    icon: {
        fontSize: 20,
        fontWeight: "bold",
    },
});

export default styles;
