import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1a1a2e",
    },
    animatedView: {
        alignItems: "center",
    },
    image: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontFamily: "AzeretMono",
        color: "#E94560",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 18,
        fontFamily: "AzeretMono",
        color: "#fff",
        textAlign: "center",
        marginHorizontal: 30,
        marginTop: 10,
    },
    button: {
        marginTop: 30,
        backgroundColor: "#0F3460",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    buttonText: {
        fontSize: 18,
        fontFamily: "AzeretMono",
        color: "#fff",
    },
});

export default styles;
