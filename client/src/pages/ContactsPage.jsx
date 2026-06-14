import React, { useState, useEffect } from 'react';
import contactService from '@/services/contactService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Phone, MessageSquare, AlertTriangle, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: 'Family',
    isSosContact: true,
    whatsappEnabled: true
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await contactService.getContacts();
      setContacts(res.data || []);
    } catch (err) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await contactService.createContact(formData);
      toast.success('Contact added');
      setIsAddDialogOpen(false);
      setFormData({ name: '', phone: '', relationship: 'Family', isSosContact: true, whatsappEnabled: true });
      fetchContacts();
    } catch (err) {
      toast.error('Failed to add contact');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await contactService.deleteContact(id);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (err) {
      toast.error('Failed to delete contact');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Emergency Contacts</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <UserPlus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="space-y-2">
                <Label>Phone (10 digits)</Label>
                <div className="flex gap-2">
                  <div className="bg-surface-elevated px-3 py-2 rounded-md border border-border flex items-center justify-center text-text-muted">+91</div>
                  <Input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').substring(0, 10) })} placeholder="9876543210" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select value={formData.relationship} onValueChange={v => setFormData({ ...formData, relationship: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Family">Family</SelectItem>
                    <SelectItem value="Fleet Manager">Fleet Manager</SelectItem>
                    <SelectItem value="Roadside Assistance">Roadside Assistance</SelectItem>
                    <SelectItem value="Mechanic">Mechanic</SelectItem>
                    <SelectItem value="Insurance Agent">Insurance Agent</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between border border-border p-3 rounded-lg bg-surface-dark/30">
                  <div>
                    <Label className="font-semibold text-danger flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> SOS Alerts</Label>
                    <p className="text-xs text-text-muted">Receive automated distress messages</p>
                  </div>
                  <Switch checked={formData.isSosContact} onCheckedChange={c => setFormData({ ...formData, isSosContact: c })} />
                </div>
                <div className="flex items-center justify-between border border-border p-3 rounded-lg bg-surface-dark/30">
                  <div>
                    <Label className="font-semibold text-success flex items-center gap-1"><MessageSquare className="w-4 h-4" /> WhatsApp Enabled</Label>
                    <p className="text-xs text-text-muted">Contact has WhatsApp on this number</p>
                  </div>
                  <Switch checked={formData.whatsappEnabled} onCheckedChange={c => setFormData({ ...formData, whatsappEnabled: c })} />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary mt-4">Save Contact</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-center text-text-muted py-8 col-span-full">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center text-text-muted py-12 bg-surface-card rounded-xl border border-border col-span-full">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No emergency contacts added yet.</p>
            <p className="text-sm mt-2">Add contacts to ensure they receive alerts during an SOS emergency.</p>
          </div>
        ) : (
          contacts.map(contact => (
            <Card key={contact._id} className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{contact.name}</h3>
                      <Badge variant="outline" className="mt-1">{contact.relationship}</Badge>
                    </div>
                    {contact.isSosContact && (
                      <Badge variant="destructive" className="bg-danger/20 text-danger border-danger/50 animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" /> SOS Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Phone className="w-4 h-4" />
                    <span className="font-mono">{contact.phone}</span>
                  </div>
                  {contact.whatsappEnabled && (
                    <div className="flex items-center gap-2 text-success mt-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">WhatsApp Enabled</span>
                    </div>
                  )}
                </div>
                <div className="bg-surface-dark p-3 flex justify-end gap-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(contact._id)} className="text-danger hover:text-danger hover:bg-danger/10">
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
