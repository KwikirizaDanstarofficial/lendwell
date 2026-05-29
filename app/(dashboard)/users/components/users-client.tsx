"use client"

import { useState, useMemo, useEffect } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  KeyRound,
  Loader2,
  Users,
} from "lucide-react"
import {
  createUserAction,
  updateUserAction,
  toggleUserActiveAction,
  resetPasswordAction,
  deleteUserAction,
  type UserFormState,
} from "../actions"
import type { Branch } from "@/db/queries/branches"

// ─── Role meta ────────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; badge: string; accent: string; perms: string[]; desc: string }> = {
  admin: {
    label: "Admin",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    accent: "#a855f7",
    perms: ["View", "Add", "Edit", "Delete", "Users", "Settings"],
    desc: "Full access to all modules",
  },
  cashier: {
    label: "Cashier",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    accent: "#3b82f6",
    perms: ["View", "Add"],
    desc: "View + add records, create Field Agents",
  },
  branch_admin: {
    label: "Branch Admin",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    accent: "#14b8a6",
    perms: ["View", "Add", "Edit"],
    desc: "Manages a single branch: members, loans, savings",
  },
  field_agent: {
    label: "Field Agent",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    accent: "#10b981",
    perms: ["View", "Add"],
    desc: "View + add records only",
  },
}

const ALL_PERMS = ["View", "Add", "Edit", "Delete", "Users", "Settings"]

// ─── Create Dialog ────────────────────────────────────────────────────────────

