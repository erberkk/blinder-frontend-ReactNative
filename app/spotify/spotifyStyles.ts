import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#F5F5F5",
        flex: 1,
    },
    refreshButton: {
        marginBottom: 20,
        backgroundColor: "#1DB954",
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    trackContainer: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: "#FFF",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    trackName: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#000",
    },
    trackArtists: {
        color: "gray",
        fontSize: 14,
    },
    noTracksContainer: {
        alignItems: "center",
        marginTop: 20,
    },
    noTracksText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#777",
    },
});

export default styles;
