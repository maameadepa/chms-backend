# Campus Hostel Management System

A web application for managing student hostel applications and room allocations.

## Features

- Student registration and login
- Hostel application submission and management
- Room availability viewing and booking
- Application status tracking
- Admin dashboard for:
  - Processing applications
  - Managing rooms
  - Creating new rooms
  - Viewing student profiles
- Student dashboard for:
  - Viewing application status
  - Managing profile
  - Viewing notifications
  - Checking room assignments

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Authentication: JWT (JSON Web Tokens)

## Project Structure

```
├── backend/
│   ├── frontend/           # Frontend files
│   │   ├── css/           # Stylesheets
│   │   ├── js/            # JavaScript files
│   │   ├── img/           # Images
│   │   └── *.html         # HTML pages
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── server.js          # Main server file
│   ├── db.js             # Database configuration
│   ├── schema.sql        # Database schema
│   └── create-admin.js   # Admin account creation script
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/maameadepa/chms-backend.git
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
DATABASE_URL=postgresql://postgres:maame@localhost:5432/hostel_management
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Set up the database:
```bash
psql -U postgres -d hostel_management -f schema.sql
```

5. Admin account credentails:
Email: admin@example.com
Password: admin123

5. User account credentails:
Email: maame@gmail.com
Password: 1234

6. Start the development server:
```bash
npm run dev
```

### Frontend Setup

The frontend is served directly from the backend server. No additional setup is required.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new student
- POST `/api/auth/login` - Login student

### Applications
- POST `/api/applications` - Submit hostel application
- GET `/api/applications/status` - Check application status
- GET `/api/applications` - View all applications (admin)

### Rooms
- GET `/api/rooms/available` - View available rooms
- GET `/api/rooms/assigned` - View assigned room
- POST `/api/rooms` - Create new room (admin)
- GET `/api/rooms` - View all rooms (admin)

### Admin
- GET `/api/admin/applications` - View pending applications
- POST `/api/admin/applications/:id/process` - Process application
- GET `/api/admin/students` - View all students

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Protected admin routes
- Input validation
- CORS enabled for frontend access
- Secure session management

## Development

- Use `npm run dev` for development with hot-reload
- Use `npm start` for production
- Frontend files are served statically from the backend server

<!-- ## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request  -->