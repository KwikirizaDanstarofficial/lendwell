"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { editMemberAction } from "../../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"

export function EditMemberForm({ member }: { member: any }) {
  const router = useRouter()
  const editMemberActionBound = editMemberAction.bind(null, member.id)
  const [state, formAction, isPending] = useActionState(editMemberActionBound, {})

  useEffect(() => {
    if (state.success) {
      toast.success("Member updated!")
      router.push(`/members/${member.id}`)
    }
    if (state.error && state.error !== "offline") toast.error(state.error)
  }, [state, router, member.id])

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={member.fullName}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={member.email ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={member.phone ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="national_id">National ID</Label>
          <Input
            id="national_id"
            name="national_id"
            defaultValue={member.nationalId ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={
              member.dateOfBirth
                ? new Date(member.dateOfBirth).toISOString().split("T")[0]
                : ""
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={member.address ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={member.status ?? "active"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="exited">Exited</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Next of Kin</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="next_of_kin">Name</Label>
            <Input
              id="next_of_kin"
              name="next_of_kin"
              defaultValue={member.nextOfKin ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next_of_kin_phone">Phone</Label>
            <Input
              id="next_of_kin_phone"
              name="next_of_kin_phone"
              defaultValue={member.nextOfKinPhone ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next_of_kin_relationship">Relationship</Label>
            <Input
              id="next_of_kin_relationship"
              name="next_of_kin_relationship"
              defaultValue={member.nextOfKinRelationship ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next_of_kin_address">Address</Label>
            <Input
              id="next_of_kin_address"
              name="next_of_kin_address"
              defaultValue={member.nextOfKinAddress ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
