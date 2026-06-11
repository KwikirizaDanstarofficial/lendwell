"use client"
import { useQuery } from "@powersync/react"
import { Loader2 } from "lucide-react"
import { EditMemberForm } from "./edit-member-form"

function toMember(m: any) {
  return {
    id: m.id, saccoId: m.sacco_id, memberCode: m.member_code, fullName: m.full_name,
    email: m.email, phone: m.phone, nationalId: m.national_id, photoUrl: m.photo_url,
    dateOfBirth: m.date_of_birth, address: m.address, nextOfKin: m.next_of_kin,
    nextOfKinPhone: m.next_of_kin_phone, nextOfKinRelationship: m.next_of_kin_relationship,
    nextOfKinAddress: m.next_of_kin_address, status: m.status,
    joinedAt: m.joined_at ? new Date(m.joined_at) : null,
    createdAt: m.created_at ? new Date(m.created_at) : null,
    updatedAt: m.updated_at ? new Date(m.updated_at) : null,
  }
}

export function EditPageClient({ id, initialMember }: { id: string; initialMember?: any }) {
  const { data: rows = [], isLoading: loading } = useQuery("SELECT * FROM members WHERE id = ? LIMIT 1", [id])
  const raw = (rows[0] as any) ?? initialMember
  if (loading && !raw) return <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading member…</div>
  if (!raw) return <div className="p-6 text-sm text-muted-foreground">Member not found.</div>
  const member = toMember(raw)
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Member</h1>
        <p className="text-muted-foreground text-sm mt-1">Update details for {member.fullName}</p>
      </div>
      <EditMemberForm member={member as any} />
    </div>
  )
}
