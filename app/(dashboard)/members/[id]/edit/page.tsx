import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EditMemberForm } from "./edit-member-form"

interface EditMemberPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params

  const supabase = supabaseAdmin

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !member) notFound()

  const formattedMember = {
    id: member.id,
    saccoId: member.sacco_id,
    memberCode: member.member_code,
    fullName: member.full_name,
    email: member.email,
    phone: member.phone,
    nationalId: member.national_id,
    photoUrl: member.photo_url,
    dateOfBirth: member.date_of_birth,
    address: member.address,
    nextOfKin: member.next_of_kin,
    nextOfKinPhone: member.next_of_kin_phone,
    nextOfKinRelationship: member.next_of_kin_relationship,
    nextOfKinAddress: member.next_of_kin_address,
    status: member.status,
    joinedAt: new Date(member.joined_at),
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update details for {formattedMember.fullName}
        </p>
      </div>
      <EditMemberForm member={formattedMember} />
    </div>
  )
}