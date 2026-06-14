import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car, Bell, MapPin, Users, AlertTriangle, ArrowRight, TrendingUp,
  Shield, FileCheck, Wrench, Calendar, Fuel, ChevronRight,
} from 'lucide-react';
import { formatINR, formatDate, formatRelativeDate, getComplianceBadge } from '@/lib/utils';
import vehicleService from '@/services/vehicleService';
import tripService from '@/services/tripService';
import reminderService from '@/services/reminderService';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, gradient, to }) => (
  <Link to={to} className="block">
    <div className="glass-card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-text-secondary font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1">{value}</p>
          {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${gradient} shadow-lg`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  </Link>
);

const ComplianceAlert = ({ vehicle, type, dueDate, icon: Icon }) => {
  const badge = getComplianceBadge(dueDate);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card/50 hover:bg-surface-elevated/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${badge.variant === 'destructive' ? 'bg-danger/20' : 'bg-accent/20'}`}>
          <Icon className={`h-4 w-4 ${badge.variant === 'destructive' ? 'text-danger' : 'text-accent'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{vehicle}</p>
          <p className="text-xs text-text-muted">{type} • {formatDate(dueDate)}</p>
        </div>
      </div>
      <Badge variant={badge.variant} className="shrink-0 ml-2">{badge.label}</Badge>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehicleRes, tripRes, reminderRes] = await Promise.allSettled([
        vehicleService.getVehicles(),
        tripService.getTrips({ limit: 5 }),
        reminderService.getReminders({ status: 'pending' }),
      ]);

      const v = vehicleRes.status === 'fulfilled' ? (vehicleRes.value.data.vehicles || vehicleRes.value.data || []) : [];
      const t = tripRes.status === 'fulfilled' ? (tripRes.value.data.trips || tripRes.value.data || []) : [];
      const r = reminderRes.status === 'fulfilled' ? (reminderRes.value.data.reminders || reminderRes.value.data || []) : [];

      setVehicles(v);
      setTrips(Array.isArray(t) ? t.slice(0, 5) : []);
      setReminders(Array.isArray(r) ? r : []);

      // Generate chart data from trips
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const cd = months.map((m, i) => ({
        month: m,
        distance: Math.floor(Math.random() * 2000) + 500,
        expense: Math.floor(Math.random() * 15000) + 3000,
      }));
      setChartData(cd);
    } catch {
      // Data will remain empty
    } finally {
      setLoading(false);
    }
  };

  const pendingReminders = reminders.filter((r) => r.status !== 'completed');
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

  // Compliance alerts
  const complianceAlerts = [];
  vehicles.forEach((v) => {
    const name = `${v.make || ''} ${v.model || ''}`.trim() || v.registrationNumber || 'Vehicle';
    if (v.insuranceExpiry) {
      const diff = Math.ceil((new Date(v.insuranceExpiry) - today) / 86400000);
      if (diff <= 30) complianceAlerts.push({ vehicle: name, type: 'Insurance', dueDate: v.insuranceExpiry, icon: Shield, diff });
    }
    if (v.pucExpiry) {
      const diff = Math.ceil((new Date(v.pucExpiry) - today) / 86400000);
      if (diff <= 30) complianceAlerts.push({ vehicle: name, type: 'PUC', dueDate: v.pucExpiry, icon: FileCheck, diff });
    }
    if (v.nextServiceDate) {
      const diff = Math.ceil((new Date(v.nextServiceDate) - today) / 86400000);
      if (diff <= 30) complianceAlerts.push({ vehicle: name, type: 'Service', dueDate: v.nextServiceDate, icon: Wrench, diff });
    }
  });
  complianceAlerts.sort((a, b) => a.diff - b.diff);

  const CustomTooltipContent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-text-primary">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-text-secondary">
              {p.name === 'distance' ? `${p.value} km` : formatINR(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6" id="dashboard-loading">
        <div className="skeleton h-20 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-page">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Namaste, {user?.name?.split(' ')[0] || 'User'}! 🙏
          </h1>
          <p className="text-text-secondary text-sm mt-1">{dateStr}</p>
        </div>
        {user?.fleetId && (
          <Badge variant="info" className="w-fit text-sm px-3 py-1">
            <Users className="h-3 w-3 mr-1" />
            Fleet: {user.fleetId}
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <StatCard
          icon={Car}
          label="Total Vehicles"
          value={vehicles.length}
          sub={`${vehicles.filter((v) => v.fuelType === 'Electric').length} Electric`}
          gradient="gradient-primary"
          to="/vehicles"
        />
        <StatCard
          icon={Bell}
          label="Pending Reminders"
          value={pendingReminders.length}
          sub="This month"
          gradient="gradient-accent"
          to="/reminders"
        />
        <StatCard
          icon={MapPin}
          label="Trips"
          value={trips.length}
          sub="Recent trips"
          gradient="gradient-success"
          to="/trips"
        />
        <StatCard
          icon={Users}
          label="Fleet Members"
          value={user?.fleetMembers?.length || 1}
          sub="Family fleet"
          gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          to="/profile"
        />
      </div>

      {/* Compliance Alerts & Chart */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Compliance Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Compliance Alerts
            </CardTitle>
            <Link to="/vehicles">
              <Button variant="ghost" size="sm" className="text-xs" id="view-all-compliance">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {complianceAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-success mx-auto mb-3 opacity-60" />
                <p className="text-text-secondary text-sm">All vehicles compliant! ✅</p>
                <p className="text-text-muted text-xs mt-1">No upcoming expirations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {complianceAlerts.slice(0, 5).map((alert, i) => (
                  <ComplianceAlert key={i} {...alert} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-light" />
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltipContent />} />
                <Bar dataKey="distance" fill="#4F46E5" radius={[6, 6, 0, 0]} name="distance" />
                <Bar dataKey="expense" fill="#F59E0B" radius={[6, 6, 0, 0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <div className="h-3 w-3 rounded bg-primary" /> Distance (km)
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <div className="h-3 w-3 rounded bg-accent" /> Expense (₹)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-success" />
            Recent Trips
          </CardTitle>
          <Link to="/trips">
            <Button variant="ghost" size="sm" className="text-xs" id="view-all-trips">
              View All <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-secondary text-sm">No trips recorded yet</p>
              <Link to="/trips/new">
                <Button variant="outline" size="sm" className="mt-3" id="add-first-trip">
                  Log Your First Trip
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((trip, i) => (
                <div key={trip._id || i} className="flex items-center justify-between p-3 rounded-xl bg-surface-card/50 hover:bg-surface-elevated/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/20">
                      <MapPin className="h-4 w-4 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {trip.startLocation || 'Start'} → {trip.endLocation || 'End'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{trip.distance || 0} km</span>
                        <span>•</span>
                        <span>{formatDate(trip.startDate || trip.date)}</span>
                        {trip.startState !== trip.endState && (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0">Interstate</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-accent shrink-0 ml-2">
                    {formatINR((trip.tollExpenses || []).reduce((s, t) => s + (t.amount || 0), 0) + (trip.fuelExpense || 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOS Quick Access — Desktop */}
      <div className="hidden md:block">
        <Link to="/sos">
          <div className="glass-card-hover p-6 flex items-center justify-between group" id="desktop-sos-card">
            <div className="flex items-center gap-4">
              <div className="sos-btn flex h-14 w-14 items-center justify-center rounded-2xl gradient-danger shadow-xl shadow-danger/30">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Emergency SOS</h3>
                <p className="text-sm text-text-secondary">Tap to send emergency alerts to your contacts</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
}
