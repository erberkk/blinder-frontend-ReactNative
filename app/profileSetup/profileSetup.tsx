import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Alert,
    ActivityIndicator,
    Linking,
    Image,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StyleProp,
    ViewStyle,
    TextStyle,
    ImageStyle,
    StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { Button, TextInput as PaperInput, Checkbox, Provider } from "react-native-paper";
import { format } from "date-fns";
import * as Animatable from "react-native-animatable";
import { showToast } from "../toastProvider/toastProvider";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome5";

type ProfileProps = {
    navigation: StackNavigationProp<any>;
};

interface UniversityGroup {
    location: string;
    universities: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ProfileSetupScreen: React.FC<ProfileProps> = ({ navigation }) => {
    const router = useRouter();

    const profileOptions = {
        universities: [],
        relationshipGoals: ["Uzun dönem ilişki", "Hayat arkadaşı", "Eğlenceli, sıradan buluşmalar", "Evlilik", "Arkadaşlık"],
        habits: {
            alcohol: ["İçerim", "Bazen içerim", "İçmem", "Alkoliğim"],
            smoking: ["İçerim", "Bazen içerim", "İçmem"],
        },
        religions: ["Ateist", "Müslüman", "Agnostik"],
        politicalViews: ["Apolitik", "Orta", "Liberal", "Muhafazakâr"],
        likes: ["Yemek", "Film", "Müzik", "Müze", "Kedi", "Resim", "Kahve", "Spor", "Kitap"],
        values: ["Tutku", "Özgüven", "Empati", "Kibar", "Zeka", "Komik"],
        favoriteFoods: ["Hamburger", "Pizza", "Makarna", "Döner", "Lahmacun"],
    };

    const [step, setStep] = useState<number>(1);

    const [universitiesData, setUniversitiesData] = useState<UniversityGroup[]>([]);
    const [university, setUniversity] = useState<string>("");
    const [universityLocation, setUniversityLocation] = useState<string>("");

    const [birthDay, setBirthDay] = useState<string>("");
    const [birthMonth, setBirthMonth] = useState<string>("");
    const [birthYear, setBirthYear] = useState<string>("");

    const [gender, setGender] = useState<string>("");

    const [genderPreference, setGenderPreference] = useState<string>("");

    const [heightValue, setHeightValue] = useState<string>("");

    const [relationshipGoal, setRelationshipGoal] = useState<string>("");

    const [likes, setLikes] = useState<string[]>([]);

    const [values, setValues] = useState<string[]>([]);

    const [alcohol, setAlcohol] = useState<string>("");
    const [smoking, setSmoking] = useState<string>("");

    const [religion, setReligion] = useState<string>("");
    const [politicalView, setPoliticalView] = useState<string>("");

    const [favoriteFood, setFavoriteFood] = useState<string[]>([]);

    const [about, setAbout] = useState<string>("");

    const [name, setName] = useState<string>("");

    const toggleSelection = (option: string, selected: string[], setSelected: (arr: string[]) => void) => {
        if (selected.includes(option)) {
            setSelected(selected.filter((item) => item !== option));
        } else {
            setSelected([...selected, option]);
        }
    };

    const handleUniversitySelect = (selectedUni: string) => {
        setUniversity(selectedUni);
        const uniGroup = universitiesData.find((group) => group.universities.includes(selectedUni));
        if (uniGroup) {
            setUniversityLocation(uniGroup.location);
        }
    };

    useEffect(() => {
        fetch("http://127.0.0.1:5000/auth/universities")
            .then((response) => response.json())
            .then((data) => {
                setUniversitiesData(data);
            })
            .catch((error) => console.error("Üniversite verileri alınırken hata:", error));
    }, []);

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const minYear = 1920;
    const maxYear = currentYear - 18;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).reverse();

