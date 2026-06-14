import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import reminderService from '@/services/reminderService';
import vehicleService from '@/services/vehicleService';
import { formatDate, getComplianceBadge } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, Wrench, Shield, FileText, CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Custom',
    vehicleId: '',
    dueDate: '',
    isRecurring: false,
    recurringDays: 30,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remindersRes, vehiclesRes] = await Promise.all([
        reminderService.getReminders(),
        vehicleService.getVehicles()
      ]);
      setReminders(remindersRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'Service': return <Wrench className="w-5 h-5 text-accent" />;
      case 'Insurance': return <Shield className="w-5 h-5 text-success" />;
      case 'PUC': return <FileText className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-text-muted" />;
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await reminderService.createReminder(formData);
      toast.success('Reminder added');
      setIsAddDialogOpen(false);
      setFormData({ title: '', type: 'Custom', vehicleId: '', dueDate: '', isRecurring: false, recurringDays: 30, description: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to add reminder');
    }
  };

  const handleComplete = async (id) => {
    try {
      await reminderService.completeReminder(id);
      toast.success('Reminder marked as complete');
      fetchData();
    } catch (err) {
      toast.error('Failed to update reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await reminderService.deleteReminder(id);
      toast.success('Reminder deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Notified';
    if (activeTab === 'completed') return r.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Add New Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Renew Fastag" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="PUC">PUC</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle (Optional)</Label>
                  <Select value={formData.vehicleId} onValueChange={v => setFormData({ ...formData, vehicleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {vehicles.map(v => (
                        <SelectItem key={v._id} value={v._id}>{v.make} {v.model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="recurring" checked={formData.isRecurring} onCheckedChange={c => setFormData({ ...formData, isRecurring: c })} />
                <Label htmlFor="recurring">Is Recurring?</Label>
              </div>
              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label>Recurring Interval (Days)</Label>
                  <Input type="number" required min="1" value={formData.recurringDays} onChange={e => setFormData({ ...formData, recurringDays: e.target.value })} />
                </div>
              )}
              <Button type="submit" className="w-full gradient-primary">Save Reminder</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending & Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Reminders</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center text-text-muted py-8">Loading reminders...</div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center text-text-muted py-8 bg-surface-card rounded-xl border border-border">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No reminders found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredReminders.map(reminder => {
                const vehicle = vehicles.find(v => v._id === reminder.vehicleId);
                const badgeInfo = getComplianceBadge(reminder.dueDate);
                return (
                  <Card key={reminder._id} className="glass-card">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="p-3 bg-surface-dark rounded-full">
                        {getIconForType(reminder.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{reminder.title}</h3>
                          <Badge variant={reminder.status === 'Completed' ? 'success' : badgeInfo.variant}>
                            {reminder.status === 'Completed' ? 'Completed' : (reminder.status === 'Overdue' ? 'Overdue' : 'Pending')}
                          </Badge>
                        </div>
                        {vehicle && <p className="text-sm text-text-muted mt-1">{vehicle.make} {vehicle.model}</p>}
                        <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(reminder.dueDate)}</span>
                          {reminder.isRecurring && <span className="flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> {reminder.recurringDays} days</span>}
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-surface-dark/50 p-3 px-5 flex justify-end gap-2 border-t border-border/50">
                      {reminder.status !== 'Completed' && (
                        <Button variant="outline" size="sm" onClick={() => handleComplete(reminder._id)} className="text-success hover:text-success hover:bg-success/10 border-success/30">
                          <CheckCircle className="w-4 h-4 mr-1" /> Complete
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(reminder._id)} className="text-danger hover:text-danger hover:bg-danger/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Ensure RefreshCcw is imported at the top
import { RefreshCcw } from 'lucide-react';
