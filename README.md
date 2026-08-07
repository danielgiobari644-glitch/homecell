# Home.cell - Home Fellowship Portal & Community Management Platform

Home.cell is a comprehensive digital home fellowship platform designed for churches, cell group networks, daily devotions, prayer desks, and community engagement.

## Quick Start & Setup (Windows, macOS, Linux)

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**
- **Firebase CLI** (optional for manual deployment, run via `firebase.cmd` on Windows)

### Installation & Local Development

1. **Clone the repository**:
   ```cmd
   git clone https://github.com/your-org/homecell-net.git
   cd C:\Users\Dell\Downloads\homecell-net
   ```

2. **Install Dependencies**:
   ```cmd
   npm install
   ```

3. **Start Local Development Server**:
   ```cmd
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for Production**:
   ```cmd
   npm run build
   ```
   This executes the cross-platform Node.js build runner (`node build.js`), creating a clean, production-ready `dist` folder compatible with Windows Command Prompt (`cmd.exe`), PowerShell, macOS, and Linux.

5. **Start Production Server**:
   ```cmd
   npm start
   ```

---

## Windows Deployment & Firebase CLI Instructions

To deploy to Firebase from Windows Command Prompt (`cmd.exe`), use `firebase.cmd`:

1. **Authenticate Firebase**:
   ```cmd
   firebase.cmd login
   ```

2. **List Firebase Projects / Check Login**:
   ```cmd
   firebase.cmd login:list
   ```

3. **Initialize Firebase Project** (if setting up new project):
   ```cmd
   firebase.cmd init
   ```

4. **Deploy Rules & Firestore Configuration**:
   ```cmd
   firebase.cmd deploy
   ```

5. **Run Local Firebase Emulators**:
   ```cmd
   firebase.cmd emulators:start
   ```

---

## Git Workflow & GitHub Actions Deployment

The project is fully prepared for automated CI/CD via GitHub Actions.

1. **Stage and Commit Changes**:
   ```cmd
   git add .
   git commit -m "Update Home.cell"
   ```

2. **Push to Main Branch**:
   ```cmd
   git push origin main
   ```
   *GitHub Actions will automatically trigger, build the project using `npm run build`, and deploy the latest static assets and Firestore security rules.*

---

## Environment Configuration

Copy `.env.example` to `.env`:
```cmd
copy .env.example .env
```
Ensure required keys (e.g., `GEMINI_API_KEY`, `APP_URL`) are populated.

---

## Project Architecture & File System

- `server.js`: Node.js Express server providing Web Push API, fallback routing, and static file serving using `path.join()`.
- `build.js`: Cross-platform Node.js script replacing Unix-specific shell scripts (`mkdir`, `cp`, `rm`) with native `fs` and `path` APIs.
- `clean.js`: Cross-platform cleanup script.
- `index.html`: Core single-page application entry point with modular JS modules (`app.js`, `cells.js`, `prayers.js`, `streak.js`, `dashboard.js`, `champions.js`, etc.).
