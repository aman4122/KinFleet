import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { indianVehicles } from '@/data/indianVehicles';
import { formatINRFull } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Car, Fuel, Users, Wallet, Zap, Shield, Sparkles } from 'lucide-react';

export default function RecommendPage() {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    budgetMax: 1500000, // 15 Lakhs default
    commuteDistance: 30, // 30 km/day default
    seating: '5',
    bodyType: 'Any'
  });
  const [results, setResults] = useState([]);

  // Smart fuel suggestion based on commute
  const getFuelSuggestion = (km) => {
    if (km < 40) return { type: 'Petrol/EV', desc: 'Best for short city commutes. Lower initial cost.' };
    if (km <= 70) return { type: 'CNG/Hybrid', desc: 'Balances fuel economy and upfront cost for medium commutes.' };
    return { type: 'Diesel/Strong Hybrid', desc: 'Highest efficiency for long highway drives.' };
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const calculateResults = () => {
    const { budgetMax, seating, bodyType, commuteDistance } = preferences;
    
    // Filter logic
    let filtered = indianVehicles.filter(v => v.priceMin <= budgetMax);
    
    if (seating !== 'Any') {
      const seatVal = parseInt(seating);
      if (seatVal >= 8) {
        filtered = filtered.filter(v => v.seating >= 8);
      } else {
        filtered = filtered.filter(v => v.seating === seatVal || (seatVal === 7 && v.seating >= 7));
      }
    }
    
    if (bodyType !== 'Any') {
      filtered = filtered.filter(v => v.segment === bodyType);
    }
    
    // Fuel preference weighting based on commute
    const idealFuel = commuteDistance < 40 ? ['Petrol', 'EV'] : 
                      commuteDistance <= 70 ? ['CNG', 'Hybrid', 'Petrol'] : 
                      ['Diesel', 'Strong Hybrid', 'Diesel'];
                      
    // Sort by relevance (fuel match first, then price)
    filtered.sort((a, b) => {
      const aFuelMatch = idealFuel.includes(a.fuelType) ? 1 : 0;
      const bFuelMatch = idealFuel.includes(b.fuelType) ? 1 : 0;
      if (aFuelMatch !== bFuelMatch) return bFuelMatch - aFuelMatch;
      return a.priceMin - b.priceMin;
    });

    setResults(filtered.slice(0, 10)); // Top 10
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center space-y-2 mb-8">
              <Wallet className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">What's your maximum budget?</h2>
              <p className="text-text-muted">Slide to select your target price range (On-Road approx).</p>
            </div>
            
            <div className="pt-8 pb-4 px-4">
              <input 
                type="range" 
                min="300000" 
                max="5000000" 
                step="100000" 
                value={preferences.budgetMax}
                onChange={(e) => setPreferences({...preferences, budgetMax: parseInt(e.target.value)})}
                className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="mt-6 text-center">
                <span className="text-4xl font-extrabold text-primary">{formatINRFull(preferences.budgetMax)}</span>
              </div>
            </div>
          </div>
        );
      
      case 2:
        const suggestion = getFuelSuggestion(preferences.commuteDistance);
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center space-y-2 mb-8">
              <Fuel className="w-12 h-12 text-accent mx-auto" />
              <h2 className="text-2xl font-bold">Daily Commute Distance</h2>
              <p className="text-text-muted">Helps us recommend the best fuel type (Petrol, Diesel, EV, CNG).</p>
            </div>
            
            <div className="pt-8 pb-4 px-4">
              <input 
                type="range" 
                min="5" 
                max="150" 
                step="5" 
                value={preferences.commuteDistance}
                onChange={(e) => setPreferences({...preferences, commuteDistance: parseInt(e.target.value)})}
                className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="mt-6 text-center">
                <span className="text-4xl font-extrabold text-accent">{preferences.commuteDistance} km</span>
                <span className="text-text-muted"> / day</span>
              </div>
            </div>

            <div className="bg-surface-elevated/50 p-4 rounded-xl border border-border mt-8 flex gap-4 items-start">
              <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Smart Suggestion: <span className="text-primary">{suggestion.type}</span></p>
                <p className="text-sm text-text-muted mt-1">{suggestion.desc}</p>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center space-y-2 mb-8">
              <Users className="w-12 h-12 text-success mx-auto" />
              <h2 className="text-2xl font-bold">Family Size / Seating</h2>
              <p className="text-text-muted">How many people will travel regularly?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {['2', '5', '7', '8'].map(seat => (
                <button
                  key={seat}
                  onClick={() => setPreferences({...preferences, seating: seat})}
                  className={`p-6 rounded-xl border-2 transition-all ${preferences.seating === seat ? 'border-success bg-success/10' : 'border-border bg-surface-card hover:border-success/50'}`}
                >
                  <span className="block text-2xl font-bold mb-1">{seat === '8' ? '8+' : seat}</span>
                  <span className="text-text-muted">Seats</span>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center space-y-2 mb-8">
              <Car className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Preferred Body Type</h2>
              <p className="text-text-muted">What style of car are you looking for?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {['Any', 'Hatchback', 'Sedan', 'SUV', 'MPV'].map(type => (
                <button
                  key={type}
                  onClick={() => setPreferences({...preferences, bodyType: type})}
                  className={`p-4 rounded-xl border-2 transition-all ${preferences.bodyType === type ? 'border-primary bg-primary/10' : 'border-border bg-surface-card hover:border-primary/50'}`}
                >
                  <span className="block font-semibold">{type}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text gradient-primary">Top Recommendations</h2>
              <p className="text-text-muted mt-2">Based on your budget of {formatINRFull(preferences.budgetMax)} and {preferences.commuteDistance}km daily commute</p>
            </div>

            {results.length === 0 ? (
              <div className="text-center p-8 bg-surface-card rounded-xl border border-border">
                <p className="text-lg font-semibold">No exact matches found</p>
                <p className="text-text-muted">Try increasing your budget or changing preferences.</p>
                <Button onClick={() => setStep(1)} variant="outline" className="mt-4">Start Over</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((vehicle, idx) => (
                  <Card key={vehicle.id} className="glass-card overflow-hidden relative">
                    {idx === 0 && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        BEST MATCH
                      </div>
                    )}
                    <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center md:items-start">
                      <div className="w-full md:w-32 h-24 bg-surface-dark rounded-lg flex items-center justify-center text-text-muted border border-border shrink-0">
                        <Car className="w-12 h-12 opacity-20" />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold">{vehicle.make} {vehicle.model}</h3>
                            <p className="text-sm text-text-secondary">{vehicle.variant} • {vehicle.yearModel}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-lg text-primary">{formatINRFull(vehicle.priceMin)}</span>
                            <p className="text-xs text-text-muted">Onwards</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{vehicle.segment}</Badge>
                          <Badge variant="secondary" className={vehicle.fuelType === 'EV' ? 'bg-success/20 text-success' : ''}>{vehicle.fuelType}</Badge>
                          <Badge variant="outline">{vehicle.transmission}</Badge>
                          <Badge variant="outline"><Users className="w-3 h-3 mr-1" /> {vehicle.seating} Seats</Badge>
                        </div>
                        <div className="flex justify-between text-sm text-text-muted pt-2 border-t border-border/50 mt-2">
                          <span className="flex items-center"><Zap className="w-4 h-4 mr-1 text-accent" /> {vehicle.mileage}</span>
                          <span className="flex items-center"><Shield className="w-4 h-4 mr-1 text-success" /> {vehicle.safetyRating}★ Safety</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="text-center pt-6 pb-12">
                  <Button onClick={() => setStep(1)} variant="outline">Start Over</Button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      
      {step < 5 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-text-muted">
            <span>Step {step} of 4</span>
            <span>{step * 25}%</span>
          </div>
          <div className="h-2 w-full bg-surface-dark rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all duration-500 ease-out" 
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>
      )}

      <Card className="glass-card shadow-xl border-t border-l border-white/5">
        <CardContent className="p-6 md:p-10 min-h-[400px] flex flex-col justify-center">
          {renderStep()}
        </CardContent>
      </Card>

      {step < 5 && (
        <div className="flex justify-between items-center px-2">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={step === 1}
            className="text-text-secondary hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext} className="gradient-primary">
              Next Step <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={calculateResults} className="gradient-primary animate-pulse">
              Show Recommendations <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
