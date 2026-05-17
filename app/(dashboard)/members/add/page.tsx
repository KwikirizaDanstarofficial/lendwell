import { AddMemberForm } from "./add-member-form"

export default function AddMemberPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details to register a new member
        </p>
      </div>
      <AddMemberForm />
    </div>
  )
}