"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Download, Banknote, ArrowLeftRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AccountsTable } from "./accounts-table"
import { AddAccountDialog } from "./add-account-dialog"
import { TransactionsTable } from "./transactions-table"
import { AddTransactionDialog } from "./add-transaction-dialog"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import { formatUGX } from "@/lib/utils/format"

interface BankingClientProps {
  saccoId: string
}

export function BankingClient({ saccoId }: BankingClientProps) {
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<any>(null)
  const [txnOpen, setTxnOpen] = useState(false)
  const [accountSearch, setAccountSearch] = useState("")
  const [txnSearch, setTxnSearch] = useState("")

  const { data: accountRows = [] } = useQuery(
    `SELECT * FROM sacco_bank_accounts WHERE sacco_id = ? ORDER BY created_at DESC`,
    [saccoId]
  )

  const { data: txnRows = [] } = useQuery(
    `SELECT * FROM sacco_banking WHERE sacco_id = ? ORDER BY created_at DESC`,
    [saccoId]
  )

  const accounts = useMemo(() => (accountRows as any[]).map((r) => ({
    id: r.id, bankName: r.bank_name, accountName: r.account_name,
    accountNumber: r.account_number, branch: r.branch ?? null,
    isActive: r.is_active ?? true, createdAt: r.created_at ? new Date(r.created_at) : null,
  })), [accountRows])

  const transactions = useMemo(() => (txnRows as any[]).map((r) => ({
    id: r.id, accountId: r.account_id, type: r.type,
    amount: Number(r.amount), description: r.description,
    reference: r.reference ?? null, transactedBy: r.transacted_by ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  })), [txnRows])

  const bankAccountsList = accounts.filter((a) => a.isActive)

  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return accounts
    const q = accountSearch.toLowerCase()
    return accounts.filter((a) =>
      a.bankName.toLowerCase().includes(q) ||
      a.accountName.toLowerCase().includes(q) ||
      a.accountNumber.toLowerCase().includes(q)
    )
  }, [accounts, accountSearch])

  const filteredTransactions = useMemo(() => {
    if (!txnSearch) return transactions
    const q = txnSearch.toLowerCase()
    return transactions.filter((t) =>
      t.description.toLowerCase().includes(q) ||
      (t.reference ?? "").toLowerCase().includes(q)
    )
  }, [transactions, txnSearch])

  const handleExport = async (tab: "accounts" | "transactions") => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(tab === "accounts" ? "Accounts" : "Transactions")
    if (tab === "accounts") {
      sheet.columns = [
        { header: "Bank", key: "bank", width: 20 },
        { header: "Account", key: "name", width: 25 },
        { header: "Number", key: "number", width: 20 },
        { header: "Branch", key: "branch", width: 20 },
        { header: "Status", key: "status", width: 12 },
      ]
      sheet.addRows(accounts.map((a) => ({
        bank: a.bankName, name: a.accountName,
        number: a.accountNumber, branch: a.branch ?? "-",
        status: a.isActive ? "Active" : "Inactive",
      })))
    } else {
      sheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Type", key: "type", width: 12 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Description", key: "desc", width: 30 },
        { header: "Reference", key: "ref", width: 20 },
      ]
      sheet.addRows(transactions.map((t) => ({
        date: t.createdAt ? t.createdAt.toISOString().split("T")[0] : "-",
        type: t.type, amount: formatUGX(t.amount),
        desc: t.description, ref: t.reference ?? "-",
      })))
    }
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `lendwell-${tab}.xlsx`
    a.click(); window.URL.revokeObjectURL(url)
    toast.success(`${tab === "accounts" ? "Accounts" : "Transactions"} exported`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} · {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <Tabs defaultValue="transactions">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <TabsList>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Accounts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="accounts" className="space-y-4 pt-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search accounts..." className="pl-9" value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("accounts")}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button size="sm" onClick={() => setAccountsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Account
              </Button>
            </div>
          </div>
          <AccountsTable accounts={filteredAccounts} saccoId={saccoId} onEdit={setEditAccount} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 pt-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-9" value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("transactions")}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button size="sm" onClick={() => setTxnOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Record Transaction
              </Button>
            </div>
          </div>
          <TransactionsTable transactions={filteredTransactions} saccoId={saccoId} bankAccounts={bankAccountsList} />
        </TabsContent>
      </Tabs>

      <AddAccountDialog open={accountsOpen} onClose={() => setAccountsOpen(false)} saccoId={saccoId} />
      {editAccount && (
        <AddAccountDialog open={!!editAccount} onClose={() => setEditAccount(null)} account={editAccount} saccoId={saccoId} />
      )}
      <AddTransactionDialog open={txnOpen} onClose={() => setTxnOpen(false)} saccoId={saccoId} bankAccounts={bankAccountsList} />
    </div>
  )
}
