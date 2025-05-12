# Blinder Frontend

[English](#english) | [Türkçe](#turkish)

<a name="english"></a>
# Blinder Frontend (English)

A modern mobile application built with Expo and React Native, featuring a beautiful UI and smooth user experience.

## 🎯 Project Purpose

Blinder is a specialized social networking application exclusively for university students. The app aims to:

- Connect university students through their academic email addresses
- Facilitate social interactions and friendships among students
- Provide a safe and verified environment for student networking
- Offer restaurant recommendations for student meetups

## 🚀 Features

- Modern UI/UX design
- Cross-platform support (iOS & Android)
- TypeScript support
- File-based routing with Expo Router
- Gesture handling and animations
- Date and time picker integration
- Image picking capabilities
- Authentication session management
- Local storage support
- Vector icons and custom animations
- Modal and bottom sheet components
- WebView support

## 🛠️ Tech Stack

- Expo SDK 52
- React Native 0.76.7
- TypeScript
- React Navigation
- Expo Router
- React Native Paper
- Various Expo modules (Blur, Linear Gradient, etc.)
- Framer Motion
- Lottie for animations
- React Native Reanimated
- React Native Gesture Handler

## 📋 Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac users) or Android Studio (for Android development)

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd blinder-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Choose your preferred development environment:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device testing

## 📱 Development

The project uses file-based routing with Expo Router. Main application code is located in the `app` directory.

### Project Structure

```
├── app/             # Main application code with file-based routing
├── assets/          # Static assets (images, fonts, etc.)
├── component/       # Reusable React components
├── hooks/           # Custom React hooks
└── types.ts         # TypeScript type definitions
```

## 🧪 Testing

Run tests using:
```bash
npm test
```

## 📦 Build

To create a production build:
```bash
expo build:android  # For Android
expo build:ios      # For iOS
```

---

<a name="turkish"></a>
# Blinder Frontend (Türkçe)

Expo ve React Native ile geliştirilmiş, modern bir kullanıcı arayüzü ve akıcı kullanıcı deneyimi sunan mobil uygulama.

## 🎯 Proje Amacı

Blinder, sadece üniversite öğrencilerine özel bir sosyal ağ uygulamasıdır. Uygulama şu amaçları hedeflemektedir:

- Üniversite öğrencilerini akademik e-posta adresleri üzerinden birbirine bağlamak
- Öğrenciler arasında sosyal etkileşimi ve arkadaşlıkları kolaylaştırmak
- Öğrenciler için güvenli ve doğrulanmış bir sosyalleşme ortamı sağlamak
- Öğrenci buluşmaları için restoran önerileri sunmak

## 🚀 Özellikler

- Modern UI/UX tasarımı
- Çapraz platform desteği (iOS & Android)
- TypeScript desteği
- Expo Router ile dosya tabanlı yönlendirme
- Hareket ve animasyon desteği
- Tarih ve saat seçici entegrasyonu
- Resim seçme özellikleri
- Kimlik doğrulama oturum yönetimi
- Yerel depolama desteği
- Vektör ikonları ve özel animasyonlar
- Modal ve alt sayfa bileşenleri
- WebView desteği

## 🛠️ Teknoloji Yığını

- Expo SDK 52
- React Native 0.76.7
- TypeScript
- React Navigation
- Expo Router
- React Native Paper
- Çeşitli Expo modülleri (Blur, Linear Gradient, vb.)
- Framer Motion
- Lottie animasyonları
- React Native Reanimated
- React Native Gesture Handler

## 📋 Gereksinimler

- Node.js (LTS sürümü önerilir)
- npm veya yarn
- Expo CLI
- iOS Simulator (Mac kullanıcıları için) veya Android Studio (Android geliştirmesi için)

## 🚀 Başlangıç

1. Depoyu klonlayın:
   ```bash
   git clone [repository-url]
   cd blinder-frontend
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm start
   ```

4. Tercih ettiğiniz geliştirme ortamını seçin:
   - iOS simülatörü için `i` tuşuna basın
   - Android emülatörü için `a` tuşuna basın
   - Fiziksel cihaz testi için Expo Go uygulaması ile QR kodu tarayın

## 📱 Geliştirme

Proje, Expo Router ile dosya tabanlı yönlendirme kullanmaktadır. Ana uygulama kodu `app` dizininde bulunmaktadır.

### Proje Yapısı

```
├── app/             # Dosya tabanlı yönlendirme ile ana uygulama kodu
├── assets/          # Statik dosyalar (resimler, yazı tipleri, vb.)
├── component/       # Yeniden kullanılabilir React bileşenleri
├── hooks/           # Özel React hook'ları
└── types.ts         # TypeScript tip tanımlamaları
```

## 🧪 Test

Testleri çalıştırmak için:
```bash
npm test
```

## 📦 Derleme

Üretim sürümü oluşturmak için:
```bash
expo build:android  # Android için
expo build:ios      # iOS için
```
