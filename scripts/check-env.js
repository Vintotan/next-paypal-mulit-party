#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config();

console.log("Checking Clerk environment variables...");

const requiredVars = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"];

const missingVars = [];

// Check for missing environment variables
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    // Check if the key looks valid
    const value = process.env[varName];
    if (
      (varName === "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" &&
        !value.startsWith("pk_")) ||
      (varName === "CLERK_SECRET_KEY" && !value.startsWith("sk_"))
    ) {
      console.log(`⚠️ Warning: ${varName} does not have the expected format.`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }
}

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  for (const varName of missingVars) {
    console.error(`   ${varName}`);
  }
  process.exit(1);
}

// Read the .env file directly to check for any issues
try {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");

  // Check for common formatting issues
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.trim() === "" || line.startsWith("#")) continue;

    // Check for missing quotes around values
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [_, key, value] = match;
      if (
        (key.trim() === "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ||
          key.trim() === "CLERK_SECRET_KEY") &&
        !value.startsWith('"') &&
        !value.endsWith('"')
      ) {
        console.log(
          `⚠️ Warning: Value for ${key.trim()} is missing quotes, which might cause issues.`,
        );
      }
    }
  }

  console.log("✅ Environment file format looks good");
} catch (err) {
  console.error("❌ Error reading .env file:", err.message);
}

console.log("Environment check completed.");
