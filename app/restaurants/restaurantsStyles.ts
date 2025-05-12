import { Dimensions, StyleSheet } from "react-native";
const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#6200ea",
        textAlign: "center",
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6200ea",
    },

    /** Kategori Seçimi */
    categoryWrapper: {
        alignItems: "center",
        marginBottom: 10,
    },
    categoryContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    categoryButton: {
        backgroundColor: "#eee",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginHorizontal: 6,
    },
    activeCategory: {
        backgroundColor: "#6200ea",
    },
    categoryText: {
        fontSize: 14,
        color: "#333",
    },
    activeCategoryText: {
        color: "#fff",
        fontWeight: "bold",
    },

    /** İki Sütunlu Layout */
    contentWrapper: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
    },

    /** Sol Taraf - Restoran Listesi */
    listContainer: {
        flex: 1,
        backgroundColor: "#f1f1f1",
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        maxWidth: width * 0.4,
        height: height * 0.7,
    },
    restaurantCard: {
        backgroundColor: "#fff",
        padding: 14,
        marginVertical: 6,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        alignSelf: "center",
        width: "100%",
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 5,
    },
    restaurantAddress: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
        marginBottom: 5,
    },
    restaurantRating: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6200ea",
        textAlign: "center",
        marginBottom: 5,
    },
    restaurantPhone: {
        fontSize: 14,
        color: "#777",
        textAlign: "center",
    },

    /** Sağ Taraf - Harita */
    mapContainer: {
        flex: 1,
        maxWidth: width * 0.55,
        height: height * 0.7,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#ddd",
    },
});

export default styles;
