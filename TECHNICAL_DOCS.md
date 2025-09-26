# Technical Implementation Guide

This document provides detailed technical information for developers and AI assistants working on the task management application.

## 🔧 Component Architecture

### Modal System Implementation

All modals in the application follow a consistent pattern:

#### **Modal Wrapper Pattern**
```tsx
// Standard modal overlay structure
<div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
  <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-zinc-900">
    {/* Modal content */}
  </div>
</div>
```

#### **Key Modal Components**
- **TaskDetailsModal**: `src/components/kanban/task-details-modal.tsx`
- **EpicDetailsModal**: `src/components/epics/epic-details-modal.tsx`
- **CreateTaskModal**: `src/components/kanban/create-task-modal.tsx`
- **CreateEpicModal**: `src/components/epics/create-epic-modal.tsx`

### Drag and Drop Implementation

Uses `@dnd-kit` library for accessible drag-and-drop:

```tsx
// DnD Context setup in kanban-board.tsx
<DndContext 
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {/* Droppable columns */}
  <DragOverlay>
    {/* Visual feedback during drag */}
  </DragOverlay>
</DndContext>
```

#### **Key DnD Files**
- **Main DnD Logic**: `src/components/kanban/kanban-board.tsx`
- **Draggable Cards**: `src/components/kanban/draggable-task-card.tsx`
- **Droppable Columns**: `src/components/kanban/kanban-column.tsx`

## 🎨 Theme System Architecture

### CSS Variable Structure

Located in `src/app/globals.css`:

```css
:root {
  /* Light theme variables */
  --background: #ffffff;
  --foreground: #171717;
  --primary: #4f46e5;
  /* ... other variables */
}

.dark {
  /* Dark theme variables */
  --background: #0c0c0c;
  --foreground: #f4f4f5;
  --primary: #f97316;
  /* ... other variables */
}

@theme {
  /* Tailwind CSS integration */
  --color-background: var(--background);
  /* ... mapped variables */
}
```

### Component Styling Patterns

#### **Standard Background Classes**
- **Main content**: `bg-background` (uses CSS variable)
- **Cards/Modals**: `bg-white dark:bg-zinc-900`
- **Sidebar**: `bg-white dark:bg-zinc-900`
- **Hover states**: `hover:bg-gray-50 dark:hover:bg-zinc-800`

#### **Text Color Classes**
- **Primary text**: `text-foreground` or `text-gray-900 dark:text-zinc-100`
- **Secondary text**: `text-muted-foreground` or `text-gray-600 dark:text-zinc-400`
- **Muted text**: `text-gray-500 dark:text-zinc-500`

#### **Border Classes**
- **Standard borders**: `border-border` or `border-gray-200 dark:border-zinc-700`
- **Input borders**: `border-input` or `border-gray-300 dark:border-zinc-600`

## 🗄 Database Implementation Details

### Prisma Schema Key Patterns

#### **Relationship Patterns**
```prisma
// Many-to-many with join table
model TeamMember {
  userId    String
  teamId    String
  role      TeamRole
  user      User @relation(fields: [userId], references: [id])
  team      Team @relation(fields: [teamId], references: [id])
  @@unique([userId, teamId])
}

// Optional foreign key
model Task {
  epicId    String?
  epic      Epic? @relation(fields: [epicId], references: [id])
}

// Cascade delete
model Task {
  teamId    String
  team      Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
}
```

#### **Enum Usage**
```prisma
enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  IN_REVIEW
  ON_HOLD
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### API Route Patterns

#### **Standard CRUD Pattern**
```typescript
// GET /api/tasks - List with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  
  const tasks = await prisma.task.findMany({
    where: teamId ? { teamId } : {},
    include: {
      assignee: true,
      epic: true,
      labels: { include: { label: true } }
    }
  })
  
  return NextResponse.json(tasks)
}

