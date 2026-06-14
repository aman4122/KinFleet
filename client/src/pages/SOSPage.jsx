import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import vehicleService from '@/services/vehicleService';
import contactService from '@/services/contactService';
import sosService from '@/services/sosService';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertTriangle, MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function SOSPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [sosContacts, setSosContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    fetchData();
    requestLocation();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, contactsRes] = await Promise.all([
        vehicleService.getVehicles(),
        contactService.getContacts()
      ]);
      setVehicles(vehiclesRes.data || []);
      if (vehiclesRes.data && vehiclesRes.data.length > 0) {
        setSelectedVehicle(vehiclesRes.data[0]._id);
      }
      setSosContacts((contactsRes.data || []).filter(c => c.isSosContact));
    } catch (err) {
      toast.error('Failed to load SOS data');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
        setLocationError('Please allow location access to use SOS effectively.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSOSTrigger = async () => {
    if (!location) {
      toast.error('Location is required. Attempting to fetch location...');
      requestLocation();
      return;
    }
    if (sosContacts.length === 0) {
      toast.error('No SOS contacts found. Please add contacts first.');
      return;
    }
    
    try {
      setTriggering(true);
      await sosService.triggerSOS(location.lat, location.lng, selectedVehicle);
      toast.success('EMERGENCY ALERT SENT SUCCESSFULLY!', {
        duration: 5000,
        style: { background: '#EF4444', color: '#fff', border: 'none' }
      });
    } catch (err) {
      toast.error('Failed to send SOS alert. Please call emergency services directly!');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-danger">EMERGENCY SOS</h1>
          <p className="text-text-secondary">Tap the button below to instantly broadcast your location to your emergency contacts.</p>
        </div>

        <div className="flex justify-center my-12">
          <button 
            onClick={handleSOSTrigger}
            disabled={triggering}
            className="w-64 h-64 rounded-full gradient-danger flex items-center justify-center shadow-2xl sos-btn relative group disabled:opacity-80"
          >
            {triggering ? (
              <Loader2 className="w-24 h-24 text-white animate-spin" />
            ) : (
              <AlertTriangle className="w-24 h-24 text-white transition-transform group-hover:scale-110" />
            )}
            <div className="absolute -bottom-8 text-danger font-bold tracking-widest animate-pulse">
              {triggering ? 'BROADCASTING...' : 'TAP FOR HELP'}
            </div>
          </button>
        </div>

        <Card className="glass-card border-danger/30">
          <CardContent className="p-6 space-y-4">
            
            <div>
              <Label className="text-text-muted mb-2 block">Affected Vehicle (Optional)</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="bg-surface-dark border-border">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not in a vehicle / Unlisted</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v._id} value={v._id}>{v.make} {v.model} ({v.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-surface-dark rounded-lg border border-border flex items-start gap-3">
              <MapPin className={`w-5 h-5 mt-0.5 ${location ? 'text-success' : 'text-danger'}`} />
              <div>
                <p className="font-semibold">{location ? 'Location Ready' : 'Location Not Available'}</p>
                <p className="text-xs text-text-muted">
                  {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : locationError}
                </p>
                {!location && (
                  <Button variant="link" size="sm" onClick={requestLocation} className="p-0 h-auto text-primary mt-1">
                    Try Again
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 bg-surface-dark rounded-lg border border-border flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 text-accent" />
              <div>
                <p className="font-semibold">Will Notify {sosContacts.length} Contacts</p>
                <p className="text-xs text-text-muted">
                  {sosContacts.slice(0, 3).map(c => c.name).join(', ')}
                  {sosContacts.length > 3 && ` +${sosContacts.length - 3} more`}
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
