-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yesterdayAccomplishments" TEXT NOT NULL,
    "todayGoals" TEXT NOT NULL,
    "blockers" TEXT,
    "mood" TEXT NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "daily_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "daily_checkins_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyCheckinId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "statusUpdate" TEXT NOT NULL,
    "hoursWorked" REAL,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_updates_dailyCheckinId_fkey" FOREIGN KEY ("dailyCheckinId") REFERENCES "daily_checkins" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_updates_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_checkins_userId_teamId_date_key" ON "daily_checkins"("userId", "teamId", "date");
