import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Car, Plus, Search, Fuel, Shield, FileCheck, Wrench,
  Loader2, Calendar, Gauge, Filter, X,
} from 'lucide-react';
import { cn, formatINRFull, formatDate, getComplianceDot, FUEL_TYPES } from '@/lib/utils';
import vehicleService from '@/services/vehicleService';
import { toast } from 'sonner';

const FuelIcon = ({ type }) => {
  const colors = {
    Petrol: 'text-amber-400',
    Diesel: 'text-gray-400',
    CNG: 'text-green-400',
    Electric: 'text-blue-400',
    Hybrid: 'text-teal-400',
    'Petrol+CNG': 'text-lime-400',
  };
  return <Fuel className={cn('h-3.5 w-3.5', colors[type] || 'text-text-muted')} />;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: '', model: '', year: '', registrationNumber: '', fuelType: 'Petrol',
    color: '', currentMileage: '', insuranceExpiry: '', pucExpiry: '', nextServiceDate: '',
  });

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getVehicles();
      setVehicles(res.data.vehicles || res.data || []);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.make || !form.registrationNumber) {
      toast.error('Make and registration number are required');
      return;
    }
    setSaving(true);
    try {
      await vehicleService.createVehicle({
        ...form,
        year: form.year ? Number(form.year) : undefined,
        currentMileage: form.currentMileage ? Number(form.currentMileage) : 0,
      });
      toast.success('Vehicle added successfully!');
      setDialogOpen(false);
      setForm({ make: '', model: '', year: '', registrationNumber: '', fuelType: 'Petrol', color: '', currentMileage: '', insuranceExpiry: '', pucExpiry: '', nextServiceDate: '' });
      loadVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (v.make || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.registrationNumber || '').toLowerCase().includes(q);
    const matchFuel = fuelFilter === 'all' || v.fuelType === fuelFilter;
    return matchSearch && matchFuel;
  });

  if (loading) {
    return (
      <div className="space-y-6" id="vehicles-loading">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-10 w-32" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="vehicles-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Vehicles</h1>
          <p className="text-sm text-text-secondary">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} id="add-vehicle-btn">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search by make, model, or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            id="vehicle-search"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={fuelFilter} onValueChange={setFuelFilter}>
          <SelectTrigger className="w-full sm:w-40" id="fuel-filter">
            <Filter className="h-4 w-4 mr-2 text-text-muted" />
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuels</SelectItem>
            {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Car className="h-16 w-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold text-text-secondary">No vehicles found</h3>
          <p className="text-sm text-text-muted mt-1">
            {vehicles.length === 0 ? 'Add your first vehicle to get started' : 'Try adjusting your filters'}
          </p>
          {vehicles.length === 0 && (
            <Button onClick={() => setDialogOpen(true)} className="mt-4" id="add-first-vehicle">
              <Plus className="h-4 w-4" /> Add Vehicle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((vehicle) => (
            <Link key={vehicle._id} to={`/vehicles/${vehicle._id}`} className="block">
              <div className="glass-card-hover p-5 h-full" id={`vehicle-card-${vehicle._id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FuelIcon type={vehicle.fuelType} />
                    {vehicle.fuelType || 'N/A'}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-text-primary">
                  {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5 font-mono">
                  {vehicle.registrationNumber || 'No Reg.'}
                </p>

                {vehicle.year && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                    <Calendar className="h-3 w-3" /> {vehicle.year}
                    {vehicle.currentMileage > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <Gauge className="h-3 w-3" /> {vehicle.currentMileage.toLocaleString('en-IN')} km
                      </>
                    )}
                  </div>
                )}

                {/* Compliance dots */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className={cn('h-2.5 w-2.5 rounded-full', getComplianceDot(vehicle.insuranceExpiry))} />
                    <span className="text-[10px] text-text-muted">Insurance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('h-2.5 w-2.5 rounded-full', getComplianceDot(vehicle.pucExpiry))} />
                    <span className="text-[10px] text-text-muted">PUC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('h-2.5 w-2.5 rounded-full', getComplianceDot(vehicle.nextServiceDate))} />
                    <span className="text-[10px] text-text-muted">Service</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Enter your vehicle details to start tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="v-make">Make *</Label>
                <Input id="v-make" placeholder="e.g. Maruti Suzuki" value={form.make} onChange={handleChange('make')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-model">Model</Label>
                <Input id="v-model" placeholder="e.g. Swift" value={form.model} onChange={handleChange('model')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="v-reg">Registration Number *</Label>
                <Input id="v-reg" placeholder="MH 01 AB 1234" value={form.registrationNumber} onChange={handleChange('registrationNumber')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-year">Year</Label>
                <Input id="v-year" type="number" placeholder="2025" value={form.year} onChange={handleChange('year')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fuel Type</Label>
                <Select value={form.fuelType} onValueChange={(val) => setForm((p) => ({ ...p, fuelType: val }))}>
                  <SelectTrigger id="v-fuel"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-color">Color</Label>
                <Input id="v-color" placeholder="e.g. White" value={form.color} onChange={handleChange('color')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-mileage">Current Mileage (km)</Label>
              <Input id="v-mileage" type="number" placeholder="0" value={form.currentMileage} onChange={handleChange('currentMileage')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="v-insurance">Insurance Expiry</Label>
                <Input id="v-insurance" type="date" value={form.insuranceExpiry} onChange={handleChange('insuranceExpiry')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-puc">PUC Expiry</Label>
                <Input id="v-puc" type="date" value={form.pucExpiry} onChange={handleChange('pucExpiry')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-service">Next Service</Label>
                <Input id="v-service" type="date" value={form.nextServiceDate} onChange={handleChange('nextServiceDate')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} id="cancel-add-vehicle">Cancel</Button>
              <Button type="submit" disabled={saving} id="submit-add-vehicle">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
