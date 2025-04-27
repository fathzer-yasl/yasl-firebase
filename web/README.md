# Firestore List App

A simple JavaScript web app that stores a list of strings in Firestore and updates in real time across all open instances without the help of a backend server.

## Setup Instructions

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/), create a new project.
   - In the project, go to Firestore Database and create a database (in test mode for development).

2. **Enable Google Authentication:**
   - In the Firebase Console, go to **Authentication > Get Started**.
   - Go to the **Sign-in method** tab.
   - Enable **Google** as a sign-in provider and save.

3. **Get Your Firebase Config:**
   - Go to Project Settings > General > Your Apps > Firebase SDK snippet > Config.
   - Copy the config object. It will look like this:
     ```js
     const firebaseConfig = {
       apiKey: "AIza...your real api key...",
       authDomain: "your-app.firebaseapp.com",
       projectId: "your-app",
       storageBucket: "your-app.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:1234567890:web:abcdefg"
     };
     ```
   - Open `main.js` in your project folder.
   - **Replace the existing `firebaseConfig` object at the very top of the file with your copied config.**
   - Save the file.

4. **Set Firestore Security Rules (authenticated users only):**
   - In Firestore, go to **Rules** and set:
     ```
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
   - This ensures only signed-in users can read/write data.

5. **Run the App (Important: Use a Local Server!):**
   - Google authentication requires the app to be served over `http://` or `https://` (not `file://`).
   - **To start a local server with Python:**
     - Open a terminal in your project directory.
     - Run:
       - For Python 3:
         ```
         python -m http.server 8080
         ```
       - For Python 2:
         ```
         python -m SimpleHTTPServer 8080
         ```
     - Open your browser and go to [http://localhost:8080](http://localhost:8080)
   - Click **Sign in with Google** and log in.
   - Add strings to the list. All signed-in users will see real-time updates.

## Features
- Google account authentication
- Add/remove strings to a shared list
- All changes sync instantly across all open, signed-in instances

## Notes
- For production, set proper Firestore security rules and restrict authentication as needed.
- You can enhance this app with authentication checks, item removal, etc.

## Features
- Add strings to a shared list.
- All changes sync instantly across all open instances.

## Notes
- For production, set proper Firestore security rules.
