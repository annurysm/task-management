-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" REAL NOT NULL DEFAULT 0,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kanban_columns_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "kanban_columns_status_key" ON "kanban_columns"("status");
