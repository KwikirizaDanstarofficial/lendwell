import { db } from "../db"
import { saccoUsers } from "../db/schema"
import fs from "fs"

async function exportUsers() {
  const users = await db.select().from(saccoUsers)

  let md = "# SACCO Users\n\n"

  md += "| Full Name | Email | Phone | Role | Active | Created At |\n"
  md += "|-----------|-------|-------|------|--------|------------|\n"

  for (const user of users) {
    md += `| ${user.full_name} | ${user.email} | ${user.phone || ""} | ${user.role} | ${user.is_active ? "Yes" : "No"} | ${user.created_at?.toISOString().split("T")[0] || ""} |\n`
  }

  fs.writeFileSync("users.md", md)
  console.log("Exported users to users.md")
}

exportUsers().catch(console.error)
