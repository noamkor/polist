-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyRelationType" AS ENUM ('SPOUSE', 'PARENT', 'CHILD', 'SIBLING');

-- CreateEnum
CREATE TYPE "InsuranceCategory" AS ENUM ('VEHICLE', 'HOME', 'BUSINESS', 'HEALTH', 'PENSION');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender",
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "notes" TEXT,
    "driverLicensePath" TEXT,
    "idDocumentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'נייד',
    "clientId" TEXT NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyRelation" (
    "id" TEXT NOT NULL,
    "clientAId" TEXT NOT NULL,
    "clientBId" TEXT NOT NULL,
    "relationType" "FamilyRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInsurance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "provider" TEXT,
    "policyNumber" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "notes" TEXT,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Home" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeInsurance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "provider" TEXT,
    "policyNumber" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "notes" TEXT,
    "homeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInsurance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "provider" TEXT,
    "policyNumber" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "notes" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthPolicy" (
    "id" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "provider" TEXT,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthInsurance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "policyNumber" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "notes" TEXT,
    "healthPolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PensionPolicy" (
    "id" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "provider" TEXT,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PensionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PensionInsurance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "policyNumber" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "notes" TEXT,
    "pensionPolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PensionInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" "InsuranceCategory",
    "clientId" TEXT,
    "vehicleInsuranceId" TEXT,
    "homeInsuranceId" TEXT,
    "businessInsuranceId" TEXT,
    "healthInsuranceId" TEXT,
    "pensionInsuranceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "PhoneNumber_clientId_idx" ON "PhoneNumber"("clientId");

-- CreateIndex
CREATE INDEX "FamilyRelation_clientBId_idx" ON "FamilyRelation"("clientBId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyRelation_clientAId_clientBId_key" ON "FamilyRelation"("clientAId", "clientBId");

-- CreateIndex
CREATE INDEX "Vehicle_clientId_idx" ON "Vehicle"("clientId");

-- CreateIndex
CREATE INDEX "VehicleInsurance_vehicleId_idx" ON "VehicleInsurance"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleInsurance_vehicleId_year_key" ON "VehicleInsurance"("vehicleId", "year");

-- CreateIndex
CREATE INDEX "Home_clientId_idx" ON "Home"("clientId");

-- CreateIndex
CREATE INDEX "HomeInsurance_homeId_idx" ON "HomeInsurance"("homeId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeInsurance_homeId_year_key" ON "HomeInsurance"("homeId", "year");

-- CreateIndex
CREATE INDEX "Business_clientId_idx" ON "Business"("clientId");

-- CreateIndex
CREATE INDEX "BusinessInsurance_businessId_idx" ON "BusinessInsurance"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInsurance_businessId_year_key" ON "BusinessInsurance"("businessId", "year");

-- CreateIndex
CREATE INDEX "HealthPolicy_clientId_idx" ON "HealthPolicy"("clientId");

-- CreateIndex
CREATE INDEX "HealthInsurance_healthPolicyId_idx" ON "HealthInsurance"("healthPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthInsurance_healthPolicyId_year_key" ON "HealthInsurance"("healthPolicyId", "year");

-- CreateIndex
CREATE INDEX "PensionPolicy_clientId_idx" ON "PensionPolicy"("clientId");

-- CreateIndex
CREATE INDEX "PensionInsurance_pensionPolicyId_idx" ON "PensionInsurance"("pensionPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "PensionInsurance_pensionPolicyId_year_key" ON "PensionInsurance"("pensionPolicyId", "year");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_vehicleInsuranceId_idx" ON "Document"("vehicleInsuranceId");

-- CreateIndex
CREATE INDEX "Document_homeInsuranceId_idx" ON "Document"("homeInsuranceId");

-- CreateIndex
CREATE INDEX "Document_businessInsuranceId_idx" ON "Document"("businessInsuranceId");

-- CreateIndex
CREATE INDEX "Document_healthInsuranceId_idx" ON "Document"("healthInsuranceId");

-- CreateIndex
CREATE INDEX "Document_pensionInsuranceId_idx" ON "Document"("pensionInsuranceId");

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyRelation" ADD CONSTRAINT "FamilyRelation_clientAId_fkey" FOREIGN KEY ("clientAId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyRelation" ADD CONSTRAINT "FamilyRelation_clientBId_fkey" FOREIGN KEY ("clientBId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInsurance" ADD CONSTRAINT "VehicleInsurance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Home" ADD CONSTRAINT "Home_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeInsurance" ADD CONSTRAINT "HomeInsurance_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInsurance" ADD CONSTRAINT "BusinessInsurance_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPolicy" ADD CONSTRAINT "HealthPolicy_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthInsurance" ADD CONSTRAINT "HealthInsurance_healthPolicyId_fkey" FOREIGN KEY ("healthPolicyId") REFERENCES "HealthPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensionPolicy" ADD CONSTRAINT "PensionPolicy_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensionInsurance" ADD CONSTRAINT "PensionInsurance_pensionPolicyId_fkey" FOREIGN KEY ("pensionPolicyId") REFERENCES "PensionPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vehicleInsuranceId_fkey" FOREIGN KEY ("vehicleInsuranceId") REFERENCES "VehicleInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_homeInsuranceId_fkey" FOREIGN KEY ("homeInsuranceId") REFERENCES "HomeInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_businessInsuranceId_fkey" FOREIGN KEY ("businessInsuranceId") REFERENCES "BusinessInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_healthInsuranceId_fkey" FOREIGN KEY ("healthInsuranceId") REFERENCES "HealthInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_pensionInsuranceId_fkey" FOREIGN KEY ("pensionInsuranceId") REFERENCES "PensionInsurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
