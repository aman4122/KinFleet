import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MapPin, Plus, Search, Calendar, ArrowRight, Fuel,
  IndianRupee, Filter, X, TrendingUp, Route,
} from 'lucide-react';
import { formatINR, formatDate, cn } from '@/lib/utils';
import tripService from '@/services/tripService';
import vehicleService from '@/services/vehicleService';
import { toast } from 'sonner';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, vRes] = await Promise.allSettled([
        tripService.getTrips(),
        vehicleService.getVehicles(),
      ]);
      setTrips(tRes.status === 'fulfilled' ? (tRes.value.data.trips || tRes.value.data || []) : []);
      setVehicles(vRes.status === 'fulfilled' ? (vRes.value.data.vehicles || vRes.value.data || []) : []);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.startLocation || '').toLowerCase().includes(q) ||
      (t.endLocation || '').toLowerCase().includes(q);
    const matchVehicle = vehicleFilter === 'all' || t.vehicleId === vehicleFilter;
    return matchSearch && matchVehicle;
  });

  const totalDistance = filtered.reduce((s, t) => s + (t.distance || 0), 0);
  const totalExpense = filtered.reduce((s, t) => {
    const toll = (t.tollExpenses || []).reduce((a, b) => a + (b.amount || 0), 0);
    return s + toll + (t.fuelExpense || 0);
  }, 0);

  const getVehicleName = (vehicleId) => {
    const v = vehicles.find((ve) => ve._id === vehicleId);
    return v ? `${v.make} ${v.model}` : 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6" id="trips-loading">
        <div className="flex justify-between"><div className="skeleton h-8 w-32" /><div className="skeleton h-10 w-28" /></div>
        <div className="grid grid-cols-2 gap-4"><div className="skeleton h-20" /><div className="skeleton h-20" /></div>
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="trips-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Trips</h1>
          <p className="text-sm text-text-secondary">{trips.length} trip{trips.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <Link to="/trips/new">
          <Button id="add-trip-btn"><Plus className="h-4 w-4" /> Log Trip</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Route className="h-4 w-4 text-primary-light" />
            <span className="text-xs text-text-secondary">Total Distance</span>
          </div>
          <p className="text-xl font-bold text-text-primary">{totalDistance.toLocaleString('en-IN')} km</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="h-4 w-4 text-accent" />
            <span className="text-xs text-text-secondary">Total Expense</span>
          </div>
          <p className="text-xl font-bold text-accent">{formatINR(totalExpense)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            id="trip-search"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {vehicles.length > 0 && (
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full sm:w-48" id="trip-vehicle-filter">
              <Filter className="h-4 w-4 mr-2 text-text-muted" />
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v._id} value={v._id}>{v.make} {v.model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Trip List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold text-text-secondary">No trips found</h3>
          <p className="text-sm text-text-muted mt-1">
            {trips.length === 0 ? 'Log your first trip to get started' : 'Try adjusting your filters'}
          </p>
          {trips.length === 0 && (
            <Link to="/trips/new"><Button className="mt-4" id="log-first-trip"><Plus className="h-4 w-4" /> Log Trip</Button></Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filtered.map((trip, i) => {
            const tollTotal = (trip.tollExpenses || []).reduce((s, t) => s + (t.amount || 0), 0);
            const totalCost = tollTotal + (trip.fuelExpense || 0);
            const isInterstate = trip.startState && trip.endState && trip.startState !== trip.endState;

            return (
              <div key={trip._id || i} className="glass-card-hover p-4 sm:p-5 animate-slide-up" id={`trip-item-${trip._id || i}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/20 mt-0.5">
                      <MapPin className="h-5 w-5 text-success" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-text-primary">
                          {trip.startLocation || 'Start'}
                        </p>
                        <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
                        <p className="text-base font-semibold text-text-primary">
                          {trip.endLocation || 'End'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(trip.startDate || trip.date)}
                        </span>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {trip.distance || 0} km
                        </span>
                        {trip.vehicleId && (
                          <>
                            <span className="text-xs text-text-muted">•</span>
                            <span className="text-xs text-text-muted">{getVehicleName(trip.vehicleId)}</span>
                          </>
                        )}
                        {isInterstate && (
                          <Badge variant="info" className="text-[10px]">
                            Interstate
                          </Badge>
                        )}
                      </div>
                      {trip.notes && <p className="text-xs text-text-muted mt-1 line-clamp-1">{trip.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-accent">{formatINR(totalCost)}</p>
                    {tollTotal > 0 && <p className="text-[10px] text-text-muted">Toll: {formatINR(tollTotal)}</p>}
                    {trip.fuelExpense > 0 && <p className="text-[10px] text-text-muted">Fuel: {formatINR(trip.fuelExpense)}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB for mobile */}
      <Link to="/trips/new" className="fixed right-4 bottom-20 md:hidden z-40" id="fab-add-trip">
        <Button size="icon-lg" className="rounded-full shadow-xl shadow-primary/30 h-14 w-14">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