// POST /api/tasks - Create
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const task = await prisma.task.create({
    data: body,
    include: {
      assignee: true,
      epic: true,
      labels: { include: { label: true } }
    }
  })
  
  return NextResponse.json(task)
}
```

#### **Dynamic Route Pattern**
```typescript
// PUT /api/tasks/[id] - Update
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const { id } = params
  
  const task = await prisma.task.update({
    where: { id },
    data: body,
    include: {
      assignee: true,
      epic: true,
      labels: { include: { label: true } }
    }
  })
  
  return NextResponse.json(task)
}
```

## 🔐 Authentication Implementation

### NextAuth.js Configuration

Located in `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "database"
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    }
  }
}
```

### Session Usage Pattern

```typescript
// Server component
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function Page() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return <div>Welcome {session.user?.name}</div>
}

// Client component
import { useSession } from "next-auth/react"

export function Component() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>
  
  return <div>Welcome {session.user?.name}</div>
}
```

## ⚡ Real-time Implementation

### Socket.io Server Setup

Located in `server.js`:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true))
  })
  
  const io = new Server(server)
  
  io.on('connection', (socket) => {
    console.log('User connected')
    
    socket.on('join-team', (teamId) => {
      socket.join(`team-${teamId}`)
    })
    
    socket.on('task-update', (data) => {
      socket.to(`team-${data.teamId}`).emit('task-updated', data)
    })
  })
  
  server.listen(3000)
})
```

### Client Socket Integration

Located in `src/contexts/socket-context.tsx`:

```typescript
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io()
    
    socketInstance.on('connect', () => {
      setIsConnected(true)
    })
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })
    
    setSocket(socketInstance)
    
    return () => socketInstance.close()
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
```

## 🔍 Filtering System Implementation

### Master Kanban Filters

Located in `src/components/kanban/master-kanban-view.tsx`:

```typescript
const [filters, setFilters] = useState({
  team: '',
  assignee: '',
  priority: ''
})

const [assignees, setAssignees] = useState<User[]>([])

// Extract unique assignees from tasks
useEffect(() => {
  const uniqueAssignees = tasks
    .filter(task => task.assignee)
    .reduce((acc, task) => {
      if (!acc.find(a => a.id === task.assignee!.id)) {
        acc.push(task.assignee!)
      }
      return acc
    }, [] as User[])
  
  setAssignees(uniqueAssignees)
}, [tasks])

// Apply filters
const getTasksByStatus = (status: string) => {
  return tasks.filter(task => {
    if (task.status !== status) return false
    
    if (filters.team && task.team?.name !== filters.team) return false
    
    if (filters.assignee) {
      if (filters.assignee === 'unassigned' && task.assignee) return false
      if (filters.assignee !== 'unassigned' && task.assignee?.id !== filters.assignee) return false
    }
    
    if (filters.priority && task.priority !== filters.priority) return false
    
    return true
  })
}
```

## 🎯 Epic-Task Relationship Implementation

### Clickable Navigation Pattern

```typescript
// In TaskDetailsModal
const [showEpicDetails, setShowEpicDetails] = useState(false)

// Epic section with click handler
<div 
  className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
  onClick={() => setShowEpicDetails(true)}
>
  <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
  <div className="flex-1">
    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
      {task.epic.title}
    </p>
    <p className="text-xs text-purple-600 dark:text-purple-400">
      Status: {task.epic.status.replace('_', ' ').toLowerCase()}
    </p>
  </div>
  <ExternalLink className="h-4 w-4 text-purple-500 dark:text-purple-400" />
</div>

// Render epic details modal
{showEpicDetails && task.epic && (
  <EpicDetailsModal
    epicId={task.epic.id}
    onClose={() => setShowEpicDetails(false)}
    // ... other props
  />
)}
```

### Epic Progress Calculation

```typescript
// In EpicDetailsModal
const totalTasks = epic.tasks.length
const completedTasks = epic.tasks.filter(task => task.status === 'DONE').length
const totalSubtasks = epic.tasks.reduce((acc, task) => acc + task.subtasks.length, 0)
const completedSubtasks = epic.tasks.reduce((acc, task) => 
  acc + task.subtasks.filter(subtask => subtask.status === 'DONE').length, 0)

const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
```

## 📊 Weekly Planning Implementation

### Week Calculation Functions

