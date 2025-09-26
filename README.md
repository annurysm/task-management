# Task Management Application

A comprehensive task management system built for product design teams with Kanban boards, epic tracking, objectives planning, and team collaboration features.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [API Routes](#api-routes)
- [Authentication](#authentication)
- [Theme System](#theme-system)
- [Development](#development)
- [Deployment](#deployment)

## 🎯 Overview

This is a full-stack task management application designed specifically for product design teams. It provides a comprehensive solution for managing tasks, epics, objectives, and team collaboration through an intuitive web interface.

### Key Capabilities
- **Multi-organizational structure** with teams and role-based access
- **Kanban board** with drag-and-drop functionality
- **Epic management** for large feature planning
- **Objectives and OKR tracking** with weekly planning
- **Real-time collaboration** via WebSocket connections
- **Advanced filtering and labeling** system
- **Analytics and reporting** dashboards
- **Dark/Light theme** with Catalyst-inspired design

## 🛠 Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling with custom design system
- **@dnd-kit** - Drag and drop functionality
- **Lucide React** - Icon system
- **Socket.io Client** - Real-time communication

### Backend
- **Next.js API Routes** - Backend API
- **Prisma 6.0.1** - Database ORM
- **SQLite** - Database (easily switchable to PostgreSQL)
- **NextAuth.js 5.0** - Authentication
- **Socket.io** - Real-time server
- **Custom server.js** - Express server for Socket.io integration

### Development & Testing
- **ESLint** - Code linting
- **Playwright** - End-to-end testing
- **Prisma Studio** - Database GUI

## ✨ Features

### 🏢 Organization Management
- Create and manage multiple organizations
- Role-based access control (Owner, Admin, Member)
- Team creation and management within organizations
- Invite system for team members

### 📋 Task Management
- **Kanban Board**: Drag-and-drop task management with customizable columns
- **Task Details**: Rich task information with descriptions, priorities, estimates
- **Subtasks**: Hierarchical task breakdown
- **Labels**: Color-coded categorization system
- **Assignees**: User assignment with profile images
- **Status Tracking**: Comprehensive status workflow (Backlog → Todo → In Progress → In Review → On Hold → Done)
- **Priority System**: Low, Medium, High, Urgent prioritization

### 🎯 Epic Management
- Create and manage large features/initiatives
- Track epic progress with task completion metrics
- Epic-to-task relationships
- Epic status workflow (Planning → In Progress → On Hold → Completed → Cancelled)
- Due date tracking
- Epic details modal with comprehensive overview

### 📊 Objectives & OKR
- Create organizational objectives
- Link tasks and epics to objectives
- **Weekly Planning**: Schedule tasks for specific weeks
- **Commitment Tracking**: Mark tasks as committed vs. planned
- **Team Assignment**: Assign objective tasks to specific teams
- **Weekly Sync Planning**: Dedicated view for planning weekly syncs

### 🎨 User Interface
- **Dark/Light Theme**: Toggle with system preference detection
- **Catalyst-inspired Design**: Modern, dark theme with zinc color palette
- **Orange Accent Colors**: Professional orange-based accent system
- **Responsive Design**: Mobile-first responsive interface
- **Modal System**: Comprehensive modal system with black transparent overlays
- **Real-time Updates**: Live updates via WebSocket connections

### 📈 Analytics
- Task completion metrics
- Team performance tracking
- Epic progress visualization
- Activity logging and tracking

## 🗄 Database Schema

### Core Entities

#### **User Management**
```prisma
User {
  id, name, email, image
  organizations: OrganizationMember[]
  teams: TeamMember[]
  assignedTasks: Task[]
  createdTasks: Task[]
  createdEpics: Epic[]
}

Organization {
  id, name, description
  members: OrganizationMember[]
  teams: Team[]
  epics: Epic[]
  labels: Label[]
  objectives: Objective[]
}

Team {
  id, name, description, organizationId
  members: TeamMember[]
  epics: Epic[]
  tasks: Task[]
  kanbanColumns: KanbanColumn[]
}
```

#### **Task Management**
```prisma
Task {
  id, title, description
  status: TaskStatus (BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, ON_HOLD, DONE)
  priority: Priority (LOW, MEDIUM, HIGH, URGENT)
  estimation: Float (hours)
  teamId, epicId?, assigneeId?, createdById
  subtasks: Subtask[]
  labels: TaskLabel[]
}

Epic {
  id, title, description
  status: EpicStatus (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
  organizationId, teamId?, createdById
  dueDate?
  tasks: Task[]
}

Subtask {
  id, title, description
  status: SubtaskStatus (TODO, IN_PROGRESS, DONE)
  estimation: Float
  taskId, assigneeId?
}
```

#### **Planning & Organization**
```prisma
Objective {
  id, title, description, organizationId
  tasks: ObjectiveTask[]
  weeklySyncs: WeeklySync[]
}

ObjectiveTask {
  objectiveId, taskId?, epicId?
  weekStartDate?, weekPriority?
  assignedTeam?, isCommitted: Boolean
}

Label {
  id, name, color (hex), organizationId
  tasks: TaskLabel[]
  subtasks: SubtaskLabel[]
}

KanbanColumn {
  id, title, status, color, position, teamId
}
```

### **Relationships**
- **Organizations** contain **Teams** and **Users** (many-to-many via OrganizationMember)
- **Teams** contain **Users** (many-to-many via TeamMember) and **Tasks**
- **Epics** belong to **Organizations** and optionally to **Teams**
- **Tasks** belong to **Teams** and optionally to **Epics**
- **Tasks** can be assigned to **Users** and have multiple **Labels**
- **Objectives** belong to **Organizations** and link to **Tasks** or **Epics**

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── tasks/                # Task CRUD operations
│   │   ├── epics/                # Epic management
│   │   ├── teams/                # Team management
│   │   ├── organizations/        # Organization operations
│   │   ├── objectives/           # Objectives and OKR
│   │   ├── labels/               # Label management
│   │   └── proxy/                # Image proxy for Google avatars
│   ├── dashboard/                # Dashboard pages
│   │   ├── page.tsx              # Main dashboard
│   │   ├── kanban/               # All tasks Kanban view
│   │   ├── weekly-planning/      # Weekly OKR planning
│   │   ├── objectives/           # Objectives management
│   │   ├── teams/                # Team pages
│   │   │   └── [id]/             # Team-specific pages
│   │   │       ├── kanban/       # Team Kanban board
│   │   │       ├── analytics/    # Team analytics
│   │   │       └── settings/     # Team settings
│   │   ├── epics/                # Epic management
│   │   ├── labels/               # Label management
│   │   └── organization/         # Organization settings
│   ├── globals.css               # Global styles & theme variables
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── analytics/                # Analytics dashboards
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard layout components
│   │   ├── dashboard-layout.tsx  # Main layout with sidebar
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   └── header.tsx            # Top header with user menu
│   ├── epics/                    # Epic management components
│   │   ├── epics-dashboard.tsx   # Epic list view
│   │   ├── epic-card.tsx         # Epic card component
│   │   ├── epic-details-modal.tsx # Epic details & editing
│   │   └── create-epic-modal.tsx # Epic creation
│   ├── kanban/                   # Kanban board components
│   │   ├── kanban-board.tsx      # Team-specific Kanban
│   │   ├── master-kanban-view.tsx # All tasks Kanban with filters
│   │   ├── kanban-column.tsx     # Droppable column component
│   │   ├── task-card.tsx         # Individual task display
│   │   ├── draggable-task-card.tsx # Draggable wrapper for DnD
│   │   ├── task-details-modal.tsx # Task details & editing
│   │   ├── create-task-modal.tsx # Task creation
│   │   └── column-settings-modal.tsx # Custom column setup
│   ├── labels/                   # Label management
│   ├── objectives/               # Objectives & OKR components
│   │   ├── objectives-dashboard.tsx # Objectives list
│   │   ├── objective-card.tsx    # Objective display
│   │   ├── create-objective-modal.tsx # Objective creation
│   │   └── weekly-planning-modal.tsx # Weekly task planning
│   ├── organization/             # Organization management
│   ├── teams/                    # Team management components
│   ├── ui/                       # Reusable UI components
│   │   ├── theme-toggle.tsx      # Dark/light theme switcher
│   │   └── real-time-notifications.tsx # Socket.io notifications
│   └── weekly-planning/          # Weekly planning components
│       └── weekly-planning-dashboard.tsx # Weekly sync view
├── contexts/                     # React contexts
│   ├── theme-context.tsx         # Theme state management
│   └── socket-context.tsx        # WebSocket connection
├── lib/                          # Utility libraries
└── types/                        # TypeScript type definitions
```

## 🧩 Key Components

### **Dashboard Layout** (`components/dashboard/`)
- **`dashboard-layout.tsx`**: Main layout wrapper with sidebar and header
- **`sidebar.tsx`**: Navigation sidebar with orange accent colors
- **`header.tsx`**: Top header with user profile, search, and theme toggle

### **Kanban System** (`components/kanban/`)
- **`kanban-board.tsx`**: Team-specific Kanban with drag-and-drop using @dnd-kit
- **`master-kanban-view.tsx`**: Organization-wide task view with advanced filtering
- **`task-card.tsx`**: Displays task information with priority, assignee, labels
- **`task-details-modal.tsx`**: Comprehensive task editing with epic linking

### **Epic Management** (`components/epics/`)
- **`epic-details-modal.tsx`**: Full epic view with task list, progress tracking
- **`epic-card.tsx`**: Epic summary with completion metrics
- **Clickable Navigation**: Tasks in epics link to task details, epics in tasks link to epic details

### **Objectives & Planning** (`components/objectives/`, `components/weekly-planning/`)
- **`objectives-dashboard.tsx`**: OKR management interface
- **`weekly-planning-dashboard.tsx`**: Weekly sync planning with team organization
- **`weekly-planning-modal.tsx`**: Task scheduling for specific weeks

### **Modal System**
All modals use consistent styling:
- **Black transparent overlays** (`bg-black/60`)
- **Zinc-based dark backgrounds** (`dark:bg-zinc-900`)
- **Orange accent colors** for actions and focus states
- **Responsive design** with proper mobile handling

## 🛡 API Routes

### **Authentication** (`/api/auth/`)
- NextAuth.js integration with Google OAuth
- Session management and user creation

### **Core Resources**
```
/api/tasks/              # Task CRUD operations
├── GET, POST            # List tasks, create task
├── [id]/               # Individual task operations
│   ├── GET, PUT, DELETE # Get, update, delete task
│   ├── labels/         # Task label management
│   └── subtasks/       # Subtask operations

/api/epics/             # Epic management
├── GET, POST           # List epics, create epic
└── [id]/              # Individual epic operations

/api/teams/             # Team management
├── GET, POST           # List teams, create team
├── [id]/              # Individual team operations
│   ├── columns/       # Custom Kanban columns
│   ├── members/       # Team membership
│   └── invites/       # Team invitations

/api/organizations/     # Organization management
├── GET, POST           # List orgs, create org
└── [id]/              # Individual org operations

/api/objectives/        # Objectives and OKR
├── GET, POST           # List objectives, create objective
└── [id]/              # Individual objective operations

/api/labels/            # Label management
/api/proxy/image/       # Google avatar image proxy
```

### **WebSocket Events** (Socket.io)
- **Task updates**: Real-time task status changes
- **Epic progress**: Live epic completion updates
- **Team notifications**: Member activity notifications
- **Objective changes**: Weekly planning updates

## 🔐 Authentication

### **NextAuth.js Configuration**
- **Provider**: Google OAuth 2.0
- **Database Adapter**: Prisma adapter for user sessions
- **Session Strategy**: Database sessions for security
- **User Creation**: Automatic user creation on first login

### **Authorization Patterns**
- **Organization-level**: Owner, Admin, Member roles
- **Team-level**: Lead, Member roles
- **Route Protection**: Server-side session validation
- **Client-side**: Session hooks for UI state

## 🎨 Theme System

### **Color Palette**
The application uses a sophisticated Catalyst-inspired dark theme:

```css
/* Dark Theme (Primary) */
--background: #0c0c0c;          /* Very dark main background */
--card: #18181b;                /* Zinc-900 for cards/modals */
--border: #27272a;              /* Zinc-800 for borders */
--foreground: #f4f4f5;          /* Zinc-100 for primary text */
--muted-foreground: #a1a1aa;    /* Zinc-400 for secondary text */
--primary: #f97316;             /* Orange-500 for accents */
--ring: #f97316;                /* Orange focus rings */

/* Light Theme */
--background: #ffffff;
--card: #ffffff;
--border: #e5e7eb;
--foreground: #171717;
--primary: #4f46e5;             /* Indigo for light mode */
```

### **Component Styling Patterns**
- **Main Layout**: `dark:bg-zinc-950` (almost black)
- **Sidebar**: `dark:bg-zinc-900` (slightly lighter for contrast)
- **Cards/Modals**: `dark:bg-zinc-900` with `dark:border-zinc-700`
- **Buttons**: Orange accent colors with hover states
- **Text**: `dark:text-zinc-100` (primary), `dark:text-zinc-400` (secondary)

### **Modal Overlays**
All modals use `bg-black/60` for consistent transparent black overlays.

## 🚀 Development

### **Prerequisites**
- Node.js 18+
- npm or yarn
- SQLite (included) or PostgreSQL (optional)

### **Setup**
```bash
# Clone repository
git clone <repository-url>
cd task-management-app

# Install dependencies
npm install

# Setup database
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name "init"
DATABASE_URL="file:./dev.db" npx prisma generate

# Start development server
npm run dev

# Start Prisma Studio (optional)
DATABASE_URL="file:./dev.db" npx prisma studio --port 5555
```

### **Environment Variables**
Create `.env.local`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### **Development Scripts**
```bash
npm run dev         # Start development server with Socket.io
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run test        # Run Playwright tests
npm run test:ui     # Run tests with UI
```

### **Database Operations**
```bash
# Reset database
DATABASE_URL="file:./dev.db" npx prisma migrate reset --force

# Generate Prisma client
DATABASE_URL="file:./dev.db" npx prisma generate

# Create new migration
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name "migration-name"

# Push schema changes without migration
DATABASE_URL="file:./dev.db" npx prisma db push
```

## 📦 Deployment

### **Production Configuration**
1. **Database**: Switch to PostgreSQL for production
2. **Environment**: Set production environment variables
3. **Build**: Run `npm run build`
4. **Server**: Use `npm run start` or deploy to Vercel/similar

### **Key Deployment Considerations**
- **Socket.io**: Requires custom server (server.js)
- **Image Proxy**: Google avatar proxy route
- **Database**: SQLite for development, PostgreSQL for production
- **Real-time**: WebSocket connections need proper server setup

## 🔧 Technical Notes

### **Real-time Features**
- Socket.io integration with custom Express server
- Real-time task updates across team members
- Live epic progress updates
- Notification system for team activities

### **Drag and Drop**
- @dnd-kit library for accessible drag-and-drop
- Optimistic updates with error handling
- Visual feedback during drag operations
- Touch/mobile support included

### **Performance Optimizations**
- React 19 with latest optimizations
- Efficient re-rendering with proper state management
- Image optimization for user avatars
- Lazy loading for large task lists

### **Accessibility**
- Keyboard navigation support
- Screen reader compatible
- High contrast color schemes
- Focus management in modals

---

## 📝 Notes for Future Development

### **Code Quality**
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Playwright for end-to-end testing
- Component-based architecture with clear separation

### **Extensibility**
- Modular component structure
- API-first design for easy mobile app addition
- Plugin-ready architecture for additional features
- Theme system built for easy customization

### **Common Development Patterns**
- Use `TodoWrite` tool for task tracking during development
- Follow existing component patterns for consistency
- Maintain the zinc-based dark theme color scheme
- Use orange accent colors for primary actions
- Keep modal overlays as `bg-black/60`
- Follow the established file naming conventions

This documentation provides a comprehensive understanding of the application architecture, features, and development practices for future AI assistants and developers.
