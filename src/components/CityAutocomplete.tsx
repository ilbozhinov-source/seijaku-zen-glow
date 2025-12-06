import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// City data with postal codes for each country
interface CityData {
  name: string;
  postalCode: string;
}

// Bulgarian cities with postal codes
const BG_CITIES: CityData[] = [
  { name: 'София', postalCode: '1000' },
  { name: 'Пловдив', postalCode: '4000' },
  { name: 'Варна', postalCode: '9000' },
  { name: 'Бургас', postalCode: '8000' },
  { name: 'Русе', postalCode: '7000' },
  { name: 'Стара Загора', postalCode: '6000' },
  { name: 'Плевен', postalCode: '5800' },
  { name: 'Сливен', postalCode: '8800' },
  { name: 'Добрич', postalCode: '9300' },
  { name: 'Шумен', postalCode: '9700' },
  { name: 'Перник', postalCode: '2300' },
  { name: 'Хасково', postalCode: '6300' },
  { name: 'Ямбол', postalCode: '8600' },
  { name: 'Пазарджик', postalCode: '4400' },
  { name: 'Благоевград', postalCode: '2700' },
  { name: 'Велико Търново', postalCode: '5000' },
  { name: 'Враца', postalCode: '3000' },
  { name: 'Габрово', postalCode: '5300' },
  { name: 'Видин', postalCode: '3700' },
  { name: 'Асеновград', postalCode: '4230' },
  { name: 'Казанлък', postalCode: '6100' },
  { name: 'Кърджали', postalCode: '6600' },
  { name: 'Кюстендил', postalCode: '2500' },
  { name: 'Монтана', postalCode: '3400' },
  { name: 'Димитровград', postalCode: '6400' },
  { name: 'Ловеч', postalCode: '5500' },
  { name: 'Силистра', postalCode: '7500' },
  { name: 'Търговище', postalCode: '7700' },
  { name: 'Разград', postalCode: '7200' },
  { name: 'Смолян', postalCode: '4700' },
  { name: 'Петрич', postalCode: '2850' },
  { name: 'Сандански', postalCode: '2800' },
  { name: 'Самоков', postalCode: '2000' },
  { name: 'Дупница', postalCode: '2600' },
  { name: 'Свищов', postalCode: '5250' },
  { name: 'Нова Загора', postalCode: '8900' },
  { name: 'Карлово', postalCode: '4300' },
  { name: 'Троян', postalCode: '5600' },
  { name: 'Севлиево', postalCode: '5400' },
  { name: 'Горна Оряховица', postalCode: '5100' },
  { name: 'Банско', postalCode: '2770' },
  { name: 'Несебър', postalCode: '8230' },
  { name: 'Созопол', postalCode: '8130' },
  { name: 'Поморие', postalCode: '8200' },
  { name: 'Приморско', postalCode: '8180' },
  { name: 'Царево', postalCode: '8260' },
  { name: 'Айтос', postalCode: '8500' },
  { name: 'Карнобат', postalCode: '8400' },
  { name: 'Раднево', postalCode: '6260' },
  { name: 'Ботевград', postalCode: '2140' },
];

// Greek cities with postal codes
const GR_CITIES: CityData[] = [
  { name: 'Athens / Αθήνα', postalCode: '10431' },
  { name: 'Thessaloniki / Θεσσαλονίκη', postalCode: '54621' },
  { name: 'Patras / Πάτρα', postalCode: '26221' },
  { name: 'Heraklion / Ηράκλειο', postalCode: '71201' },
  { name: 'Larissa / Λάρισα', postalCode: '41221' },
  { name: 'Volos / Βόλος', postalCode: '38221' },
  { name: 'Ioannina / Ιωάννινα', postalCode: '45221' },
  { name: 'Trikala / Τρίκαλα', postalCode: '42100' },
  { name: 'Chalkida / Χαλκίδα', postalCode: '34100' },
  { name: 'Serres / Σέρρες', postalCode: '62121' },
  { name: 'Alexandroupoli / Αλεξανδρούπολη', postalCode: '68100' },
  { name: 'Xanthi / Ξάνθη', postalCode: '67100' },
  { name: 'Katerini / Κατερίνη', postalCode: '60100' },
  { name: 'Kalamata / Καλαμάτα', postalCode: '24100' },
  { name: 'Kavala / Καβάλα', postalCode: '65201' },
  { name: 'Chania / Χανιά', postalCode: '73100' },
  { name: 'Lamia / Λαμία', postalCode: '35100' },
  { name: 'Komotini / Κομοτηνή', postalCode: '69100' },
  { name: 'Rhodes / Ρόδος', postalCode: '85100' },
  { name: 'Drama / Δράμα', postalCode: '66100' },
  { name: 'Veria / Βέροια', postalCode: '59100' },
  { name: 'Kozani / Κοζάνη', postalCode: '50100' },
  { name: 'Corfu / Κέρκυρα', postalCode: '49100' },
  { name: 'Tripoli / Τρίπολη', postalCode: '22100' },
  { name: 'Rethymno / Ρέθυμνο', postalCode: '74100' },
  { name: 'Piraeus / Πειραιάς', postalCode: '18531' },
  { name: 'Agrinio / Αγρίνιο', postalCode: '30100' },
  { name: 'Chalkidiki / Χαλκιδική', postalCode: '63100' },
  { name: 'Mykonos / Μύκονος', postalCode: '84600' },
  { name: 'Santorini / Σαντορίνη', postalCode: '84700' },
];

