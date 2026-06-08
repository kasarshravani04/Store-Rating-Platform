# Store Review & Feedback Platform (Full-Stack Showcase)

This repository contains a premium, highly-polished **Store Review & Feedback Platform** designed with a cohesive **Frosted Glass (Glassmorphism) UX Theme**. This project is engineered with a modular, dual-architecture to highlight your proficiency in full-stack clean code on any resume, featuring a **Spring Boot REST API Backend** and a **React + Vite + Tailwind CSS Frontend**.

---

## 🌟 Architecture Highlights

- **Role-Based Access Control (RBAC):** Supports 3 user levels (ADMIN, OWNER, USER) with restricted dashboards and unique responsive actions.
- **Micro-Interaction UI (Frosted Glass Theme):** Aesthetic off-whites, translucid dark backdrops, smooth `framer-motion` entries, and high-contrast gradients that elevate standard list layouts to product-grade experience.
- **Secure JWT Authentication:** Implemented standard JWT header tokens with complete validations (capital letters, special characters, email regex) and validation error outputs.
- **Clean DB Seeding:** Dynamic H2 database seeding out-of-the-box so the app launches pre-populated with ready-to-test sample stores, users, and ratings.

---

## 📂 Project Structure

```text
├── backend-springboot/       # Maven Spring Boot REST API Service
│   ├── src/main/java/...     # Controller, Model, DTO, Security, and Repository files
│   ├── src/main/resources/   # Application properties (H2 & MySQL configuration)
│   └── pom.xml               # Maven Project dependencies (Lombok, JWT, JPA)
├── src/                      # React 19 Frontend Codebase
│   ├── components/           # Extracted modular panels (AddStoreForm, UpdatePasswordForm, etc.)
│   ├── App.tsx               # Main Dashboard view layer
│   └── main.tsx & index.css  # App Bootstrapping and Tailwind utility base imports
├── server.ts                 # Full-Stack Node.js routing and dynamic Spring Boot API proxy
├── package.json              # Client scripts & system build pipelines
└── .env.example              # Environment guideline template
```

---

## 🚀 Step-by-Step Local Deployment Guide

Follow these steps to run both backend and frontend locally, and see them interact in real-time. This guide is written with **zero pre-requisite knowledge** in mind.

### Step 1: Install Required Tools
1. **Java Development Kit (JDK 21 or later):** 
   - [Download Amazon Corretto JDK 21](https://aws.amazon.com/corretto/) or [Eclipse Temurin](https://adoptium.net/).
   - Follow the installation installer. To verify installation, open your terminal and run:
     ```bash
     java -version
     ```
2. **Node.js (v18 or later):** 
   - [Download Node.js](https://nodejs.org/). Choose the LTS version.
   - To verify installation, run:
     ```bash
     node -v
     npm -v
     ```
3. **IDE (IntelliJ IDEA):**
   - [Download IntelliJ IDEA Community Edition (Free)](https://www.jetbrains.com/idea/download/).
4. **Git:**
   - [Download Git](https://git-scm.com/) if you do not have it.

---

### Step 2: Open and Run the Spring Boot Backend in IntelliJ IDEA

1. Launch **IntelliJ IDEA**.
2. Click **Open** (or **File > Open**) and select the `/backend-springboot` subdirectory from your extracted files.
3. Wait for IntelliJ to detect the Maven file system and download project dependencies (this takes 1–3 minutes on first launch). You will see a progress bar at the bottom.
4. Open the file `src/main/resources/application.properties` to inspect configurations. By default, it is configured to use the in-memory **H2 Database** (meaning zero installations are required; it boots instantly).
5. Locate the main application file at:
   `src/main/java/com/platform/storereview/StoreReviewApplication.java`
6. Click the green **Run (Play button)** next to the `public static void main` method or at the top right of the IntelliJ interface.
7. The console terminal will output standard Spring logs, culminating in:
   `Tomcat started on port(s): 8080 (http) with context path ''`

---

### Step 3: Run the React Frontend with Spring Boot Connection

We have provided a built-in proxy within the React dev ecosystem. Running the React frontend redirects all `/api` requests to port `8080` (where Spring Boot is running).

1. Open your terminal or Command Prompt at the project root directory (which contains `package.json`).
2. Install the React project dependencies:
   ```bash
   npm install
   ```
3. Create a local `.env` configuration file by duplicate-copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Open the new `.env` file and define `SPRING_BOOT_URL` to route calls to Java:
   ```env
   SPRING_BOOT_URL="http://localhost:8080"
   ```
5. Launch the development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:3000`. 
   - Every login, store creation, password modification, and review submission will now call **Spring Boot** on port `8080` and fetch live data in real-time!

---

## 🔌 Connection Deep-Dive: How Frontend connects to Backend

1. **Relative Calls in React:**
   Inside `src/App.tsx` and components, calls do not reference static domains like `http://localhost:8080/api`. Instead, they query `/api/auth/login` or `/api/stores` relatively. 
2. **Server-Side Reverse Proxy:**
   During development, the Express layer in local `server.ts` checks the modern `.env` file. If `SPRING_BOOT_URL` is set, it intercepts all requests starting with `/api` and pipes them directly to the Spring Boot instance inside Tomcat on port `8080`.
3. **CORS and Security Headers:**
   Spring Security in the Java backend (`SecurityConfig.java`) is equipped with custom CORS patterns pointing to incoming requests and implements a `JwtRequestFilter` which extracts the standard `Authorization: Bearer <JWT_Token>` header from incoming React calls to authorize clients based on role.

---

## 🗄️ Database Customization: H2 to MySQL (Ready for Production)

If indeed you want to showcase this using a production-grade database like **MySQL**:
1. Open `backend-springboot/src/main/resources/application.properties`.
2. Disable H2 settings by adding comments `#` and uncomment the MySQL properties block:
   ```properties
   # MySQL Configuration (To use production database, uncomment this section and configure details)
   spring.datasource.url=jdbc:mysql://localhost:3306/store_review_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
   spring.datasource.username=YOUR_MYSQL_USERNAME
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   spring.jpa.hibernate.ddl-auto=update
   ```
3. Create a local MySQL database named `store_review_db`.
4. Run the Spring Boot application. Tables and relations will be auto-generated in MySQL upon boot!

---

## 💻 Push and Share on Your GitHub

To display this project on your personal GitHub profile to stand out for interviewer reviews, follow these steps:

1. Open your terminal at the root directory of this project.
2. Initialize a local repository:
   ```bash
   git init
   ```
3. Stage all files (the `.gitignore` is optimized to automatically exclude bulky folders like `node_modules`, standard build files, and databases):
   ```bash
   git add .
   ```
4. Commit details of code to master:
   ```bash
   git commit -m "feat: complete store review system with spring boot REST API, React frontend, JWT security, and frosted glass UI aesthetics"
   ```
5. Go to your web browser, log in to **GitHub**, and click **New Repository**.
6. Name your repository (e.g., `store-review-fullstack`) and click **Create Repository**. Do NOT initialize with a README, license, or gitignore.
7. Copy the Remote Repository URL from GitHub and write:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
   git branch -M main
   git push -u origin main
   ```
8. Refresh your page on GitHub. Your complete code is now safely hosted on your GitHub! Create a link on your resume to draw immediate recruiter assessment.
