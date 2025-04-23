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
API Endpoints
Authentication
Method	Endpoint	Description	Status Codes	Body (JSON)
POST	/users	Member registration	201 Created	{ name, email, password }
POST	/user/login	Member login	200 OK, 401 Unauthorized	{ email, password }
POST	/trainers	Trainer registration	201 Created	{ name, email, password }
POST	/trainer/login	Trainer login	200 OK, 401 Unauthorized	{ email, password }
PUT	/users/{id}/reset-password	Reset password	200 OK, 404 Not Found, 403 Forbidden	{ newPassword }
Member Functions
Method	Endpoint	Description	Status Codes	Body (JSON)
POST	/bookings	Book classes	201 Created	{ classId, memberId, date }
GET	/classes/schedule	View schedule	200 OK	-
POST	/payments/monthly	Monthly payment	201 Created, 402 Payment Required	{ memberId, amount }
Trainer Functions
Method	Endpoint	Description	Status Codes
GET	/trainers/{id}/members	View assigned members	200 OK
PUT	/trainers/{id}/availability	Update availability	200 OK, 404 Not Found
Admin Functions
Method	Endpoint	Description	Status Codes	Body (JSON)
PUT	/memberships/{id}	Manage membership	200 OK, 404 Not Found	{ status, expiryDate }
PUT	/users/{id}/block	Block user	200 OK, 403 Forbidden	{ isBlocked: true }
POST	/classes	Create class	201 Created	{ name, trainerId, schedule }
PUT	/classes/{id}	Update class	200 OK, 404 Not Found	{ schedule, trainerId }
DELETE	/classes/{id}	Delete class	204 No Content, 404 Not Found	-

```
Use Case Diagram
Key Actors:

Member: Register, Login, Book classes, View schedule, Make payments

Trainer: Register, Login, View assigned members, Update availability

Admin: Manage memberships, Block users, Create/Update/Delete classes

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
Common Issues
Authentication errors

Ensure all required fields are provided (email, password)

Check for existing email during registration

Verify JWT tokens are being sent in headers

Class booking conflicts

Check member's existing bookings for time conflicts

Verify class capacity before booking

Authorization failures

Admin endpoints require proper role verification

Members cannot access trainer/admin endpoints

MongoDB connection

Ensure MongoDB is running:

bash
mongod
Check connection URL in index.js (default: mongodb://localhost:27017)

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


This README includes:
1. All endpoints from your tables
2. Organized by user roles (Member, Trainer, Admin)
3. Data model examples
4. Complete project structure
5. Detailed troubleshooting section
6. Installation instructions
7. Space for your use case diagram

You can:
1. Replace [your-repo-url] and [repo-name] with your actual details
2. Add your diagram file and update the link-to-your-diagram.png
3. Customize the data models if you've implemented different fields
4. Add any additional configuration details specific to your implementation
