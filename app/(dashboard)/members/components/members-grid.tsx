"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Banknote,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"

type Member = {
  id: string
  saccoId: string
  memberCode: string
  fullName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  photoUrl: string | null
  dateOfBirth: Date | null
  address: string | null
  nextOfKin: string | null
  nextOfKinPhone: string | null
  nextOfKinRelationship: string | null
  nextOfKinAddress: string | null
  status: "active" | "suspended" | "exited"
  joinedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  suspended: "secondary",
  exited: "destructive",
}

const ITEMS_PER_PAGE = 10

export function MembersGrid({ members }: { members: Member[] }) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-muted-foreground">
        <p className="text-lg font-medium">No members found</p>
        <p className="mt-1 text-sm">Add your first member to get started</p>
      </div>
    )
  }

  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedMembers = members.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedMembers.map((member) => (
          <Card
            key={member.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/members/${member.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={member.photoUrl ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                    {member.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold">{member.fullName}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {member.memberCode}
                  </p>
                </div>
                <Badge variant={statusVariant[member.status]}>
                  {member.status}
                </Badge>
                <div className="w-full space-y-1 border-t pt-3 text-xs text-muted-foreground">
                  <p>{member.phone ?? "No phone"}</p>
                  <p>Joined {formatDate(member.joinedAt)}</p>
                </div>
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/members/${member.id}`)
                    }}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/loans?member=${member.id}`)
                    }}
                  >
                    <Banknote className="mr-1 h-3.5 w-3.5" />
                    Loan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing <strong>{startIndex + 1}</strong> -{" "}
          <strong>{Math.min(endIndex, members.length)}</strong> of{" "}
          <strong>{members.length}</strong> results
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
