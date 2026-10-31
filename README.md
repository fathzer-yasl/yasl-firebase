# Yet Another Shopping List

A simple JavaScript web app that stores a shopping list in Firestore and updates it in real time across all open instances without the help of a backend server.

## Features

- Google account authentication.
- Create multiple lists of items.
- Add/remove items to lists.
- Check/uncheck items.
- Mark items as urgent.
- Rename or delete items via an edit button or a long press (configurable in Settings).
- Share lists with other users, optionally granting them admin permissions.
- Rename lists, delete them.
- All changes to items list are synchronized instantly across all open, signed-in instances.

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
     window.firebaseConfig = {
       apiKey: "AIza...your real api key...",
       authDomain: "your-app.firebaseapp.com",
       projectId: "your-app",
       storageBucket: "your-app.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:1234567890:web:abcdefg"
     };
     ```
   - **WARNING:** The beginning of the first line `window.firebaseConfig` will be probably different in the copied config object, change it, it is important.
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
     
### Notes

- For production, set proper Firestore security rules and restrict authentication as needed.

## Run instructions

### Run with Docker

This is clearly the easiest way to run the app.

Assuming your `firebaseConfig.js` is in your home directory:

```sh
docker run -d -p 8080:8080 \
  -v $(HOME)/firebaseConfig.js:/usr/share/nginx/html/config/firebaseConfig.js:ro \
  fathzer/yasl
```

- The app will be available at [http://localhost:8080](http://localhost:8080)

### Run the distribution package locally.

1. Set up Firebase config
   - Open (or create if it does not exist) the file `web/public/config/firebaseConfig.js` in your project folder.
   - **Paste your copied config object into `firebaseConfig.js`, replacing the existing one if present.**
   - Save the file.

2. [Build the distribution package](#how-to-build-a-distribution-package-with-vite).

3. **Run the App (Important: Use a Local Server!):**
   - Google authentication requires the app to be served over `http://` or `https://` (not `file://`).
   - **To start a local server with Python:**
     - Open a terminal in your project directory.
     - Run (for Python 3):
        ```
        cd dist
        python3 -m http.server 8080
        ```
        or `npm run dev` from the root directory.
     - Open your browser and go to [http://localhost:8080](http://localhost:8080)

## How to build the distribution package (with Vite)

To build a production-ready distribution package in the `dist` folder using [Vite](https://vitejs.dev/):

1. **Install Node.js and npm**  
   Make sure you have [Node.js](https://nodejs.org/) and npm installed.

2. **Install dependencies**  
   You need to run once:
   ```sh
   npm install
   ```
   **once** after cloning the repository or when dependencies in `package.json` change.  

3. **Build the package**  
   Run:
   ```sh
   npm run build
   ```
   This will generate the `dist` folder containing all necessary files (JS bundle, CSS, HTML, etc.).

4. **Serve or deploy the contents of `dist`**  
   You can use any static web server to serve the files in `dist`.

### How to build the Docker image

First [build the distribution package](#how-to-build-the-distribution-package-with-vite).

Then:
```sh
docker build -t fathzer/yasl -f docker/Dockerfile .
```

## How to deploy a new release

Releases are published to [Docker Hub](https://hub.docker.com/) by a GitHub Actions workflow ([`.github/workflows/dockerbuild.yml`](.github/workflows/dockerbuild.yml)).

### Publish a release

1. **Create and push a git tag** with the version you want to publish — typically by creating a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), or manually:
   ```sh
   git tag 0.0.4
   git push origin 0.0.4
   ```

2. The workflow then automatically:
   - computes the build version `<tag>-<date>-<time>` (UTC, e.g. `0.0.4-20261031-1740`) and injects it as the application version (this is the version the app displays in Settings; it also names the service worker cache, so every build starts with a fresh cache),
   - builds the distribution package with Vite,
   - builds the Docker image and pushes it to Docker Hub as `fathzer/yasl:<tag>-<date>-<time>`,
   - if the tag has the form `x.y.z`, also pushes `fathzer/yasl:x.y.z` and updates the floating `fathzer/yasl:latest` tag.

### Tag naming rules

- A leading `v` is stripped: pushing `v0.0.4` or `0.0.4` both publish `yasl:0.0.4`. Any `/` in the tag is replaced by `-`.
- Only tags of the form `x.y.z` are considered real releases: they update `yasl:x.y.z` and `latest`.
- Any other tag (e.g. `0.0.5-rc1`) is a release candidate: it only publishes `yasl:<tag>-<date>-<time>` and never moves `latest`.
- Publishing an older `x.y.z` tag (e.g. a hotfix on a previous version) also moves `latest`.

### Version numbering

There is nothing to bump manually in the code: the git tag is the single source of truth. In development builds (no `APP_RELEASE` environment variable), the version shown is `dev-<commit sha>` or `dev`.

### Build check on branches

Every push to any branch runs a build check (Vite build + Docker image build, without pushing to Docker Hub). It requires no secret, so it also works on forks.

### Forks

The release job requires the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets. On a fork without them, the release job simply fails while the build check still passes. If you set these secrets on your fork, releases will be pushed to your own Docker Hub account.

## How to run the app during development

To run the app with hot reload and a local development server using Vite:

1. **Install dependencies**  
   You only need to run:
   ```sh
   npm install
   ```
   **once** after cloning the repository or when dependencies in `package.json` change.  
   You do **not** need to run `npm install` every time you edit your code.

2. **Start the Vite development server**  
   In your project root, run:
   ```sh
   npm run dev
   ```
   This will start a local server (by default at [http://localhost:8080](http://localhost:8080)).

3. **Open the app in your browser**  
   Go to [http://localhost:8080](http://localhost:8080).

- Any changes you make to your source files (JS, HTML, CSS, etc.) will be reflected immediately in the browser (hot reload).
- Make sure your `firebaseConfig.js` is present in the correct location as described above.

**Note:**  
- The development server serves files from the `web` directory and static assets from `web/public`.
- Do **not** open `index.html` directly from the filesystem; always use the Vite dev server for development.
- Only run `npm install` again if you add/remove dependencies in `package.json` or after a fresh clone.

## Use it

1. **Sign in with Google** and log in.
2. **Create a list**.
3. **Add items to the list**. All signed-in users will see real-time updates.
4. **Enjoy!**
