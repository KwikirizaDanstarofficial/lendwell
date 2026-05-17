import { db } from "../db"
import { saccoUsers } from "../db/schema"
import bcrypt from "bcryptjs"

const SACCO_ID = "550e8400-e29b-41d4-a716-446655440000"

async function addUser() {
  const password = "password" // Change this to the desired password
  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(saccoUsers).values({
    sacco_id: SACCO_ID,
    full_name: "dan",
    email: "dan@12",
    phone: null,
    password_hash: passwordHash,
    role: "admin",
    is_active: true,
    must_change_password: false,
  })

  console.log("User added successfully")
}

addUser().catch(console.error)
