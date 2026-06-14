import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MapPin, ArrowLeft, Car, Calendar, Route, IndianRupee,
  Plus, Trash2, Loader2, StickyNote, Fuel,
} from 'lucide-react';
import { INDIAN_STATES, formatINRFull } from '@/lib/utils';
import tripService from '@/services/tripService';
import vehicleService from '@/services/vehicleService';
import { toast } from 'sonner';

export default function AddTripPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    startLocation: '',
    endLocation: '',
    startState: '',
    endState: '',
    distance: '',
    startDate: '',
    endDate: '',
    fuelExpense: '',
    notes: '',
  });
  const [tollExpenses, setTollExpenses] = useState([]);

  useEffect(() => {
    vehicleService.getVehicles()
      .then((res) => setVehicles(res.data.vehicles || res.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  const addToll = () => {
    setTollExpenses((p) => [...p, { tollName: '', amount: '', paymentMode: 'Cash' }]);
  };

  const updateToll = (index, field, value) => {
    setTollExpenses((p) => p.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const removeToll = (index) => {
    setTollExpenses((p) => p.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startLocation || !form.endLocation || !form.distance) {
      toast.error('Start location, end location, and distance are required');
      return;
    }
    setLoading(true);
    try {
      await tripService.createTrip({
        ...form,
        distance: Number(form.distance),
        fuelExpense: form.fuelExpense ? Number(form.fuelExpense) : 0,
        tollExpenses: tollExpenses.map((t) => ({
          tollName: t.tollName,
          amount: Number(t.amount) || 0,
          paymentMode: t.paymentMode,
        })),
      });
      toast.success('Trip logged successfully!');
      navigate('/trips');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log trip');
    } finally {
      setLoading(false);
    }
  };

  const totalToll = tollExpenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = totalToll + (Number(form.fuelExpense) || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="add-trip-page">
      <Button variant="ghost" onClick={() => navigate('/trips')} className="gap-2" id="back-to-trips">
        <ArrowLeft className="h-4 w-4" /> Back to Trips
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Log New Trip</h1>
        <p className="text-sm text-text-secondary mt-1">Record your trip details and expenses</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vehicle Selection */}
        {vehicles.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <Label className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-primary-light" /> Vehicle
              </Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm((p) => ({ ...p, vehicleId: v }))}>
                <SelectTrigger id="trip-vehicle"><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v._id} value={v._id}>{v.make} {v.model} — {v.registrationNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Route Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-success" /> Route Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trip-start">Start Location *</Label>
                <Input id="trip-start" placeholder="e.g. Mumbai" value={form.startLocation} onChange={handleChange('startLocation')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-end">End Location *</Label>
                <Input id="trip-end" placeholder="e.g. Pune" value={form.endLocation} onChange={handleChange('endLocation')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start State</Label>
                <Select value={form.startState} onValueChange={(v) => setForm((p) => ({ ...p, startState: v }))}>
                  <SelectTrigger id="trip-start-state"><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>End State</Label>
                <Select value={form.endState} onValueChange={(v) => setForm((p) => ({ ...p, endState: v }))}>
                  <SelectTrigger id="trip-end-state"><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trip-distance">Distance (km) *</Label>
                <Input id="trip-distance" type="number" placeholder="0" value={form.distance} onChange={handleChange('distance')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-start-date">Start Date</Label>
                <Input id="trip-start-date" type="date" value={form.startDate} onChange={handleChange('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-end-date">End Date</Label>
                <Input id="trip-end-date" type="date" value={form.endDate} onChange={handleChange('endDate')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toll Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-accent" /> Toll Expenses
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addToll} id="add-toll-btn">
              <Plus className="h-3 w-3" /> Add Toll
            </Button>
          </CardHeader>
          <CardContent>
            {tollExpenses.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No toll expenses added</p>
            ) : (
              <div className="space-y-3">
                {tollExpenses.map((toll, i) => (
                  <div key={i} className="flex items-end gap-2 p-3 rounded-xl bg-surface-card/50">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Toll Name</Label>
                      <Input
                        placeholder="e.g. Khed Shivapur"
                        value={toll.tollName}
                        onChange={(e) => updateToll(i, 'tollName', e.target.value)}
                        className="h-8 text-sm"
                        id={`toll-name-${i}`}
                      />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={toll.amount}
                        onChange={(e) => updateToll(i, 'amount', e.target.value)}
                        className="h-8 text-sm"
                        id={`toll-amount-${i}`}
                      />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <Label className="text-xs">Mode</Label>
                      <Select value={toll.paymentMode} onValueChange={(v) => updateToll(i, 'paymentMode', v)}>
                        <SelectTrigger className="h-8 text-sm" id={`toll-mode-${i}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="FASTag">FASTag</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeToll(i)} className="text-danger shrink-0" id={`remove-toll-${i}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fuel & Notes */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="trip-fuel" className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-amber-400" /> Fuel Expense (₹)
              </Label>
              <Input id="trip-fuel" type="number" placeholder="0" value={form.fuelExpense} onChange={handleChange('fuelExpense')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-notes" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-text-muted" /> Notes
              </Label>
              <textarea
                id="trip-notes"
                className="flex w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-none transition-all duration-200"
                placeholder="Additional notes about the trip..."
                value={form.notes}
                onChange={handleChange('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total & Submit */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Total Expense</p>
            <p className="text-2xl font-bold text-accent">{formatINRFull(totalExpense)}</p>
          </div>
          <Button type="submit" size="lg" disabled={loading} id="submit-trip">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Route className="h-4 w-4" /> Log Trip</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
