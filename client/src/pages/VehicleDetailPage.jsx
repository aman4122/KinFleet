import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Car, ArrowLeft, Shield, FileCheck, Wrench, Gauge, Calendar,
  Fuel, MapPin, Edit, Trash2, Loader2, Save, AlertTriangle,
} from 'lucide-react';
import { cn, formatDate, formatRelativeDate, formatINR, getComplianceBadge, FUEL_TYPES } from '@/lib/utils';
import vehicleService from '@/services/vehicleService';
import tripService from '@/services/tripService';
import { toast } from 'sonner';

const ComplianceItem = ({ icon: Icon, label, dueDate, gradient }) => {
  const badge = getComplianceBadge(dueDate);
  const now = new Date();
  const target = dueDate ? new Date(dueDate) : null;
  const totalDays = 365;
  const daysLeft = target ? Math.max(0, Math.ceil((target - now) / 86400000)) : 0;
  const percent = target ? Math.min(100, Math.max(0, (daysLeft / totalDays) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', gradient)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <p className="text-xs text-text-muted">{dueDate ? formatDate(dueDate) : 'Not set'}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {dueDate && <p className="text-xs text-text-muted mt-1">{formatRelativeDate(dueDate)}</p>}
        </div>
      </div>
      <Progress
        value={percent}
        className="h-1.5"
        indicatorClassName={cn(
          badge.variant === 'destructive' ? 'gradient-danger' : badge.variant === 'warning' ? 'gradient-accent' : 'gradient-success'
        )}
      />
    </div>
  );
};

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [mileage, setMileage] = useState('');
  const [mileageLoading, setMileageLoading] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, tRes] = await Promise.allSettled([
        vehicleService.getVehicle(id),
        tripService.getTrips({ vehicleId: id, limit: 5 }),
      ]);
      if (vRes.status === 'fulfilled') {
        const v = vRes.value.data.vehicle || vRes.value.data;
        setVehicle(v);
        setMileage(v.currentMileage || 0);
        setEditForm(v);
      }
      if (tRes.status === 'fulfilled') {
        setTrips(tRes.value.data.trips || tRes.value.data || []);
      }
    } catch {
      toast.error('Failed to load vehicle');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleMileageUpdate = async () => {
    setMileageLoading(true);
    try {
      await vehicleService.updateMileage(id, Number(mileage));
      toast.success('Mileage updated!');
      setVehicle((p) => ({ ...p, currentMileage: Number(mileage) }));
    } catch {
      toast.error('Failed to update mileage');
    } finally {
      setMileageLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await vehicleService.updateVehicle(id, editForm);
      toast.success('Vehicle updated!');
      setEditOpen(false);
      loadData();
    } catch {
      toast.error('Failed to update vehicle');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await vehicleService.deleteVehicle(id);
      toast.success('Vehicle deleted');
      navigate('/vehicles');
    } catch {
      toast.error('Failed to delete vehicle');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-48" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-16">
        <Car className="h-16 w-16 text-text-muted mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-semibold text-text-secondary">Vehicle not found</h3>
        <Link to="/vehicles"><Button variant="outline" className="mt-4">Back to Vehicles</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="vehicle-detail-page">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/vehicles')} className="gap-2" id="back-to-vehicles">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Vehicle Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-xl shadow-primary/20 shrink-0">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-text-secondary font-mono text-lg">{vehicle.registrationNumber}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {vehicle.fuelType && <Badge variant="secondary"><Fuel className="h-3 w-3 mr-1" />{vehicle.fuelType}</Badge>}
                  {vehicle.year && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{vehicle.year}</Badge>}
                  {vehicle.color && <Badge variant="outline">{vehicle.color}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} id="edit-vehicle-btn">
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} id="delete-vehicle-btn">
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compliance Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-light" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ComplianceItem icon={Shield} label="Insurance" dueDate={vehicle.insuranceExpiry} gradient="bg-blue-500/20" />
            <Separator />
            <ComplianceItem icon={FileCheck} label="PUC Certificate" dueDate={vehicle.pucExpiry} gradient="bg-green-500/20" />
            <Separator />
            <ComplianceItem icon={Wrench} label="Next Service" dueDate={vehicle.nextServiceDate} gradient="bg-amber-500/20" />
          </CardContent>
        </Card>

        {/* Mileage Update */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-5 w-5 text-accent" />
              Odometer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-text-primary">
                {(vehicle.currentMileage || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-text-secondary mt-1">kilometres</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="Enter new mileage"
                id="mileage-input"
              />
              <Button onClick={handleMileageUpdate} disabled={mileageLoading} id="update-mileage-btn">
                {mileageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>

            {/* Recent Trips for this vehicle */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-text-secondary mb-3">Recent Trips</h4>
              {trips.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No trips for this vehicle</p>
              ) : (
                <div className="space-y-2">
                  {trips.slice(0, 3).map((trip, i) => (
                    <div key={trip._id || i} className="flex items-center justify-between p-2 rounded-lg bg-surface-card/50 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-success shrink-0" />
                        <span className="truncate text-text-primary">
                          {trip.startLocation} → {trip.endLocation}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted shrink-0 ml-2">{trip.distance} km</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Vehicle Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update your vehicle information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Make</Label>
                <Input value={editForm.make || ''} onChange={(e) => setEditForm((p) => ({ ...p, make: e.target.value }))} id="edit-make" />
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={editForm.model || ''} onChange={(e) => setEditForm((p) => ({ ...p, model: e.target.value }))} id="edit-model" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Registration</Label>
                <Input value={editForm.registrationNumber || ''} onChange={(e) => setEditForm((p) => ({ ...p, registrationNumber: e.target.value }))} id="edit-reg" />
              </div>
              <div className="space-y-1.5">
                <Label>Fuel Type</Label>
                <Select value={editForm.fuelType || 'Petrol'} onValueChange={(v) => setEditForm((p) => ({ ...p, fuelType: v }))}>
                  <SelectTrigger id="edit-fuel"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Insurance Expiry</Label>
                <Input type="date" value={editForm.insuranceExpiry ? editForm.insuranceExpiry.slice(0, 10) : ''} onChange={(e) => setEditForm((p) => ({ ...p, insuranceExpiry: e.target.value }))} id="edit-insurance" />
              </div>
              <div className="space-y-1.5">
                <Label>PUC Expiry</Label>
                <Input type="date" value={editForm.pucExpiry ? editForm.pucExpiry.slice(0, 10) : ''} onChange={(e) => setEditForm((p) => ({ ...p, pucExpiry: e.target.value }))} id="edit-puc" />
              </div>
              <div className="space-y-1.5">
                <Label>Next Service</Label>
                <Input type="date" value={editForm.nextServiceDate ? editForm.nextServiceDate.slice(0, 10) : ''} onChange={(e) => setEditForm((p) => ({ ...p, nextServiceDate: e.target.value }))} id="edit-service" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editSaving} id="save-edit-vehicle">
                {editSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
