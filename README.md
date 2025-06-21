<p align="center">
  <img src="assets/icon.png" alt="Bookkeeps Logo" width="200"/>
</p>

# 📚 Bookkeeps

**Bookkeeps** is a personalized iOS app that helps readers discover and track upcoming book releases based on their favorite genres and authors. Whether you're into fantasy, thrillers, romance, or non-fiction, Bookkeeps keeps your reading list fresh and relevant.

---

## 🚀 Features

- Smart book discovery
  - Recommendations based on favorited authors, genres, and themes
  - Powered by MongoDB Atlas Search

- Release tracking
  - View books coming out *this week*, *this month*, or already released
  - Easily browse curated categories

- Personalized profiles
  - Favorite authors and genres
  - Receive dynamic recommendations and notifications

- Push notifications
  - Get notified when your favorite books are released

- Purchase integration
  - Affiliate links for buying books via Amazon

---

## 🧠 Tech Stack

### Frontend
- React Native (Expo)
- React Navigation
- UI Kitten
- AsyncStorage
- Expo Notifications

### Backend
- Node.js + Express
- MongoDB Atlas + Atlas Search
- Amazon Product Advertising API (PA-API)
- Device-based login using Expo Device ID

---

## 🛠 Data Import Scripts

This project includes a custom Python-based pipeline that pulls fresh books and author data into MongoDB.

### Sources:
- Google Books API
- Amazon PA-API (affiliate links)
- Enterprise Knowledge Graph (for enrichment)

---

## Download on iOS
- https://apps.apple.com/us/app/bookkeeps/id6670183504

