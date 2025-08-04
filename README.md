# 📋 Full-Stack ToDo Application

> A modern, feature-rich ToDo application built with Next.js 14+, featuring admin approval workflows, real-time notifications, and comprehensive task management.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

🔗 **Repository:** [https://github.com/iakshayrathee/todo-app-assignment](https://github.com/iakshayrathee/todo-app-assignment)

## 🎯 Demo Credentials

For testing purposes, you can use these pre-configured accounts:

### **Admin Account**
- **Email:** `user@gmail.com`
- **Password:** `user@gmail.com`
- **Role:** Admin (can approve users, view all todos, access admin dashboard)

### **User Account**
- **Email:** `dummy@gmail.com`
- **Password:** `dummy@gmail.com`
- **Role:** User (can create and manage personal todos)

> **Note:** These accounts are pre-approved and ready to use for demonstration purposes.

## 📸 Screenshots

### Admin Dashboard
![Admin Dashboard](https://github.com/iakshayrathee/todo-app-assignment/raw/main/screenshots/admin-dashboard.png)
*Comprehensive admin dashboard with user management, statistics, and system overview*

### User Dashboard
![User Dashboard](https://github.com/iakshayrathee/todo-app-assignment/raw/main/screenshots/user-dashboard.png)
*Clean and intuitive user interface for managing personal todos*

### Todo Management
![Todo Management](https://github.com/iakshayrathee/todo-app-assignment/raw/main/screenshots/todo-management.png)
*Advanced todo management with filtering, search, and bulk operations*

### Real-time Features
![Real-time Features](https://github.com/iakshayrathee/todo-app-assignment/raw/main/screenshots/realtime-features.png)
*Live notifications and real-time updates powered by Pusher*

### Database Overview
![Database Overview](https://github.com/iakshayrathee/todo-app-assignment/raw/main/screenshots/database-overview.png)
*PostgreSQL database with users and todos tables*

## 🚀 Features

### 🔐 **Authentication & Authorization**
- **NextAuth.js** integration with credentials provider
- **Admin approval workflow** - new users require admin approval
- **Role-based access control** (Admin/User)
- **JWT session management**
- **Secure password hashing** with bcryptjs

### 📝 **Todo Management**
- **Full CRUD operations** for todos
- **Advanced filtering** (All, Completed, Pending)
- **Real-time search** across title and description
- **Tags system** for better organization
- **Due dates** with notification support
- **Bulk operations** (complete/delete multiple todos)
- **Export functionality** (JSON/CSV formats)

### 🔔 **Real-time Notifications**
- **Pusher integration** for real-time updates
- **Task due notifications** to users
- **Task completion notifications** to admins
- **New user registration alerts** for admins
- **Private channels** per user

### 👑 **Admin Dashboard**
- **User management** (approve/reject users)
- **System statistics** (users, todos, completion rates)
- **All todos overview** (read-only access)
- **Real-time user registration updates**
- **Export capabilities** for all data

### 🎨 **Modern UI/UX**
- **shadcn/ui components** for consistent design
- **Responsive design** (mobile-first approach)
- **Dark/Light mode** with system preference support
- **Loading skeletons** for better UX
- **Error boundaries** for robust error handling
- **Smooth animations** and transitions

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Hook Form** with Zod validation
- **next-themes** for theme management

### **Backend**
- **Next.js API Routes** for server-side logic
- **NextAuth.js** for authentication
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Pusher** for real-time functionality

### **Additional Tools**
- **bcryptjs** for password hashing
- **json2csv** for data export
- **Sonner** for toast notifications
- **Lucide React** for icons

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database
- Pusher account (for real-time features)

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd todo-app
```

### **2. Install Dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Environment Configuration**
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Pusher (for real-time notifications)
NEXT_PUBLIC_PUSHER_APP_ID="your-pusher-app-id"
NEXT_PUBLIC_PUSHER_APP_KEY="your-pusher-app-key"
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_SECRET="your-pusher-secret"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"
PUSHER_CLUSTER="your-pusher-cluster"

# Environment
NODE_ENV="development"
```

### **4. Database Setup**
```bash
# Run database migrations
npm run migrate
```

### **5. Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | ✅ |
| `NEXTAUTH_URL` | Base URL for NextAuth | ✅ |
| `NEXT_PUBLIC_PUSHER_APP_ID` | Pusher App ID (public) | ✅ |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | Pusher App Key (public) | ✅ |
| `PUSHER_APP_ID` | Pusher App ID (server) | ✅ |
| `PUSHER_SECRET` | Pusher Secret Key | ✅ |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher Cluster (public) | ✅ |
| `PUSHER_CLUSTER` | Pusher Cluster (server) | ✅ |
| `NODE_ENV` | Environment mode | ✅ |

## 📚 API Documentation

### **Authentication Endpoints**

#### **User Registration**
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User created successfully. Please wait for admin approval.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### **User Login**
```http
POST /api/auth/signin
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "1",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### **Todo Endpoints**

#### **Get Todos**
```http
GET /api/todos?filter=all&search=query
```

**Query Parameters:**
- `filter`: `all` | `completed` | `pending`
- `search`: Search term for title/description

**Response:**
```json
[
  {
    "id": 1,
    "title": "Complete project",
    "description": "Finish the todo application",
    "completed": false,
    "userId": 1,
    "dueDate": "2024-12-31T23:59:59Z",
    "tags": ["work", "urgent"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### **Create Todo**
```http
POST /api/todos
```

**Request Body:**
```json
{
  "title": "New task",
  "description": "Task description",
  "dueDate": "2024-12-31T23:59:59Z",
  "tags": ["work", "important"]
}
```

**Response:**
```json
{
  "id": 2,
  "title": "New task",
  "description": "Task description",
  "completed": false,
  "userId": 1,
  "dueDate": "2024-12-31T23:59:59Z",
  "tags": ["work", "important"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### **Update Todo**
```http
PUT /api/todos
```

**Request Body:**
```json
{
  "id": 1,
  "title": "Updated task",
  "description": "Updated description",
  "dueDate": "2024-12-31T23:59:59Z",
  "tags": ["work", "updated"]
}
```

#### **Delete Todo**
```http
DELETE /api/todos
```

**Request Body:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "message": "Todo deleted successfully"
}
```

#### **Toggle Todo Completion**
```http
POST /api/todos/toggle
```

**Request Body:**
```json
{
  "todoId": 1,
  "completed": true
}
```

#### **Bulk Operations**
```http
PATCH /api/todos/bulk
```

**Request Body:**
```json
{
  "ids": [1, 2, 3],
  "action": "complete" // or "delete"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully completed 3 todos",
  "count": 3
}
```

#### **Export Todos**
```http
GET /api/todos/export?format=csv
```

**Query Parameters:**
- `format`: `json` | `csv`

**Response:** File download (JSON or CSV)

### **Admin Endpoints**

#### **Approve/Reject User**
```http
POST /api/admin/approve-user
```

**Request Body:**
```json
{
  "userId": 1,
  "approved": true // or false to reject
}
```

**Response:**
```json
{
  "message": "User approved successfully"
}
```

#### **Get All Users**
```http
GET /api/admin/users
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "approved": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### **Export All Todos (Admin)**
```http
GET /api/admin/export-todos
```

**Response:** File download with all todos from all users

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Todos Table**
```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  user_id INTEGER REFERENCES users(id),
  due_date TIMESTAMP,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### **Vercel (Recommended)**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### **Other Platforms**
The application can be deployed on any platform that supports Node.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── todos/            # Todo-related components
│   ├── ui/               # Reusable UI components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── db/              # Database configuration
│   ├── auth.ts          # NextAuth configuration
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # Helper functions
└── types/               # TypeScript type definitions
```

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Pusher](https://pusher.com/) for real-time functionality

---

**Built with ❤️ using Next.js 14+ and modern web technologies**
