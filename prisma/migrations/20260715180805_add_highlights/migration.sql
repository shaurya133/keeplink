-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Highlight_userId_idx" ON "Highlight"("userId");

-- CreateIndex
CREATE INDEX "Highlight_linkId_idx" ON "Highlight"("linkId");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
