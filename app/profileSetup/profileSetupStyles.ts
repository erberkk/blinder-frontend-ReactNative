import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    outerContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
    },
    formContainer: {
        width: 600,
        height: 600,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    stepContainer: {
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 15,
        textAlign: "center",
        color: "#333",
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 5,
        color: "#444",
    },
    customPicker: {
        backgroundColor: "#f9f9f9",
        marginBottom: 15,
        borderRadius: 8,
    },
    input: {
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    navigationContainer: {
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "space-evenly",
    },
    navButton: {
        flex: 1,
    },
    dateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
    },
    datePicker: {
        flex: 1,
        marginHorizontal: 2,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 16,
        color: "#333",
    },
});

export default styles;
