# E-Government Services Portal

**Live Application:** https://e-governemt-portal.onrender.com

A full-stack web application that digitalizes government services, allowing citizens to apply for services online and government staff to manage applications efficiently.

## Quick Access - Test Accounts

**Admin** (Full system access)

- Email: `admin@example.com`
- Password: `admin123`

**Officer** (Interior Department - Reviews passport/ID applications)

- Email: `officer.interior@example.com`
- Password: `12345`

**Department Head** (Manages officers and department services)

- Email: `head.interior@example.com`
- Password: `12345`

**Citizen** (You can also register new citizen accounts and then login)

## What This Project Does

- **Citizens** can apply for services like passport renewal, business licenses, etc.
- **Officers** review and process applications in their department
- **Department Heads** manage their department's services and officers
- **Admins** oversee the entire system, manage users, and view reports

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS templates, Bootstrap 5
- **Database:** PostgreSQL
- **Authentication:** Session-based with bcrypt
- **Deployment:** Render.com

## Key Features

- Multi-role system (Citizen, Officer, Department Head, Admin)
- Service applications with dynamic forms
- Document uploads (PDF, JPG, PNG)
- Application status tracking
- Notifications system
- Payment simulation
- Department management

## Running Locally

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Set up PostgreSQL database and update `.env` file

3. Run the application:

```bash
npm run dev
```

4. Visit `http://localhost:3000`

## Project Structure

The code is organized with separate controllers and routes for each user role, EJS templates for server-side rendering, and a PostgreSQL database managing users, departments, services, and applications.

---

_Note: This is a capstone project for academic purposes. Payment processing is simulated._

**_ Developed by Najma Wahedi _**
