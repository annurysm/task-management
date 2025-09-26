-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "epics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "epics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "epics_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "epics_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimation" REAL,
    "position" REAL NOT NULL DEFAULT 0,
    "teamId" TEXT NOT NULL,
    "epicId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "epics" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "estimation" REAL,
    "position" REAL NOT NULL DEFAULT 0,
    "taskId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subtasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subtasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "labels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_labels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "task_labels_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtask_labels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subtaskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "subtask_labels_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "subtasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subtask_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "objectives_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "objective_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT NOT NULL,
    "taskId" TEXT,
    "epicId" TEXT,
    "weekStartDate" DATETIME,
    "weekPriority" INTEGER,
    "assignedTeam" TEXT,
    "isCommitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "objective_tasks_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "objective_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "objective_tasks_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "epics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weekly_syncs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "notes" TEXT,
    "attendees" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weekly_syncs_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "subtasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_organizationId_key" ON "organization_members"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_teamId_key" ON "team_members"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "labels_name_organizationId_key" ON "labels"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "task_labels_taskId_labelId_key" ON "task_labels"("taskId", "labelId");

-- CreateIndex
CREATE UNIQUE INDEX "subtask_labels_subtaskId_labelId_key" ON "subtask_labels"("subtaskId", "labelId");
