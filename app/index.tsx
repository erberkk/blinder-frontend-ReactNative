import { Text, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const redirect = async () => {
            if (user) {
                router.replace("/home/home");
            } else {
                router.replace("/login/login");
            }
        };

        setTimeout(() => {
            redirect();
        }, 500);
    }, [user]);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Yükleniyor...</Text>
        </View>
    );
}
