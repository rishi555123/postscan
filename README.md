# PostScan

AI-Powered Smart Postal Management System for Intelligent Mail Processing and Delivery Optimization.

---

## Overview

PostScan is an intelligent postal management platform developed to modernize the traditional workflow of postal operations. The system automates address extraction, beat assignment, route optimization, and delivery tracking using Artificial Intelligence and geospatial services.

The platform assists postal staff by reducing manual effort while improving delivery efficiency and operational transparency.

---

## Key Features

### AI-Based OCR

- Automatic address extraction from postal covers
- Recipient name detection
- Structured address parsing
- OCR confidence scoring
- Manual verification and correction

### Batch Processing

- Multiple image upload
- Parallel OCR processing
- Batch status monitoring
- Review pipeline

### Beat Assignment

- Automatic delivery beat allocation
- Geographic mapping
- Postman assignment
- Beat-wise segregation

### Route Optimization

- Optimized delivery sequence
- Shortest-path route planning
- Interactive route visualization
- Distance calculation

### Weather Intelligence

- Real-time weather information
- Rain alerts
- Delivery warnings
- Cached weather support

### Delivery Tracking

Letter lifecycle management:

```text
Scanned
    ↓
OCR Verification
    ↓
Beat Assignment
    ↓
Out for Delivery
    ↓
Delivered
```

### User Roles

#### Office Staff

- Batch scanning
- OCR verification
- Beat allocation
- Dashboard monitoring

#### Postman

- Assigned deliveries
- Route navigation
- Delivery status updates
- Live tracking

#### Administrator

- User management
- Performance analytics
- System monitoring

---

# System Architecture

```text
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

## Technology Stack

### Frontend

- Flutter
- Dart
- Dio
- flutter_map
- File Picker

### Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- Mongoose

### Database

- MongoDB Atlas

### Artificial Intelligence

- Google Gemini Vision API

### Maps & Geolocation

- Google Geocoding API
- OpenStreetMap
- flutter_map

### Weather Services

- OpenWeather API

---

## Project Structure

```text
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
│   ├── android
│   ├── lib
│   │   ├── models
│   │   ├── screens
│   │   ├── services
│   │   ├── state
│   │   ├── widgets
│   │   └── main.dart
│   │
│   └── pubspec.yaml
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/<username>/PostScan.git

cd PostScan
```

### Backend

```bash
cd backend

npm install

npm run dev
```

### Flutter Application

```bash
cd flutter_app

flutter pub get

flutter run
```

---

## Environment Variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5000

MONGO_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

GOOGLE_GEOCODING_API_KEY=YOUR_GOOGLE_GEOCODING_API_KEY

OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
```

---

## Processing Workflow

```text
Postal Cover
      │
      ▼
Image Upload
      │
      ▼
AI OCR (Gemini)
      │
      ▼
Address Extraction
      │
      ▼
Geocoding
      │
      ▼
Beat Assignment
      │
      ▼
Weather Analysis
      │
      ▼
Database Storage
      │
      ▼
Route Optimization
      │
      ▼
Delivery Tracking
```

---

## Future Enhancements

- Offline OCR support
- Barcode and QR code recognition
- AI-based address correction
- Delivery time prediction
- Push notifications
- Postal analytics dashboard
- India Post service integration

---

## Team

**Project:** PostScan

Developed as a Hackathon project focused on improving postal automation through Artificial Intelligence, computer vision, and geospatial technologies.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

This project utilizes the following technologies and services:

- Flutter
- Node.js
- MongoDB Atlas
- Google Gemini API
- Google Geocoding API
- OpenWeather API
- OpenStreetMap