function CreateUserDialog({
  open,
  onClose,
  currentRole,
  branches,
}: {
  open: boolean
  onClose: () => void
  currentRole: string
  branches: Branch[]
}) {
  const [state, action, pending] = useActionState(
    createUserAction,
    {} as UserFormState
  )
  const [selectedRole, setSelectedRole] = useState("field_agent")
  const isCashier = currentRole === "cashier"
  const needsBranch = selectedRole === "branch_admin"

  useEffect(() => {
    if (state.success) {
      toast.success("User created successfully!")
      onClose()
    }
    if (state.error && !state.fieldErrors) toast.error(state.error)
  }, [state, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCashier ? "Add Field Agent" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            Login credentials will be auto-generated and sent to their phone via SMS.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input name="full_name" placeholder="e.g. Okello James" />
            {state.fieldErrors?.full_name && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.full_name[0]}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number *</Label>
            <Input name="phone" type="tel" placeholder="0700 000 000" />
            {state.fieldErrors?.phone && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.phone[0]}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Role *</Label>
            {isCashier ? (
              <>
                <input type="hidden" name="role" value="field_agent" />
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Field Agent — Cashiers can only create Field Agents
                </div>
              </>
            ) : (
              <Select name="role" defaultValue="field_agent" onValueChange={(v) => setSelectedRole(v ?? "field_agent")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="cashier">Cashier — View + add, creates field agents</SelectItem>
                  <SelectItem value="branch_admin">Branch Admin — Manages a branch</SelectItem>
                  <SelectItem value="field_agent">Field Agent — View + add only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {needsBranch && branches.length > 0 && (
            <div className="space-y-1.5">
              <Label>Branch *</Label>
              <Select name="branch_id">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input name="notes" placeholder="e.g. Covers Kirumya area" />
          </div>
          {state.error && !state.fieldErrors && (
            <p className="rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  open,
  onClose,
  branches,
}: {
  user: any
  open: boolean
  onClose: () => void
  branches: Branch[]
}) {
  const [state, action, pending] = useActionState(
    updateUserAction,
    {} as UserFormState
  )
  const [editRole, setEditRole] = useState(user?.role ?? "field_agent")
  const needsBranch = editRole === "branch_admin"

  useEffect(() => {
    if (user) setEditRole(user.role)
  }, [user])

  useEffect(() => {
    if (state.success) {
      toast.success("User updated.")
      onClose()
    }
    if (state.error) toast.error(state.error)
  }, [state, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update {user.fullName}&apos;s details.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input name="full_name" defaultValue={user.fullName} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed after creation.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              name="phone"
              defaultValue={user.phone ?? ""}
              placeholder="+256 700 000 000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue={user.role} onValueChange={(v) => setEditRole(v ?? "field_agent")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="branch_admin">Branch Admin</SelectItem>
                <SelectItem value="field_agent">Field Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {needsBranch && branches.length > 0 && (
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select name="branch_id" defaultValue={user.branchId ?? ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input name="notes" defaultValue={user.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reset Password Dialog ────────────────────────────────────────────────────

function ResetPasswordDialog({
  user,
  open,
  onClose,
}: {
  user: any
  open: boolean
  onClose: () => void
}) {
  const [pw, setPw] = useState("")
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    const r = await resetPasswordAction(user.id, pw)
    setLoading(false)
    if (r.success) {
      toast.success("Password reset.")
      onClose()
      setPw("")
    } else toast.error(r.error)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new temporary password for {user.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>New Password</Label>
          <Input
            type="password"
            placeholder="Min 8 characters"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handle} disabled={loading || pw.length < 8}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  users: any[]
  currentUser: {
    userId: string
    role: string
    fullName: string
    saccoId: string
    email: string
    isLoggedIn: boolean
    branchId?: string | null
  }
  canManageUsers: boolean
  branches: Branch[]
}

export function UsersClient({ users, currentUser, canManageUsers, branches }: Props) {
  const isAdmin = currentUser.role === "admin"
  const isCashier = currentUser.role === "cashier"

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [resetUser, setResetUser] = useState<any>(null)
  const [deleteUser, setDeleteUser] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [deleting, setDeleting] = useState(false)

  const branchMap = useMemo(
    () => Object.fromEntries(branches.map((b) => [b.id, b.name])),
    [branches]
  )

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = search.toLowerCase()
        return (
          (u.fullName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.includes(q)) &&
          (roleFilter === "all" || u.role === roleFilter)
        )
      }),
    [users, search, roleFilter]
  )

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    cashier: users.filter((u) => u.role === "cashier").length,
    branch_admin: users.filter((u) => u.role === "branch_admin").length,
    field_agent: users.filter((u) => u.role === "field_agent").length,
    active: users.filter((u) => u.isActive).length,
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleting(true)
    const r = await deleteUserAction(deleteUser.id)
    setDeleting(false)
    if (r.success) {
      toast.success("User deleted.")
      setDeleteUser(null)
    } else toast.error(r.error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff access and roles for this SACCO
          </p>
        </div>
        {(isAdmin || isCashier) && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {isCashier ? "Add Field Agent" : "Add User"}
          </Button>
        )}
      </div>

      {/* Role cards with permission matrix */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["admin", "cashier", "branch_admin", "field_agent"] as const).map((role) => {
          const meta = ROLE_META[role]
          return (
            <Card key={role} className="relative overflow-hidden">
              <div />
              <CardContent className="pt-4 pr-4 pb-3 pl-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
                    {meta.label}
                  </span>
                  <span className="text-2xl font-bold">{stats[role]}</span>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{meta.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {ALL_PERMS.map((perm) => (
                    <span
                      key={perm}
                      className={[
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        meta.perms.includes(perm)
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground line-through opacity-50",
                      ].join(" ")}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Users", value: stats.total, color: "" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          {
            label: "Inactive",
            value: stats.total - stats.active,
            color: "text-muted-foreground",
          },
          {
            label: "Your Role",
            value:
              ROLE_META[currentUser.role as keyof typeof ROLE_META]?.label ??
              currentUser.role,
            color: "",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="px-4 pt-3 pb-3">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <p className={`mt-0.5 text-xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">
          {filtered.length} of {users.length} users
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value || "all")}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="branch_admin">Branch Admin</SelectItem>
                <SelectItem value="field_agent">Field Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-muted-foreground">
          <Users className="mb-3 h-12 w-12 opacity-20" />
          <p className="text-lg font-medium">No users found</p>
          <p className="mt-1 text-sm">Add your first user to get started</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Branch</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Permissions</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const meta = ROLE_META[u.role as keyof typeof ROLE_META]
                const initials = u.fullName
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                const isSelf = u.id === currentUser.userId
                const canEditThis = isAdmin

                return (
                  <TableRow
                    key={u.id}
                    className={!u.isActive ? "opacity-60" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium">
                              {u.fullName}
                            </p>
                            {isSelf && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                You
                              </span>
                            )}
                            {u.mustChangePassword && (
                              <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Temp PW
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta?.badge ?? ""}`}>
                        {meta?.label ?? u.role}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {u.branchId ? (branchMap[u.branchId] ?? "—") : "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {u.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {ALL_PERMS.map((perm) => (
                          <span
                            key={perm}
                            className={[
                              "rounded px-1.5 py-0.5 text-[10px] font-medium",
                              (meta?.perms ?? []).includes(perm)
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-muted text-muted-foreground line-through opacity-40",
                            ].join(" ")}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canEditThis && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => setEditUser(u)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit User
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => setResetUser(u)}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <KeyRound className="mr-2 h-4 w-4" /> Reset
                                Password
                              </DropdownMenuItem>
                            )}
                            {isAdmin && !isSelf && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  const r = await toggleUserActiveAction(
                                    u.id,
                                    !u.isActive
                                  )
                                  if (r.success)
                                    toast.success(
                                      u.isActive
                                        ? "User deactivated"
                                        : "User activated"
                                    )
                                  else toast.error(r.error)
                                }}
                                className={
                                  u.isActive
                                    ? "text-orange-600 focus:text-orange-600"
                                    : "text-green-600 focus:text-green-600"
                                }
                              >
                                {u.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />{" "}
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />{" "}
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {isAdmin && !isSelf && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteUser(u)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentRole={currentUser.role}
        branches={branches}
      />
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onClose={() => setEditUser(null)}
          branches={branches}
        />
      )}
      {resetUser && (
        <ResetPasswordDialog
          user={resetUser}
          open={!!resetUser}
          onClose={() => setResetUser(null)}
        />
      )}

      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteUser?.fullName}</strong> (
              {deleteUser?.role}) from the system. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
