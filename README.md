# 🎓 E-TALA Portal
**Enhanced Teachers Administrative and Learning Assistant**

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)

E-TALA is a unified, cloud-ready educational management system designed to streamline school administration, automate complex timetable scheduling, track academic performance, and distribute learning materials. Built entirely on a **Serverless Architecture** using Google Apps Script and Google Sheets, E-TALA offers zero-cost hosting with a highly responsive, role-based user interface.

---

## ✨ Key Features

E-TALA adapts its interface dynamically based on a strict **Role-Based Access Control (RBAC)** system.

### 👑 Administrator
* **Master Scheduler:** Advanced timetable management featuring both manual Drag-and-Drop functionality and a Batch Auto-Scheduler algorithm that prevents teacher and room overlapping.
* **Institutional Oversight:** Real-time dashboards monitoring total users, active school years, and automated student promotion.
* **Grade Tracking:** Visual compliance badges to monitor which teachers have encoded their quarterly grades.
* **User & Section Management:** Full CRUD (Create, Read, Update, Delete) capabilities for user accounts, class sections, and enrollment rosters.

### 👩‍🏫 Teacher
* **Advisory Class Management:** Dedicated homeroom tracking to view consolidated student report cards and monitor co-teacher grade submissions.
* **Grades Portal:** A fast, keyboard-optimized interface for encoding Q1-Q4 grades, complete with automated final average calculations.
* **Learning Materials LMS:** Distribute links, PDFs, and video resources globally to a section or privately to specific students.
* **Schedule & Rosters:** Read-only access to personal timetables and printable class attendance rosters.

### 🎒 Student
* **Academic Tracking:** Real-time access to personal quarterly report cards and historical grade data.
* **My Schedule:** Digital access to weekly timetables indicating subjects, teachers, and room assignments.
* **Material Access:** One-click access to all digital homework and reading assignments provided by instructors.

---

## 🛠️ Technology Stack

* **Frontend:** HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
* **Icons:** Lucide Icons
* **Backend:** Google Apps Script (`code.gs`)
* **Database:** Google Sheets (Dynamic table generation via script)
* **Architecture:** Unified Single-Page Application (SPA) simulated via Google HTML Service.

---

## 🚀 Deployment Guide (Google Apps Script)

Because E-TALA uses Google Sheets as its database, you do not need traditional web hosting. Follow these steps to deploy the portal for free:

### 1. Set Up the Environment
1. Open [Google Sheets](https://sheets.google.com) and create a new Blank Spreadsheet.
2. Name the spreadsheet `E-TALA Database`.
3. In the top menu, click **Extensions** > **Apps Script**.
4. Rename the Apps Script project to `E-TALA Portal`.

### 2. Add the Code
1. In the Apps Script editor, you will see a file named `Code.gs`. 
2. Delete any existing code in this file, and paste the **Backend Code** (the Google Apps Script functions).
3. Click the **[ + ]** icon next to "Files" and select **HTML**.
4. Name the new file `Index` (exactly as spelled, capital I).
5. Paste the **Frontend Code** (the HTML/Tailwind/JS) into `Index.html`.
6. Click the **Save** (floppy disk) icon.

### 3. Initialize the Database
1. Go back to `Code.gs`.
2. In the toolbar at the top, select the `setupSystem` function from the dropdown menu.
3. Click **Run**.
4. Google will ask for permission to access your spreadsheet. Click **Review Permissions**, select your Google account, click **Advanced**, and click **Go to E-TALA Portal (unsafe)**. Allow the permissions.
5. *Success!* If you look at your Google Sheet, the script has automatically generated all the necessary database tables (Users, Classes, Schedules, Grades, etc.) and injected default mock users.

### 4. Deploy as a Web App
1. In the top right corner of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill out the configuration:
   * **Description:** `E-TALA v1.0`
   * **Execute as:** `Me (your email)`
   * **Who has access:** `Anyone`
4. Click **Deploy**.
5. Copy the **Web app URL**. This is the link you will give to your teachers and students to access the portal!

---

## 🧪 Mock Login Credentials

If you ran the `setupSystem()` function during deployment, the database was populated with test accounts. Use these to explore the portal:

| Role | User ID | Password |
| :--- | :--- | :--- |
| **Admin** | `admin01` | `pass123` |
| **Teacher** | `teacher01` | `pass123` |
| **Student** | `student01` | `pass123` |

---
