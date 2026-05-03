import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/StatusBadge'
import { Spinner } from '@/components/Spinner'
import { driverApi, vehicleApi } from '@/api'
import { toast } from '@/components/ui/use-toast'
import type { Driver, CreateDriverRequest, DriverStatus } from '@/api/types'

const PAGE_SIZE = 10

const emptyForm: CreateDriverRequest = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  licenseNumber: '',
  status: 'AVAILABLE',
}

function DriverForm({
  value,
  onChange,
  vehicleOptions,
  assignedVehicleId,
  onAssignedVehicleChange,
}: {
  value: CreateDriverRequest
  onChange: (v: CreateDriverRequest) => void
  vehicleOptions: { id: number; label: string }[]
  assignedVehicleId: string
  onAssignedVehicleChange: (v: string) => void
}) {
  const set = (k: keyof CreateDriverRequest, v: string) => onChange({ ...value, [k]: v })

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>First Name</Label>
          <Input value={value.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Last Name</Label>
          <Input value={value.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Email</Label>
        <Input type="email" value={value.email} onChange={(e) => set('email', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={value.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>License Number</Label>
          <Input value={value.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={value.status} onValueChange={(v) => set('status', v as DriverStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ON_TRIP">On Trip</SelectItem>
              <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Assign Vehicle</Label>
          <Select value={assignedVehicleId} onValueChange={onAssignedVehicleChange}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {vehicleOptions.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function Drivers() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Driver | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null)
  const [form, setForm] = useState<CreateDriverRequest>(emptyForm)
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>('none')

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: driverApi.list,
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehicleApi.list,
  })

  const vehicleOptions = vehicles
    .filter((v) => v.status === 'ACTIVE')
    .map((v) => ({ id: v.id, label: `${v.licensePlate} — ${v.make} ${v.model}` }))

  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]))

  const createMut = useMutation({
    mutationFn: async (req: CreateDriverRequest) => {
      const driver = await driverApi.create(req)
      if (assignedVehicleId !== 'none') {
        await driverApi.assignVehicle(driver.id, { vehicleId: Number(assignedVehicleId) })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setModalOpen(false) },
    onError: () => toast({ variant: 'destructive', title: 'Failed to create driver' }),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: CreateDriverRequest }) => {
      await driverApi.update(id, body)
      await driverApi.assignVehicle(id, {
        vehicleId: assignedVehicleId !== 'none' ? Number(assignedVehicleId) : null,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setModalOpen(false) },
    onError: () => toast({ variant: 'destructive', title: 'Failed to update driver' }),
  })

  const deleteMut = useMutation({
    mutationFn: driverApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setDeleteTarget(null) },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete driver' }),
  })

  const filtered = drivers.filter((d) => {
    const name = `${d.firstName} ${d.lastName}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setAssignedVehicleId('none')
    setModalOpen(true)
  }

  function openEdit(d: Driver) {
    setEditTarget(d)
    setForm({
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone ?? '',
      licenseNumber: d.licenseNumber,
      status: d.status,
    })
    setAssignedVehicleId(d.assignedVehicleId ? String(d.assignedVehicleId) : 'none')
    setModalOpen(true)
  }

  function handleSubmit() {
    if (editTarget) updateMut.mutate({ id: editTarget.id, body: form })
    else createMut.mutate(form)
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Driver
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_TRIP">On Trip</SelectItem>
            <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No drivers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((d) => {
                    const veh = d.assignedVehicleId ? vehicleById[d.assignedVehicleId] : null
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.firstName} {d.lastName}</TableCell>
                        <TableCell className="text-muted-foreground">{d.email}</TableCell>
                        <TableCell className="font-mono">{d.licenseNumber}</TableCell>
                        <TableCell>
                          {veh ? `${veh.licensePlate} (${veh.make})` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(d)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filtered.length} driver{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="flex items-center px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
          </DialogHeader>
          <DriverForm
            value={form}
            onChange={setForm}
            vehicleOptions={vehicleOptions}
            assignedVehicleId={assignedVehicleId}
            onAssignedVehicleChange={setAssignedVehicleId}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
              {editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