// Romanian cities with postal codes
const RO_CITIES: CityData[] = [
  { name: 'București', postalCode: '010011' },
  { name: 'Cluj-Napoca', postalCode: '400001' },
  { name: 'Timișoara', postalCode: '300001' },
  { name: 'Iași', postalCode: '700001' },
  { name: 'Constanța', postalCode: '900001' },
  { name: 'Craiova', postalCode: '200001' },
  { name: 'Brașov', postalCode: '500001' },
  { name: 'Galați', postalCode: '800001' },
  { name: 'Ploiești', postalCode: '100001' },
  { name: 'Oradea', postalCode: '410001' },
  { name: 'Brăila', postalCode: '810001' },
  { name: 'Arad', postalCode: '310001' },
  { name: 'Pitești', postalCode: '110001' },
  { name: 'Sibiu', postalCode: '550001' },
  { name: 'Bacău', postalCode: '600001' },
  { name: 'Târgu Mureș', postalCode: '540001' },
  { name: 'Baia Mare', postalCode: '430001' },
  { name: 'Buzău', postalCode: '120001' },
  { name: 'Botoșani', postalCode: '710001' },
  { name: 'Satu Mare', postalCode: '440001' },
  { name: 'Râmnicu Vâlcea', postalCode: '240001' },
  { name: 'Drobeta-Turnu Severin', postalCode: '220001' },
  { name: 'Suceava', postalCode: '720001' },
  { name: 'Piatra Neamț', postalCode: '610001' },
  { name: 'Târgu Jiu', postalCode: '210001' },
  { name: 'Focșani', postalCode: '620001' },
  { name: 'Bistrița', postalCode: '420001' },
  { name: 'Tulcea', postalCode: '820001' },
  { name: 'Reșița', postalCode: '320001' },
  { name: 'Alba Iulia', postalCode: '510001' },
];

// Map country codes to city data
const CITIES_BY_COUNTRY: Record<string, CityData[]> = {
  BG: BG_CITIES,
  GR: GR_CITIES,
  RO: RO_CITIES,
};

interface CityAutocompleteProps {
  country: string;
  value: string;
  postalCode: string;
  onCityChange: (city: string) => void;
  onPostalCodeChange: (postalCode: string) => void;
  cityLabel: string;
  postalCodeLabel: string;
  required?: boolean;
  disabled?: boolean;
}

export const CityAutocomplete = ({
  country,
  value,
  postalCode,
  onCityChange,
  onPostalCodeChange,
  cityLabel,
  postalCodeLabel,
  required = false,
  disabled = false,
}: CityAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get cities for current country
  const cities = useMemo(() => {
    return CITIES_BY_COUNTRY[country] || [];
  }, [country]);

  // Filter cities based on search term
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return cities.slice(0, 20); // Show first 20 by default
    const term = searchTerm.toLowerCase();
    return cities.filter(city => 
      city.name.toLowerCase().includes(term) ||
      city.postalCode.includes(term)
    );
  }, [cities, searchTerm]);

  // Sync external value with internal search term
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Reset when country changes
  useEffect(() => {
    setSearchTerm('');
    onCityChange('');
    onPostalCodeChange('');
  }, [country]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If user typed something but didn't select, keep their input
        if (searchTerm !== value) {
          onCityChange(searchTerm);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm, value, onCityChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If user clears input, clear postal code too
    if (!newValue.trim()) {
      onPostalCodeChange('');
    }
  };

  const handleSelectCity = (city: CityData) => {
    setSearchTerm(city.name);
    onCityChange(city.name);
    onPostalCodeChange(city.postalCode);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (cities.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on option to register
    setTimeout(() => {
      if (searchTerm !== value) {
        onCityChange(searchTerm);
      }
    }, 150);
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-2" ref={containerRef}>
        <Label htmlFor="city">{cityLabel} {required && '*'}</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="city"
            name="city"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={cities.length > 0 ? '' : ''}
            disabled={disabled || cities.length === 0}
            required={required}
            className="pl-10"
            autoComplete="off"
          />
          
          {/* Dropdown list */}
          {isOpen && filteredCities.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg">
              <ScrollArea className="h-[250px]">
                <div className="p-1">
                  {filteredCities.map((city, index) => (
                    <button
                      key={`${city.name}-${index}`}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between gap-2",
                        value === city.name && "bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === city.name ? "opacity-100 text-primary" : "opacity-0"
                          )}
                        />
                        <span className="font-medium">{city.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{city.postalCode}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="postalCode">{postalCodeLabel} {required && '*'}</Label>
        <Input
          id="postalCode"
          name="postalCode"
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
};

export default CityAutocomplete;
