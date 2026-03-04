Travel Booking Backend API
Project Overview

This is a backend REST API for a travel booking system. It allows users to register, login, view tour packages, and book/cancel trips. Admin users can manage tour packages (create, update, delete).

This project demonstrates a medium-level Node.js/Express backend with authentication, authorization, and database relations using Prisma and PostgreSQL.

Tech Stack
Node.js & Express – Backend server
Prisma ORM – Database abstraction
PostgreSQL – Relational database
JWT (JSON Web Tokens) – Authentication & authorization
bcrypt – Password hashing
Postman – API testing

Features
User Features
User registration & login 
View profile 
List all tour packages 
Cancel a booking
View bookings 

Admin Features
Admin registration/login 
Create new tour packages 
Update existing tour packages 
Delete tour packages 
View all bookings 

Note: Admin-only routes are protected using role-based access.

Getting Started
1. Clone the project
git clone https://github.com/AditiJadhav03/Travel-Booking-Backend-API.git
cd Travel-Booking-Backend-API
2. Install dependencies
npm install
3. Setup environment variables

Create a .env file in the root folder:

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/travel_booking"
JWT_SECRET="your_jwt_secret_key"
PORT=5000

Replace USER and PASSWORD with your PostgreSQL credentials.

4. Prisma setup
npx prisma generate
npx prisma migrate dev --name init
5. Start the server
npm run dev

Server runs on: http://localhost:5000

API Endpoints

Authentication
Method	  Endpoint	        Body	                             Description

POST	   /register	   { "name", "email", "password" }	    Create new user
POST	   /login	     { "email", "password" }	              Login user, return JWT token

User Routes
Method	 Endpoint      	Headers                       	       Body	                   Description

GET	    /profile	      Authorization: Bearer TOKEN	           None	                 Get current user profile
GET   	/packages	      None	                                 None	                List all tour packages
POST	  /bookings	      Authorization: Bearer TOKEN	          { "packageId": ID }	    Book a tour package
DELETE	/bookings/:id	  Authorization: Bearer TOKEN            None	                 Cancel a booking
GET    	/bookings	      Authorization: Bearer TOKEN	           None	                View all bookings by user

Admin Routes
Method	           Endpoint            	Headers	                                    Body	                              Description
POST	            /packages	           Authorization: Bearer ADMIN_TOKEN	   { "title", "description", "price" }	   Create a new package
PUT	              /packages/:id      	 Authorization: Bearer ADMIN_TOKEN	   { "title", "description", "price" }	   Update a package
DELETE	          /packages/:id	       Authorization: Bearer ADMIN_TOKEN	           None	                           Delete a package
GET             	/admin-only 	       Authorization: Bearer ADMIN_TOKEN	           None	                           Admin test route
Database Models

User

model User {
  id        Int       @id @default(autoincrement())
  name      String
  email     String    @unique
  password  String
  role      String    @default("USER")
  createdAt DateTime  @default(now())
  bookings  Booking[]
}

TourPackage

model TourPackage {
  id          Int       @id @default(autoincrement())
  title       String
  description String
  price       Float
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  bookings    Booking[]
}

Booking

model Booking {
  id          Int         @id @default(autoincrement())
  user        User        @relation(fields: [userId], references: [id])
  userId      Int
  tourPackage TourPackage @relation(fields: [packageId], references: [id])
  packageId   Int
  bookingDate DateTime    @default(now())
}
Testing

Use Postman to test all endpoints.
Replace YOUR_TOKEN with user JWT token.
Replace ADMIN_TOKEN with admin JWT token.
You can import the TravelBooking.postman_collection.json file to test all routes quickly.

Conclusion
This project demonstrates:
Role-based authentication & authorization
Full CRUD operations for tour packages
User booking system
Database relationships with Prisma
JWT token-based API security
