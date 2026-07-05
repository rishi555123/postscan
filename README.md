# 📮 PostScan – AI Powered Smart Postal Management System

> Transforming India's postal workflow using AI-powered OCR, automated beat assignment, route optimization, and real-time delivery tracking.

![Flutter](https://img.shields.io/badge/Flutter-3.x-blue?logo=flutter)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

# 🚀 Overview

PostScan is an intelligent postal management platform designed for India Post.

Instead of manually reading addresses, assigning beats, and planning delivery routes, PostScan automates the complete workflow using AI.

The system enables postal staff to:

- 📸 Scan postal covers
- 🤖 Extract addresses using AI OCR
- 📍 Convert addresses into GPS coordinates
- 🧭 Automatically assign delivery beats
- 🗺️ Optimize delivery routes
- 🌧️ Fetch weather alerts
- 📦 Track every letter until delivery

---

# ✨ Features

## 🧠 AI OCR

- Gemini Vision OCR
- Automatic recipient extraction
- Address parsing
- Confidence scoring
- Manual correction interface

---

## 📮 Beat Assignment

Automatically assigns letters to the nearest delivery beat based on location.

- Beat Mapping
- Beat Color Coding
- Postman Allocation

---

## 🗺️ Route Optimization

Uses shortest-path algorithms to reduce travel distance.

Features:

- Google Maps Integration
- Optimized Delivery Order
- Distance Calculation
- Route Visualization

---

## 📦 Batch Processing

Upload multiple postal covers simultaneously.

- Multiple Image Upload
- Queue Processing
- OCR Pipeline
- Batch Status Monitoring

---

## 🌦️ Weather Integration

Real-time weather information for delivery planning.

- Rain Alerts
- Temperature
- Weather Warnings
- Cached Weather Support

---

## 📍 Delivery Tracking

Track every letter through its lifecycle.

```
Scanned
    ↓
OCR Verified
    ↓
Beat Assigned
    ↓
Out For Delivery
    ↓
Delivered
```

---

## 👨‍💼 Multi Role System

### Office Staff

- Batch Scan
- OCR Review
- Beat Assignment
- Analytics Dashboard

### Postman

- Assigned Letters
- Route Navigation
- Delivery Updates
- Status Tracking

### Admin

- User Management
- Analytics
- Performance Reports

---

# 🏗️ System Architecture

```
Flutter Application
│
├── Office Dashboard
├── Postman Dashboard
├── OCR Review
├── Batch Scanner
└── Route Viewer
        │
        ▼
Node.js + Express API
        │
 ├── Authentication
 ├── OCR Service
 ├── Beat Assignment
 ├── Route Optimization
 ├── Analytics
 └── Letter Management
        │
        ▼
MongoDB Atlas
        │
        ├── Users
        ├── Letters
        ├── Beats
        └── Weather Cache
```

---

# 🛠️ Tech Stack

## Frontend

- Flutter
- Dart
- flutter_map
- Dio
- File Picker

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- Mongoose

---

## Database

- MongoDB Atlas

---

## AI Services

- Google Gemini Vision API

---

## Maps & Location

- Google Geocoding API
- OpenStreetMap
- flutter_map

---

## Weather

- OpenWeather API

---

# 📂 Project Structure

```
PostScan
│
├── backend
│   ├── config
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── uploads
│   └── server.js
│
├── flutter_app
│   ├── lib
│   │   ├── models
│   │   ├── screens
│   │   ├── services
│   │   ├── state
│   │   ├── widgets
│   │   └── main.dart
│   │
│   └── android
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/PostScan.git

cd PostScan
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Flutter

```bash
cd flutter_app

flutter pub get

flutter run
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend.

```env
PORT=5000

MONGO_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET

GEMINI_API_KEY=YOUR_GEMINI_KEY

GOOGLE_GEOCODING_API_KEY=YOUR_GOOGLE_KEY

OPENWEATHER_API_KEY=YOUR_OPENWEATHER_KEY
```

---

# 📊 Workflow

```
Scan Postal Cover
        │
        ▼
Gemini OCR
        │
        ▼
Extract Address
        │
        ▼
Google Geocoding
        │
        ▼
Beat Assignment
        │
        ▼
Weather Analysis
        │
        ▼
Save to MongoDB
        │
        ▼
Route Optimization
        │
        ▼
Delivered
```

---

# 🎯 Future Scope

- Barcode Detection
- QR Code Support
- Offline OCR
- Delivery Analytics
- Predictive Delivery Time
- AI Address Correction
- Mobile Notifications
- India Post API Integration

---

# 👨‍💻 Team

Developed for Hackathon.

Team Name:
**PostScan**

---

# 📄 License

MIT License

---

# ⭐ Support

If you found this project useful,

⭐ Star this repository.

Contributions and suggestions are always welcome.
