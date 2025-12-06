import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package, MapPin, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SamedayBox {
  id: string;
  name: string;
  place: string;
  address: string;
  post_code: string;
}

interface SamedayBoxSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (box: { id: string; label: string }) => void;
  t: (key: string) => string;
}

export const SamedayBoxSelector = ({ isOpen, onClose, onSelect, t }: SamedayBoxSelectorProps) => {
  const [boxes, setBoxes] = useState<SamedayBox[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all boxes and extract cities on mount
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchCities = async () => {
      setLoadingCities(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fulfillment?action=sameday-boxes`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Sameday boxes');
        }

        const data = await response.json();
        
        if (data.success) {
          setCities(data.cities || []);
          // Store all boxes for filtering
          setBoxes(data.boxes || []);
        } else {
          setError(data.error || t('checkout.easyboxLoadError'));
        }
      } catch (err) {
        console.error('Error fetching Sameday boxes:', err);
        setError(t('checkout.easyboxLoadError'));
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [isOpen, t]);

  // Filter boxes by selected city
  const filteredBoxes = useMemo(() => {
    let result = boxes;
    
    if (selectedCity) {
      result = result.filter(box => box.place === selectedCity);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(box => 
        box.name.toLowerCase().includes(term) ||
        box.address.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [boxes, selectedCity, searchTerm]);

  const selectedBox = boxes.find(b => b.id === selectedBoxId);

  const handleConfirmSelection = () => {
    if (selectedBox) {
      const label = `${selectedBox.place}, ${selectedBox.address} — ${selectedBox.name}`;
      onSelect({ id: selectedBox.id, label });
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCity('');
    setSearchTerm('');
    setSelectedBoxId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('checkout.selectEasybox')}
          </DialogTitle>
          <DialogDescription>
            {t('checkout.selectEasyboxDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* City selector */}
          <div className="space-y-2">
            <Label>{t('checkout.selectCity')}</Label>
            <Select
              value={selectedCity || 'all'}
              onValueChange={(value) => {
                setSelectedCity(value === 'all' ? '' : value);
                setSelectedBoxId('');
              }}
              disabled={loadingCities}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingCities ? t('checkout.loading') : t('checkout.selectCityPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-background max-h-[300px]">
                <SelectItem value="all">{t('checkout.allCities')}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search input */}
          <div className="space-y-2">
            <Label>{t('checkout.searchEasybox')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('checkout.searchEasyboxPlaceholder')}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading state */}
          {loadingCities && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-4 text-destructive">
              {error}
            </div>
          )}

          {/* Boxes list */}
          {!loadingCities && !error && (
            <ScrollArea className="flex-1 max-h-[300px] border rounded-lg">
              <div className="p-2 space-y-2">
                {filteredBoxes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('checkout.noEasyboxFound')}
                  </div>
                ) : (
                  filteredBoxes.map((box) => (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => setSelectedBoxId(box.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all hover:border-primary/50",
                        selectedBoxId === box.id 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium truncate">{box.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{box.place}, {box.address}</span>
                          </div>
                        </div>
                        {selectedBoxId === box.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Selected box display */}
          {selectedBox && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">{t('checkout.selectedEasybox')}:</p>
              <p className="font-medium">{selectedBox.name}</p>
              <p className="text-sm">{selectedBox.place}, {selectedBox.address}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            {t('checkout.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmSelection} 
            disabled={!selectedBoxId}
            className="flex-1"
          >
            {t('checkout.selectThisLocker')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SamedayBoxSelector;
