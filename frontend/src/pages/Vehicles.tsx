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
import { vehicleApi } from '@/api'
import { toast } from '@/components/ui/use-toast'
import type { Vehicle, CreateVehicleRequest, VehicleStatus } from '@/api/types'

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Bus', 'Motorcycle']
const PAGE_SIZE = 10

const emptyForm: CreateVehicleRequest = {
  licensePlate: '',
  type: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  status: 'ACTIVE',
}

function VehicleForm({
  value,
  onChange,
}: {
  value: CreateVehicleRequest
  onChange: (v: CreateVehicleRequest) => void
}) {
  const set = (k: keyof CreateVehicleRequest, v: string | number) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>License Plate</Label>
          <Input value={value.licensePlate} onChange={(e) => set('licensePlate', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={value.type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Make</Label>
          <Input value={value.make} onChange={(e) => set('make', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Model</Label>
          <Input value={value.model} onChange={(e) => set('model', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Year</Label>
          <Input type="number" value={value.year} onChange={(e) => set('year', Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={value.status} onValueChange={(v) => set('status', v as VehicleStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function Vehicles() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<CreateVehicleRequest>(emptyForm)

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehicleApi.list,
  })

  const createMut = useMutation({
    mutationFn: vehicleApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModalOpen(false) },
    onError: () => toast({ variant: 'destructive', title: 'Failed to create vehicle' }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: CreateVehicleRequest }) => vehicleApi.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModalOpen(false) },
    onError: () => toast({ variant: 'destructive', title: 'Failed to update vehicle' }),
  })

  const deleteMut = useMutation({
    mutationFn: vehicleApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setDeleteTarget(null) },
    onError: () => toast({ variant: 'destructive', title: 'Failed to delete vehicle' }),
  })

  const filtered = vehicles.filter((v) => {
    const matchSearch =
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      v.make.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter
    const matchType = typeFilter === 'ALL' || v.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(v: Vehicle) {
    setEditTarget(v)
    setForm({ licensePlate: v.licensePlate, type: v.type, make: v.make, model: v.model, year: v.year, status: v.status })
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
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search plate, make, model…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Make / Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono font-medium">{v.licensePlate}</TableCell>
                      <TableCell>{v.type}</TableCell>
                      <TableCell>{v.make} {v.model}</TableCell>
                      <TableCell>{v.year}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(v)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="flex items-center px-2">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <VehicleForm value={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
              {editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.licensePlate}</strong>? This action cannot be undone.
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
