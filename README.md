# E-Government Citizen Services Portal

## Live Application: https://e-governemt-portal.onrender.com

A comprehensive full-stack web application designed to digitalize government services, enabling citizens to apply for various services online while providing government officers with efficient tools for application processing and management.

## Project Description

This capstone project implements a multi-role system where citizens can apply for government services such as passport renewal, business licenses, and land registration without visiting physical offices. The system includes separate interfaces for citizens, government officers, and administrators with role-based access control and comprehensive workflow management.

## Key Features

### Multi-Role Access System
- **Citizen Portal**: Service applications, request tracking, document upload, payment processing
- **Officer Portal**: Application review, status management, department-specific requests
- **Admin Portal**: User management, department configuration, service management, system analytics

### Core Functionality
- Dynamic service application forms with custom field requirements
- Secure document upload system (PDF, JPG, PNG)
- Simulated payment processing for service fees
- Real-time application status tracking
- In-app notification system
- Advanced search and filtering capabilities
- Comprehensive reporting and statistics

## Technology Stack

### Backend
- Node.js Runtime Environment
- Express.js Web Framework
- EJS Templating Engine
- Session-based Authentication with bcrypt
- Multer for file upload handling

### Frontend
- EJS (Embedded JavaScript Templates)
- Bootstrap 5 for responsive UI
- Vanilla JavaScript for client-side functionality

### Database
- PostgreSQL relational database
- Native pg package for database operations

### Deployment
- Render.com cloud platform
- Render PostgreSQL database service
- Production environment with SSL encryption

## Installation and Local Development

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL database
- npm package manager

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/najmawahedi/E-governemt-portal.git
cd E-governemt-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file with the following configuration:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=egov_portal
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
NODE_ENV=development
```

4. **Initialize the database**
```bash
node database/setup.js
```

5. **Start the development server**
```bash
npm run dev
```

6. **Access the application**
Navigate to `http://localhost:3000` in your web browser

## Default Test Accounts

### Administrator Access
- Email: `admin@example.com`
- Password: `admin123`
- Capabilities: Full system administration privileges

### officer Access
Log in as an example officer
- Email: `officer.interior@example.com`
- Password: `12345`

### Citizen Access
Users can register new accounts through the citizen registration portal.

## System Architecture

### Database Schema
The application utilizes a relational database with the following core tables:
- Users (multi-role user management)
- Departments (service department organization)
- Services (configurable government services)
- Requests (service application tracking)
- Documents (file upload management)
- Payments (transaction records)
- Notifications (user communication)

### Security Implementation
- Session-based authentication system
- Password hashing with bcrypt algorithm
- Role-based access control
- SQL injection prevention
- File type validation and security

## Deployment

The application is deployed on Render.com with the following configuration:
- Web Service: Node.js environment
- Database: PostgreSQL instance
- Automatic deployment from GitHub repository
- Environment variables configured in Render dashboard

## Project Structure

```
E-governemt-portal/
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── citizenController.js
│   └── officerController.js
├── middleware/
│   └── authMiddleware.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── citizenRoutes.js
│   └── officerRoutes.js
├── views/
│   ├── admin/
│   ├── citizen/
│   ├── officer/
│   └── auth/
├── uploads/
└── public/
```

## Academic Context

This project demonstrates comprehensive back-end web development capabilities, including database design, backend API development, frontend implementation using EJS, user authentication, file handling, and deployment.

## Developer

- **Najma Wahedi** 

## Note

This is an academic demonstration project. Payment processing is simulated for educational purposes and does not involve real financial transactions.