```typescript
const getWeekStart = (date: Date) => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

const getWeekEnd = (date: Date) => {
  const end = new Date(date)
  const day = end.getDay()
  const diff = end.getDate() - day + 6
  end.setDate(diff)
  end.setHours(23, 59, 59, 999)
  return end
}

const formatWeekRange = (date: Date) => {
  const start = getWeekStart(date)
  const end = getWeekEnd(date)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
```

### Weekly Task Filtering

```typescript
const getWeeklyTasks = () => {
  const weekStart = getWeekStart(currentWeek)
  const weekStartISO = weekStart.toISOString().split('T')[0]
  
  const weeklyTasks: { [teamName: string]: any[] } = {}
  
  objectives.forEach(objective => {
    objective.tasks.forEach(objTask => {
      if (objTask.weekStartDate && objTask.task) {
        const taskWeekStartISO = new Date(objTask.weekStartDate).toISOString().split('T')[0]
        
        if (taskWeekStartISO === weekStartISO) {
          const teamName = objTask.assignedTeam || objTask.task.team?.name || 'Unassigned'
          if (!weeklyTasks[teamName]) {
            weeklyTasks[teamName] = []
          }
          weeklyTasks[teamName].push({
            ...objTask,
            objectiveTitle: objective.title
          })
        }
      }
    })
  })
  
  return weeklyTasks
}
```

## 🖼 Image Proxy Implementation

For Google OAuth profile images:

```typescript
// /api/proxy/image/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url || !url.startsWith('https://lh3.googleusercontent.com/')) {
    return new NextResponse('Invalid URL', { status: 400 })
  }
  
  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // 24 hours
      },
    })
  } catch (error) {
    return new NextResponse('Image fetch failed', { status: 500 })
  }
}
```

Usage in components:
```typescript
const avatarSrc = assignee.image?.startsWith('https://lh3.googleusercontent.com/')
  ? `/api/proxy/image?url=${encodeURIComponent(assignee.image)}`
  : assignee.image || '/default-avatar.svg'
```

## 🧪 Testing Implementation

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test Examples

```typescript
// tests/kanban.spec.ts
import { test, expect } from '@playwright/test'

test('can create and move tasks', async ({ page }) => {
  await page.goto('/dashboard/kanban')
  
  // Create task
  await page.click('[data-testid="create-task-button"]')
  await page.fill('[data-testid="task-title"]', 'Test Task')
  await page.click('[data-testid="submit-task"]')
  
  // Verify task appears
  await expect(page.locator('[data-testid="task-card"]')).toContainText('Test Task')
  
  // Test drag and drop
  await page.dragAndDrop(
    '[data-testid="task-card"]:has-text("Test Task")',
    '[data-testid="column-IN_PROGRESS"]'
  )
  
  // Verify task moved
  await expect(page.locator('[data-testid="column-IN_PROGRESS"] [data-testid="task-card"]'))
    .toContainText('Test Task')
})
```

## 🚀 Deployment Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanagement"

# Authentication
NEXTAUTH_SECRET="your-very-long-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional
NODE_ENV="production"
```

### Production Build

```bash
# Build application
npm run build

# Start production server
npm run start
```

### Docker Configuration (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 📋 Common Development Tasks

### Adding a New Modal

1. Create modal component in appropriate directory
2. Follow standard modal overlay pattern (`bg-black/60`)
3. Use zinc-based dark theme colors
4. Add proper TypeScript interfaces
5. Implement proper state management
6. Add close handlers and keyboard navigation

### Adding a New API Route

1. Create route file in `src/app/api/`
2. Follow standard CRUD patterns
3. Add proper error handling
4. Include necessary Prisma relations
5. Add proper TypeScript types
6. Test with Prisma Studio

### Adding New Database Models

1. Update `prisma/schema.prisma`
2. Run migration: `npx prisma migrate dev --name "description"`
3. Update TypeScript types
4. Create API routes
5. Build UI components
6. Test thoroughly

### Styling New Components

1. Use CSS variables where possible
2. Follow established dark theme patterns
3. Use orange accent colors for primary actions
4. Maintain responsive design principles
5. Test in both light and dark modes
6. Ensure proper accessibility

This technical guide provides the implementation details needed to understand and extend the application's functionality.