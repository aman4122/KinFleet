import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import fleetService from '@/services/fleetService';
import authService from '@/services/authService';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Shield, Copy, LogOut, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [fleetInfo, setFleetInfo] = useState(null);
  const [joinFleetId, setJoinFleetId] = useState('');
  const [loading, setLoading] = useState(false);

  // In a real app, we'd fetch fleetInfo on mount
  // Mocking it for now based on user data
  React.useEffect(() => {
    if (user?.familyFleetId) {
      setFleetInfo({
        id: user.familyFleetId,
        role: user.familyRole || 'owner',
        members: 1
      });
    } else if (user?.linkedFleetId) {
      setFleetInfo({
        id: user.linkedFleetId,
        role: 'member',
        members: 2
      });
    }
  }, [user]);

  const copyFleetId = () => {
    if (!fleetInfo?.id) return;
    navigator.clipboard.writeText(fleetInfo.id);
    setCopied(true);
    toast.success('Fleet ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinFleet = async (e) => {
    e.preventDefault();
    if (!joinFleetId.trim()) return;
    
    try {
      setLoading(true);
      await fleetService.joinFleet({ fleetId: joinFleetId });
      toast.success('Successfully joined family fleet');
      // Reload page to get new token/data
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join fleet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile & Settings</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-text-muted">Full Name</Label>
              <p className="font-medium text-lg">{user?.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-text-muted">Email</Label>
              <p className="font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-text-secondary" /> {user?.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-text-muted">Phone Number</Label>
              <p className="font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-text-secondary" /> {user?.phone}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-text-muted">Account Status</Label>
              <div><Badge variant="success">Active</Badge></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Family Fleet Settings</CardTitle>
          <CardDescription>Share vehicles and track together with family members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {fleetInfo ? (
            <div className="p-4 bg-surface-dark rounded-xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    My Family Fleet 
                    <Badge variant={fleetInfo.role === 'owner' ? 'default' : 'outline'}>
                      {fleetInfo.role.toUpperCase()}
                    </Badge>
                  </h3>
                  <p className="text-sm text-text-muted mt-1">{fleetInfo.members} Members</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Fleet Invite Code</Label>
                <div className="flex gap-2">
                  <Input readOnly value={fleetInfo.id} className="font-mono text-primary bg-surface-elevated" />
                  <Button variant="secondary" onClick={copyFleetId}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-text-muted">Share this code with family members to let them track your vehicles.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinFleet} className="p-4 bg-surface-dark rounded-xl border border-border space-y-4">
              <div className="space-y-2">
                <Label>Join Existing Family Fleet</Label>
                <div className="flex gap-2">
                  <Input 
                    value={joinFleetId} 
                    onChange={e => setJoinFleetId(e.target.value)} 
                    placeholder="Enter Fleet ID Code" 
                    className="font-mono"
                  />
                  <Button type="submit" disabled={!joinFleetId.trim() || loading} className="gradient-primary">
                    Join
                  </Button>
                </div>
                <p className="text-xs text-text-muted">Ask the primary owner for their Fleet Invite Code.</p>
              </div>
            </form>
          )}

        </CardContent>
      </Card>

      <div className="flex justify-center pt-8">
        <Button variant="destructive" onClick={logout} className="w-full md:w-auto px-8 gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

    </div>
  );
}
