import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";

interface Restaurant {
    name: string;
    address: string;
    rating: number;
    phone: string;
    latitude: number;
    longitude: number;
}

interface MapComponentProps {
    restaurants: Restaurant[];
    universityLocation: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ restaurants, universityLocation }) => {
    const mapRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        if (mapRef.current) {
            const validRestaurants = restaurants.filter((r) => r.latitude !== undefined && r.longitude !== undefined);

            const defaultLat = 41.0082;
            const defaultLon = 28.9784;

            const initialLat = validRestaurants.length > 0 ? validRestaurants[0].latitude : defaultLat;
            const initialLon = validRestaurants.length > 0 ? validRestaurants[0].longitude : defaultLon;

            const markersScript = validRestaurants
                .map((r) => {
                    const query = `${r.name}, ${universityLocation}`;
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

                    return `
                        var marker = L.marker([${r.latitude}, ${r.longitude}]).addTo(map);
                        marker.bindPopup(
                            "<div style='font-family: Arial, sans-serif; font-size: 14px; max-width: 220px;'> \
                                <strong style='font-size: 16px; color: #6200ea;'>${r.name}</strong><br/> \
                                📍 <em>${r.address}</em><br/> \
                                ⭐ <strong>${r.rating}</strong> / 5.0 <br/> \
                                📞 <a href='tel:${r.phone}'>${r.phone}</a><br/> \
                                <a href='${googleMapsUrl}' target='_blank' \
                                    style='display: inline-block; margin-top: 8px; padding: 6px 10px; background-color: #6200ea; color: white; text-decoration: none; border-radius: 5px;'> \
                                    📍 Google Maps'te Aç</a> \
                            </div>"
                        );
                    `;
                })
                .join("\n");

            console.log("Harita Başlangıç Noktası:", initialLat, initialLon);
            console.log("Harita Markerları:", markersScript);

            const mapScript = `
                var map = L.map('map').setView([${initialLat}, ${initialLon}], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                ${markersScript}
            `;

            mapRef.current.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
                    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
                </head>
                <body>
                    <div id="map" style="width:100vw; height:100vh;"></div>
                    <script>${mapScript}</script>
                </body>
                </html>`;
        }
    }, [restaurants, universityLocation]);

    return (
        <View style={styles.container}>
            <iframe ref={mapRef} width="100%" height="100%" style={{ border: "none" }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, width: "100%", height: "100%" },
});

export default MapComponent;
