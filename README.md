# Yet Another Shopping List

A simple JavaScript web app that stores a shopping list in Firestore and updates it in real time across all open instances without the help of a backend server.

## Features

- Google account authentication.
- Create multiple lists of items.
- Add/remove items to lists.
- Check/uncheck items.
- Mark items as urgent.
- All changes to items list are synchronized instantly across all open, signed-in instances.

## Limitations

- Sharing, renaming and deleteing lists requires to manually edit the database.

## Setup Instructions

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/), create a new project.
   - In the project, go to Firestore Database and create a database (in test mode for development).

2. **Enable Google Authentication:**
   - In the Firebase Console, go to **Authentication > Get Started**.
   - Go to the **Sign-in method** tab.
   - Enable **Google** as a sign-in provider and save.

3. **Set Firestore Security Rules (authenticated users only):**
   - In **Firestore database**, go to **Rules** and set:
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

4. **Get Your Firebase Config:**
   - Go to Project Settings > General > Your Apps > Firebase SDK snippet > Config.
   - Copy the config object to a file. It should look like this:
     ```js
     export const firebaseConfig = {
       apiKey: "AIza...your real api key...",
       authDomain: "your-app.firebaseapp.com",
       projectId: "your-app",
       storageBucket: "your-app.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:1234567890:web:abcdefg"
     };
     ```
   - **WARNING:** The `export` keyword will be probably missing in the copied config object, add it, it is important.
   - **WARNING:** Do not commit this file to version control or expose the application on the web without restricting your API key access (see below).

5. Optionally, **Enable your domain in Firebase Authentication panel**
If you plan to expose this application on the Internet, you should:
   1. Have your own domain.
   2. Allow that domain to use Authentication in the Firebase console (go to your project, then **authentication**, then **parameters** and finally **Authorized domains**).
   3. Restrict access to your firestore database using the Firebase console.  
Go to **Firestore database**, then **Rules** and set:
     ```
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /stringList/{docId} {
            allow read, write: if request.auth != null
              && request.auth.token.email in [
                "firstuser@gmail.com",
                "seconduser@gmail.com"
              ];
          }
        }
      }
     ```

## Run instructions

### Run with Docker

Assuming your `firebaseConfig.js` is in your home directory:

```sh
docker run -d -p 8080:8080 \
  -v $(HOME)/firebaseConfig.js:/usr/share/nginx/html/firebaseConfig.js:ro \
  fathzer/yasl
```

- The app will be available at [http://localhost:8080](http://localhost:8080)

### Run locally

1. Set up Firebase config
   - Open (or create if it does not exist) the file `web/firebaseConfig.js` in your project folder.
   - **Paste your copied config object into `firebaseConfig.js`, replacing the existing one if present.**
   - Save the file.

2. **Run the App (Important: Use a Local Server!):**
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

## Use it

1. **Sign in with Google** and log in.
2. **Add items to the list**. All signed-in users will see real-time updates.
3. **Enjoy!**

## Notes

- For production, set proper Firestore security rules and restrict authentication as needed.

### How to build the Docker image

```sh
docker build -t fathzer/yasl -f docker/Dockerfile .
```
