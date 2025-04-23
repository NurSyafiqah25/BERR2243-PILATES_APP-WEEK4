# BERR2243-PILATES_APP-WEEK4
# Pilates Management System

## Description
A RESTful API for managing gym members, trainers, classes, and bookings. This system handles member registration, class scheduling, trainer management, and administrative functions.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally on default port 27017)
- Postman - [Download here](https://www.postman.com/downloads/) for API testing

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [repo-name]
Install dependencies:
```
bash
npm install express mongoose bcrypt jsonwebtoken
Start the server:

bash
```
node index.js
```

## API Endpoints

### Authentication

| Method    | Endpoint                   | Description            | Required Body (JSON)           |
|-----------|----------------------------|------------------------|--------------------------------|
| POST      | `/users`                   | Member registration    | `{ name, email, password }`   |
| POST      | `/user/login`              | Member login           | `{ email, password }`         |
| POST      | `/trainers`                | Trainer registration   | `{ name, email, password }`   |
| POST      | `/trainer/login`           | Trainer login          | `{ email, password }`         |
| PUT       | `/users/{id}/reset-password` | Reset password       | `{ newPassword }`             |

---

### Member Functions

| Method    | Endpoint               | Description         | Required Body (JSON)           |
|-----------|------------------------|---------------------|--------------------------------|
| POST      | `/bookings`            | Book classes        | `{ classId, memberId, date }`  |
| GET       | `/classes/schedule`    | View schedule       | -                              |
| POST      | `/payments/monthly`    | Monthly payment     | `{ memberId, amount }`         |

---

### Trainer Functions

| Method    | Endpoint                         | Description                | Required Body (JSON)           |
|-----------|----------------------------------|----------------------------|--------------------------------|
| GET       | `/trainers/{id}/members`         | View assigned members      | -                              |
| PUT       | `/trainers/{id}/availability`    | Update availability        | `{ schedule }`                 |

---

### Admin Functions

| Method    | Endpoint                 | Description          | Required Body (JSON)           |
|-----------|--------------------------|----------------------|--------------------------------|
| PUT       | `/memberships/{id}`      | Manage membership    | `{ status, expiryDate }`       |
| PUT       | `/users/{id}/block`      | Block user           | `{ isBlocked: true }`          |
| POST      | `/classes`               | Create class         | `{ name, trainerId, schedule }`|
| PUT       | `/classes/{id}`          | Update class         | `{ schedule, trainerId }`      |
| DELETE    | `/classes/{id}`          | Delete class         | -                              |

### Use Case Diagram
- Key Actors:
- Member: Register, Login, Book classes, View schedule, Make payments
- Trainer: Register, Login, View assigned members, Update availability
- Admin: Manage memberships, Block users, Create/Update/Delete classes

## Use Case Diagram

Data Models
User (Member/Trainer)
javascript
```
{
  name: String,
  email: String,
  password: String,
  role: String, // 'member', 'trainer', 'admin'
  isBlocked: Boolean,
  membership: {
    status: String,
    expiryDate: Date
  }
}
Class
javascript
{
  name: String,
  trainerId: String,
  schedule: {
    days: [String],
    time: String
  },
  members: [String] // array of member IDs
}
```

## Troubleshooting

### Common Issues
1. Authentication errors
- Ensure all required fields are provided (email, password)
- Check for existing email during registration
- Verify JWT tokens are being sent in headers

2. Class booking conflicts
- Check member's existing bookings for time conflicts
- Verify class capacity before booking

3. Authorization failures
- Admin endpoints require proper role verification
- Members cannot access trainer/admin endpoints

4. MongoDB connection
- Ensure MongoDB is running:
```bash
mongod
Check connection URL in index.js (default: mongodb://localhost:27017)
```

## Project Structure
```
gym-management-api/
├── README.md
├── index.js           # Main application file
├── package.json
├── models/
│   ├── User.js        # Member/Trainer/Admin model
│   ├── Class.js       # Class model
│   └── Booking.js     # Booking model
├── controllers/
│   ├── auth.js        # Authentication logic
│   ├── member.js      # Member functions
│   ├── trainer.js     # Trainer functions
│   └── admin.js       # Admin functions
├── routes/
│   ├── authRoutes.js
│   ├── memberRoutes.js
│   ├── trainerRoutes.js
│   └── adminRoutes.js
└── middleware/
    └── auth.js        # Authentication middleware

```
 ## License
This project is for educational purposes only