    const isOver18 = (day: string, month: string, year: string) => {
        if (!day || !month || !year) return false;
        const selectedDate = new Date(Number(year), Number(month) - 1, Number(day));
        const now = new Date();
        let age = now.getFullYear() - selectedDate.getFullYear();
        const m = now.getMonth() - selectedDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < selectedDate.getDate())) {
            age--;
        }
        return age >= 18;
    };

    const handleNextStep = () => {
        switch (step) {
            case 1:
                if (!name || !university) {
                    showToast.warning("Lütfen adınızı ve üniversitenizi girin.");
                    return;
                }
                break;
            case 2:
                if (!birthDay || !birthMonth || !birthYear || !isOver18(birthDay, birthMonth, birthYear)) {
                    showToast.warning("Lütfen geçerli bir doğum tarihi giriniz (18+).");
                    return;
                }
                break;
            case 3:
                if (!gender) {
                    showToast.warning("Lütfen cinsiyetinizi seçin.");
                    return;
                }
                break;
            case 4:
                if (!genderPreference) {
                    showToast.warning("Lütfen cinsiyet tercihlerinizi seçin.");
                    return;
                }
                break;
            case 5:
                if (!heightValue || isNaN(Number(heightValue)) || Number(heightValue) <= 0) {
                    showToast.warning("Lütfen geçerli bir boy değeri girin.");
                    return;
                }
                break;
            case 6:
                if (!relationshipGoal) {
                    showToast.warning("Lütfen aradığınız ilişki türünü seçin.");
                    return;
                }
                break;
            case 7:
                if (likes.length === 0) {
                    showToast.warning("Lütfen en az bir sevdiklerinizi seçin.");
                    return;
                }
                break;
            case 8:
                if (values.length === 0) {
                    showToast.warning("Lütfen en az bir değer verdiğiniz özelliği seçin.");
                    return;
                }
                break;
            case 9:
                if (!alcohol || !smoking) {
                    showToast.warning("Lütfen alışkanlıklarınızı seçin.");
                    return;
                }
                break;
            case 10:
                if (!religion || !politicalView) {
                    showToast.warning("Lütfen dini ve politik görüşlerinizi seçin.");
                    return;
                }
                break;
            case 11:
                if (favoriteFood.length === 0) {
                    showToast.warning("Lütfen en sevdiğiniz yiyecekleri seçin.");
                    return;
                }
                break;
            case 12:
                if (!about || about.trim().length < 10) {
                    showToast.warning("Lütfen hakkınızda en az 10 karakterlik bir bilgi girin.");
                    return;
                }
                break;
            default:
                break;
        }
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        try {
            if (!birthDay || !birthMonth || !birthYear || !isOver18(birthDay, birthMonth, birthYear)) {
                Alert.alert("Hata", "Lütfen geçerli bir doğum tarihi seçin (18+).");
                return;
            }
            const constructedDate = new Date(Number(birthYear), Number(birthMonth) - 1, Number(birthDay));

            if (
                !university ||
                !universityLocation ||
                !gender ||
                !genderPreference ||
                !heightValue ||
                isNaN(Number(heightValue)) ||
                Number(heightValue) <= 0 ||
                !relationshipGoal ||
                likes.length === 0 ||
                values.length === 0 ||
                !alcohol ||
                !smoking ||
                !religion ||
                !politicalView ||
                favoriteFood.length === 0 ||
                !about ||
                about.trim().length < 10
            ) {
                Alert.alert("Hata", "Lütfen tüm alanları eksiksiz ve doğru doldurunuz!");
                return;
            }

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Hata", "Kullanıcı giriş yapmamış!");
                return;
            }

            const data = {
                name,
                birthdate: format(constructedDate, "yyyy-MM-dd"),
                university,
                university_location: universityLocation,
                gender,
                gender_preference: genderPreference,
                height: heightValue,
                relationship_goal: relationshipGoal,
                likes,
                values,
                alcohol,
                smoking,
                religion,
                political_view: politicalView,
                favorite_food: favoriteFood,
                about,
            };

            const response = await fetch("http://127.0.0.1:5000/auth/update-profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const responseText = await response.text();
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(responseText);
            } catch (err) {
                throw new Error("Backend geçersiz bir yanıt döndürdü!");
            }

            if (!response.ok) {
                throw new Error(jsonResponse.error || "Güncelleme başarısız!");
            }

            showToast.success("Profiliniz başarıyla güncellendi!");

            setTimeout(() => {
                router.replace("/profile/profile");
            }, 2000);
        } catch (error) {
            console.error("Hata:", error);
            Alert.alert("Hata", error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu!");
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>1/12 - Ad Soyad ve Üniversite Seçimi</Text>
                        <Text style={styles.label}>Adınız ve Soyadınız:</Text>
                        <PaperInput
                            label="Ad Soyad"
                            value={name}
                            onChangeText={setName}
                            style={[styles.input, { color: '#111' }]}
                            mode="outlined"
                            outlineColor="#B794F4"
                            activeOutlineColor="#805AD5"
                            theme={{ colors: { primary: "#805AD5", text: "#111", placeholder: "#888" } }}
                            placeholderTextColor="#888"
                        />
                        <Text style={styles.label}>Üniversitenizi Seçin:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={university} onValueChange={handleUniversitySelect} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Üniversite Seçin" value="" style={styles.pickerItem} />
                                {universitiesData.map((group, groupIndex) => (
                                    <React.Fragment key={groupIndex}>
                                        <Picker.Item
                                            label={`--- ${group.location} ---`}
                                            value={`group-${group.location}`}
                                            enabled={false}
                                            color="#888"
                                            style={styles.pickerItem}
                                        />
                                        {group.universities.map((uni, uniIndex) => (
                                            <Picker.Item key={uniIndex} label={uni} value={uni} style={styles.pickerItem} />
                                        ))}
                                    </React.Fragment>
                                ))}
                            </Picker>
                        </View>
                        {universityLocation ? <Text style={[styles.label, { marginTop: 10 }]}>Lokasyon: {universityLocation}</Text> : null}
                    </Animatable.View>
                );
            case 2:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>2/12 - Doğum Tarihi Seçimi</Text>
                        <Text style={styles.label}>Gün, ay ve yıl bilgilerini seçiniz (18+):</Text>
                        <View style={styles.dateRowCustom}>
                            <View style={styles.pickerBox}>
                                <Picker
                                    style={styles.pickerCustom}
                                    selectedValue={birthDay}
                                    onValueChange={setBirthDay}
                                    itemStyle={styles.pickerItem}
                                >
                                    <Picker.Item label="Gün" value="" style={styles.pickerItem} />
                                    {days.map((d) => (
                                        <Picker.Item key={d} label={String(d)} value={String(d)} style={styles.pickerItem} />
                                    ))}
                                </Picker>
                            </View>
                            <View style={styles.pickerBox}>
                                <Picker
                                    style={styles.pickerCustom}
                                    selectedValue={birthMonth}
                                    onValueChange={setBirthMonth}
                                    itemStyle={styles.pickerItem}
                                >
                                    <Picker.Item label="Ay" value="" style={styles.pickerItem} />
                                    {months.map((m) => (
                                        <Picker.Item key={m} label={String(m)} value={String(m)} style={styles.pickerItem} />
                                    ))}
                                </Picker>
                            </View>
                            <View style={styles.pickerBox}>
                                <Picker
                                    style={styles.pickerCustom}
                                    selectedValue={birthYear}
                                    onValueChange={setBirthYear}
                                    itemStyle={styles.pickerItem}
                                >
                                    <Picker.Item label="Yıl" value="" style={styles.pickerItem} />
                                    {years.map((y) => (
                                        <Picker.Item key={y} label={String(y)} value={String(y)} style={styles.pickerItem} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </Animatable.View>
                );
            case 3:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>3/12 - Cinsiyet Seçimi</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={gender} onValueChange={setGender} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                <Picker.Item label="Erkek" value="Erkek" style={styles.pickerItem} />
                                <Picker.Item label="Kadın" value="Kadın" style={styles.pickerItem} />
                            </Picker>
                        </View>
                    </Animatable.View>
                );
            case 4:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>4/12 - Cinsiyet Tercihi</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={genderPreference} onValueChange={setGenderPreference} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                <Picker.Item label="Erkek" value="Erkek" style={styles.pickerItem} />
                                <Picker.Item label="Kadın" value="Kadın" style={styles.pickerItem} />
                                <Picker.Item label="İkisi de" value="İkisi de" style={styles.pickerItem} />
                            </Picker>
                        </View>
                    </Animatable.View>
                );
            case 5:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>5/12 - Boy (cm)</Text>
                        <PaperInput
                            label="Boy (cm)"
                            value={heightValue}
                            onChangeText={text => setHeightValue(text.replace(/[^0-9]/g, ""))}
                            style={[styles.input, { color: '#111' }]}
                            keyboardType="numeric"
                            mode="outlined"
                            outlineColor="#B794F4"
                            activeOutlineColor="#805AD5"
                            theme={{ colors: { primary: "#805AD5", text: "#111", placeholder: "#888" } }}
                            placeholderTextColor="#888"
                        />
                    </Animatable.View>
                );
            case 6:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>6/12 - Ne Aradığınız?</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={relationshipGoal} onValueChange={setRelationshipGoal} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                {profileOptions.relationshipGoals.map((goal, index) => (
                                    <Picker.Item key={index} label={goal} value={goal} style={styles.pickerItem} />
                                ))}
                            </Picker>
                        </View>
                    </Animatable.View>
                );

            case 7:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>7/12 - Sevdikleriniz</Text>
                        <ScrollView style={styles.checkboxScroll} contentContainerStyle={styles.checkboxScrollContent}>
                            {profileOptions.likes.map((option, index) => (
                                <TouchableOpacity key={index} style={styles.checkboxContainer} onPress={() => toggleSelection(option, likes, setLikes)}>
                                    <Checkbox
                                        status={likes.includes(option) ? "checked" : "unchecked"}
                                        onPress={() => toggleSelection(option, likes, setLikes)}
                                        color="#805AD5"
                                    />
                                    <Text style={styles.checkboxLabel}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animatable.View>
                );

            case 8:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>8/12 - Değer Verdiğiniz Özellikler</Text>
                        <ScrollView style={styles.checkboxScroll} contentContainerStyle={styles.checkboxScrollContent}>
                            {profileOptions.values.map((option, index) => (
                                <TouchableOpacity key={index} style={styles.checkboxContainer} onPress={() => toggleSelection(option, values, setValues)}>
                                    <Checkbox
                                        status={values.includes(option) ? "checked" : "unchecked"}
                                        onPress={() => toggleSelection(option, values, setValues)}
                                        color="#805AD5"
                                    />
                                    <Text style={styles.checkboxLabel}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animatable.View>
                );

            case 9:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>9/12 - Alışkanlıklarınız</Text>
                        <Text style={styles.label}>Alkol</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={alcohol} onValueChange={setAlcohol} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                {profileOptions.habits.alcohol.map((option, index) => (
                                    <Picker.Item key={index} label={option} value={option} style={styles.pickerItem} />
                                ))}
                            </Picker>
                        </View>
                        <Text style={styles.label}>Sigara</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={smoking} onValueChange={setSmoking} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                {profileOptions.habits.smoking.map((option, index) => (
                                    <Picker.Item key={index} label={option} value={option} style={styles.pickerItem} />
                                ))}
                            </Picker>
                        </View>
                    </Animatable.View>
                );

            case 10:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>10/12 - Dini ve Politik Görüşler</Text>
                        <Text style={styles.label}>Din</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={religion} onValueChange={setReligion} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                {profileOptions.religions.map((rel, index) => (
                                    <Picker.Item key={index} label={rel} value={rel} style={styles.pickerItem} />
                                ))}
                            </Picker>
                        </View>
                        <Text style={styles.label}>Politik Görüş</Text>
                        <View style={styles.pickerContainer}>
                            <Picker style={styles.picker} selectedValue={politicalView} onValueChange={setPoliticalView} itemStyle={styles.pickerItem}>
                                <Picker.Item label="Seçiniz" value="" style={styles.pickerItem} />
                                {profileOptions.politicalViews.map((view, index) => (
                                    <Picker.Item key={index} label={view} value={view} style={styles.pickerItem} />
                                ))}
                            </Picker>
                        </View>
                    </Animatable.View>
                );

            case 11:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>11/12 - En Sevdiğiniz Yiyecekler</Text>
                        <ScrollView style={styles.checkboxScroll} contentContainerStyle={styles.checkboxScrollContent}>
                            {profileOptions.favoriteFoods.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.checkboxContainer}
                                    onPress={() => toggleSelection(option, favoriteFood, setFavoriteFood)}>
                                    <Checkbox
                                        status={favoriteFood.includes(option) ? "checked" : "unchecked"}
                                        onPress={() => toggleSelection(option, favoriteFood, setFavoriteFood)}
                                        color="#805AD5"
                                    />
                                    <Text style={styles.checkboxLabel}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animatable.View>
                );
            case 12:
                return (
                    <Animatable.View animation="fadeIn" duration={400} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>12/12 - Hakkında</Text>
                        <PaperInput
                            label={`Hakkında (maks. 128 karakter) - ${about.length}/128`}
                            value={about}
                            onChangeText={(text) => {
                                if (text.length <= 128) setAbout(text);
                            }}
                            style={[styles.input, { color: '#111' }]}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            outlineColor="#B794F4"
                            activeOutlineColor="#805AD5"
                            theme={{ colors: { primary: "#805AD5", text: "#111", placeholder: "#888" } }}
                            placeholderTextColor="#888"
                        />
                    </Animatable.View>
                );
            default:
                return null;
        }
    };

    const renderNavigationButtons = () => (
        <View style={styles.navigationContainer}>
            {step > 1 && (
                <Button mode="contained" onPress={() => setStep(step - 1)} style={[styles.navButton, styles.secondaryButton]} labelStyle={styles.buttonText}>
                    ← Önceki
                </Button>
            )}
            {step < 12 ? (
                <Button mode="contained" onPress={handleNextStep} style={[styles.navButton, styles.primaryButton]} labelStyle={styles.buttonText}>
                    Sonraki →
                </Button>
            ) : (
                <Button mode="contained" onPress={handleSubmit} style={[styles.navButton, styles.primaryButton]} labelStyle={styles.buttonText}>
                    Gönder
                </Button>
            )}
        </View>
    );

    return (
        <Provider>
            <LinearGradient colors={["#B794F4", "#9F7AEA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.backgroundGradient}>
                <View style={styles.container}>
                    <Animatable.View key={step} animation="fadeInUp" duration={600} style={styles.formContainer}>
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {renderStepContent()}
                        </ScrollView>
                        {renderNavigationButtons()}
                    </Animatable.View>
                </View>
            </LinearGradient>
        </Provider>
    );
};

const styles = StyleSheet.create({
    backgroundGradient: {
        flex: 1,
        width: "100%",
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    formContainer: {
        width: "100%",
        maxWidth: 500,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 20,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        maxHeight: "80%",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    stepContainer: {
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
        color: "#111",
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#111",
    },
    pickerContainer: {},
    picker: {
        height: 50,
        width: "100%",
        color: "#2D3748",
        backgroundColor: "#EDF2F7",
    },
    pickerItem: {
        fontSize: 16,
        color: "#111",
        backgroundColor: "#EDF2F7",
    },
    input: {
        marginBottom: 15,
        backgroundColor: "#EDF2F7",
        borderRadius: 8,
        fontSize: 16,
        paddingHorizontal: 12,
        color: "#111",
    },
    navigationContainer: {
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "space-between",
        paddingHorizontal: 10,
    },
    navButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        marginHorizontal: 5,
    },
    primaryButton: {
        backgroundColor: "#805AD5",
        shadowColor: "#805AD5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    secondaryButton: {
        backgroundColor: "#CBD5E0",
        shadowColor: "#4A5568",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    dateRowCustom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    pickerBox: {
        flex: 1,
        backgroundColor: "#F3F0FF",
        overflow: "hidden",
        marginHorizontal: 2,
    },
    pickerCustom: {
        width: "100%",
        height: 44,
        color: "#111",
        backgroundColor: "transparent",
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        backgroundColor: "#F7FAFC",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 16,
        color: "#2D3748",
    },
    checkboxScroll: {
        maxHeight: 200,
    },
    checkboxScrollContent: {
        paddingRight: 5,
    },
});

export default ProfileSetupScreen;
