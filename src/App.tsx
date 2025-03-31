import React, { useState, useEffect, useCallback } from 'react';
import { Hash, Monitor, Laptop, Keyboard, Mouse, Printer, HardDrive, Plus, X, Trash2, Server } from 'lucide-react';

// --- Icon Mapping ---
// Helper to map stored icon IDs back to actual components
const iconMap: { [key: string]: React.ElementType } = {
    laptop: Laptop,
    desktop: Monitor,
    keyboard: Keyboard,
    mouse: Mouse,
    printer: Printer,
    storage: HardDrive,
    server: Server,
    default: HardDrive // Default icon for custom types or if lookup fails
};

const getIconComponent = (iconId: string | undefined): React.ElementType => {
    return iconId && iconMap[iconId] ? iconMap[iconId] : iconMap.default;
};

// --- Asset Type Definition ---
type AssetType = {
    id: string; // Unique identifier (e.g., 'laptop', 'custom-server')
    name: string;
    prefix: string;
    icon: React.ElementType; // The actual component for rendering
    iconId: string;          // A string key to identify the icon for storage ('laptop', 'default')
    rangeStart: number;
    rangeEnd: number;
    isDefault: boolean;     // Flag to identify original default types
};

// --- LocalStorage Keys ---
const ASSET_TYPES_STORAGE_KEY = 'assetTypesState_v1'; // Added versioning
const ASSET_COUNTERS_STORAGE_KEY = 'assetCountersState_v1';

// --- Default Asset Types ---
// Now include iconId and isDefault flag
const defaultAssetTypes: AssetType[] = [
    { id: 'laptop', name: 'Laptop', prefix: 'LT', icon: Laptop, iconId: 'laptop', rangeStart: 1, rangeEnd: 1000, isDefault: true },
    { id: 'desktop', name: 'Desktop PC', prefix: 'PC', icon: Monitor, iconId: 'desktop', rangeStart: 1001, rangeEnd: 2000, isDefault: true },
    { id: 'keyboard', name: 'Keyboard', prefix: 'KB', icon: Keyboard, iconId: 'keyboard', rangeStart: 2001, rangeEnd: 3000, isDefault: true },
    { id: 'mouse', name: 'Mouse', prefix: 'MS', icon: Mouse, iconId: 'mouse', rangeStart: 3001, rangeEnd: 4000, isDefault: true },
    { id: 'printer', name: 'Printer', prefix: 'PR', icon: Printer, iconId: 'printer', rangeStart: 4001, rangeEnd: 5000, isDefault: true },
    { id: 'storage', name: 'Storage Device', prefix: 'SD', icon: HardDrive, iconId: 'storage', rangeStart: 5001, rangeEnd: 6000, isDefault: true },
    // { id: 'server', name: 'Server', prefix: 'SV', icon: Server, iconId: 'server', rangeStart: 6001, rangeEnd: 7000, isDefault: true },
];

// --- Helper Functions ---

// Function to load asset types from localStorage
const loadAssetTypes = (): AssetType[] => {
    try {
        const storedValue = localStorage.getItem(ASSET_TYPES_STORAGE_KEY);
        if (storedValue) {
            const parsedTypes: Omit<AssetType, 'icon'>[] = JSON.parse(storedValue);
            // Restore the icon component based on iconId
            return parsedTypes.map(type => ({
                ...type,
                icon: getIconComponent(type.iconId)
            }));
        }
    } catch (error) {
        console.error("Error loading asset types from localStorage:", error);
        // Fallback or clear corrupted data
        // localStorage.removeItem(ASSET_TYPES_STORAGE_KEY);
    }
    // Return defaults if nothing stored or error occurs
    return defaultAssetTypes.map(type => ({ ...type })); // Return a copy
};

// Function to load counters from localStorage
const loadCounters = (): Map<string, number> => {
    try {
        const storedValue = localStorage.getItem(ASSET_COUNTERS_STORAGE_KEY);
        if (storedValue) {
            // localStorage stores array of [key, value] pairs for Map
            const parsedArray: [string, number][] = JSON.parse(storedValue);
            return new Map(parsedArray);
        }
    } catch (error) {
        console.error("Error loading counters from localStorage:", error);
         // Fallback or clear corrupted data
        // localStorage.removeItem(ASSET_COUNTERS_STORAGE_KEY);
    }
    // Return empty map if nothing stored or error occurs
    return new Map();
};

// Generator function remains the same as the previous sequential version
function generateNextAssetNumber(
    assetType: AssetType,
    lastGeneratedCounters: Map<string, number>
): { assetNumber: string; nextCounterValue: number } | null {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = assetType.prefix;
    const { rangeStart, rangeEnd } = assetType;
    const keyPrefix = `${prefix}${year}${month}`;

    const lastUsedNumber = lastGeneratedCounters.get(keyPrefix) ?? (rangeStart - 1);
    const nextNumber = lastUsedNumber + 1;

    if (nextNumber > rangeEnd) {
        console.warn(`Range ${rangeStart}-${rangeEnd} exhausted for ${keyPrefix}.`);
        alert(`Error: The number range (${rangeStart}-${rangeEnd}) for ${assetType.name} (${prefix}) is full for the current month (${year}-${month}).`);
        return null;
    }

    const formattedNum = nextNumber.toString().padStart(4, '0');
    const assetNumber = `${keyPrefix}${formattedNum}`;
    return { assetNumber, nextCounterValue: nextNumber };
}


// --- React Component ---
function App() {
    // Initialize state from localStorage using initializer functions
    const [assetTypes, setAssetTypes] = useState<AssetType[]>(loadAssetTypes);
    const [lastGeneratedCounters, setLastGeneratedCounters] = useState<Map<string, number>>(loadCounters);

    // Other state remains the same
    const [selectedType, setSelectedType] = useState<string>(() => {
         // Initialize selectedType based on loaded assetTypes
        const loadedTypes = loadAssetTypes(); // Load again or use initial value
        return loadedTypes[0]?.id || '';
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAssetType, setNewAssetType] = useState({ name: '', prefix: '' });
    const [generatedNumber, setGeneratedNumber] = useState<string>('');

    // --- useEffect Hooks for Saving State ---

    // Save assetTypes to localStorage whenever it changes
    useEffect(() => {
        try {
            // Prepare for storage: remove the non-serializable 'icon' component
            const typesToStore = assetTypes.map(({ icon, ...rest }) => rest);
            localStorage.setItem(ASSET_TYPES_STORAGE_KEY, JSON.stringify(typesToStore));
        } catch (error) {
            console.error("Error saving asset types to localStorage:", error);
            alert("Warning: Could not save asset type changes. Local storage might be full or disabled.");
        }
    }, [assetTypes]);

    // Save counters to localStorage whenever it changes
    useEffect(() => {
        try {
            // Convert Map to array for JSON stringification
            const countersArray = Array.from(lastGeneratedCounters.entries());
            localStorage.setItem(ASSET_COUNTERS_STORAGE_KEY, JSON.stringify(countersArray));
        } catch (error) {
            console.error("Error saving counters to localStorage:", error);
            alert("Warning: Could not save numbering progress. Local storage might be full or disabled.");
        }
    }, [lastGeneratedCounters]);

    // --- Event Handlers ---

    const handleGenerate = useCallback(() => {
        const asset = assetTypes.find(type => type.id === selectedType);
        if (asset) {
            const result = generateNextAssetNumber(asset, lastGeneratedCounters);
            if (result) {
                const { assetNumber, nextCounterValue } = result;
                const keyPrefix = assetNumber.substring(0, asset.prefix.length + 4);

                // Update counter state (triggers useEffect to save)
                setLastGeneratedCounters(prevMap => new Map(prevMap).set(keyPrefix, nextCounterValue));
                setGeneratedNumber(assetNumber);
            } else {
                setGeneratedNumber('');
            }
        }
    }, [selectedType, assetTypes, lastGeneratedCounters]);

    const handleAddAssetType = () => {
        const trimmedName = newAssetType.name.trim();
        const trimmedPrefix = newAssetType.prefix.trim().toUpperCase();

        if (trimmedName && trimmedPrefix && trimmedPrefix.length >= 2 && trimmedPrefix.length <= 3) {
            const prefixExists = assetTypes.some(t => t.prefix.toUpperCase() === trimmedPrefix);
            if (prefixExists) { alert('Prefix already exists!'); return; }
            const nameExists = assetTypes.some(t => t.name.toLowerCase() === trimmedName.toLowerCase());
            if (nameExists) { alert('Name already exists!'); return; }

            const maxRangeEnd = assetTypes.reduce((max, type) => Math.max(max, type.rangeEnd), 0);
            const newRangeStart = maxRangeEnd + 1;
            const newRangeEnd = newRangeStart + 999;
            const newId = trimmedName.toLowerCase().replace(/\s+/g, '-');

            const newTypeToAdd: AssetType = {
                id: newId,
                name: trimmedName,
                prefix: trimmedPrefix,
                icon: getIconComponent('default'), // Assign runtime icon
                iconId: 'default',                 // Assign ID for storage
                rangeStart: newRangeStart,
                rangeEnd: newRangeEnd,
                isDefault: false                   // Mark as not default
            };

            // Update asset types state (triggers useEffect to save)
            setAssetTypes(prev => [...prev, newTypeToAdd]);
            setNewAssetType({ name: '', prefix: '' });
            setShowAddForm(false);
        } else {
            if (!trimmedName) alert('Asset Name cannot be empty.');
            else if (!trimmedPrefix) alert('Prefix cannot be empty.');
            else alert('Prefix must be 2 or 3 characters long.');
        }
    };

    const handleRemoveAssetType = (idToRemove: string) => {
        const typeToRemove = assetTypes.find(t => t.id === idToRemove);
        // Use the isDefault flag for the check
        if (typeToRemove?.isDefault) {
            alert('Default asset types cannot be removed.');
            return;
        }
        if (assetTypes.length <= 1) {
            alert('Cannot remove the last asset type!');
            return;
        }

        // Update asset types state (triggers useEffect to save)
        setAssetTypes(prev => prev.filter(type => type.id !== idToRemove));

        // Reset selection if the removed type was selected
        if (selectedType === idToRemove) {
            setSelectedType(prevSelected => {
                 const remainingTypes = assetTypes.filter(type => type.id !== idToRemove);
                 // Check if remainingTypes[0] exists before accessing its id
                 return remainingTypes.length > 0 ? remainingTypes[0].id : '';
            });
        }

         // Optional: Clean up counters for the removed type (might not be necessary)
        // setLastGeneratedCounters(prevMap => {
        //    const newMap = new Map(prevMap);
        //    for (const key of newMap.keys()) {
        //       if (key.startsWith(typeToRemove.prefix)) { // Be careful with prefix reuse possibility
        //          newMap.delete(key);
        //       }
        //    }
        //    return newMap;
        // });
    };

    // --- JSX (Identical to previous version) ---
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Hash className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">IT Asset Number Generator</h1>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Type
              </button>
            </div>

            {/* Add Type Form */}
            {showAddForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-semibold text-gray-700">Add New Asset Type</h2>
                   <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                       <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                       <input type="text" value={newAssetType.name} onChange={(e) => setNewAssetType(prev => ({ ...prev, name: e.target.value }))}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="e.g., Server" />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Prefix (2-3 chars)</label>
                       <input type="text" value={newAssetType.prefix} onChange={(e) => setNewAssetType(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="e.g., SV" maxLength={3} minLength={2} />
                   </div>
                </div>
                <button onClick={handleAddAssetType} className="mt-4 w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                   Add Asset Type
                </button>
              </div>
            )}

            {/* Asset Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
               {assetTypes.map((type) => {
                   const Icon = type.icon; // Icon component is now correctly loaded
                   return (
                       <div key={type.id} className="relative group">
                           <button onClick={() => setSelectedType(type.id)}
                               className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${selectedType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                               <Icon className={`w-6 h-6 mb-2 ${selectedType === type.id ? 'text-blue-500' : 'text-gray-600'}`} />
                               <span className={`text-sm font-medium text-center ${selectedType === type.id ? 'text-blue-700' : 'text-gray-600'}`}>{type.name}</span>
                               <span className="text-xs text-gray-500 mt-1">({type.prefix})</span>
                               <span className="text-[10px] text-gray-400 mt-1">[{type.rangeStart}-{type.rangeEnd}]</span>
                           </button>
                           {/* Use isDefault flag to control removal */}
                           {!type.isDefault && (
                               <button onClick={() => handleRemoveAssetType(type.id)}
                                   className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                   title="Remove asset type">
                                   <Trash2 className="w-4 h-4" />
                               </button>
                           )}
                       </div>
                   );
               })}
            </div>

            {/* Generate Button & Result */}
            <div className="flex flex-col gap-6">
               <button onClick={handleGenerate} disabled={!selectedType}
                   className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                   Generate Asset Number
               </button>
               {generatedNumber && (
                   <div className="w-full text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                       <p className="text-sm text-gray-600 mb-1">Generated Asset Number:</p>
                       <p className="text-2xl font-mono font-bold text-gray-800 tracking-wider">{generatedNumber}</p>
                   </div>
               )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Format: PREFIX + YY + MM + 4-digit sequential number (from assigned range)</p>
             <p className="text-xs">(Numbering progress and custom types are saved in your browser's local storage)</p> {/* Added note */}
          </div>
        </div>
      </div>
    );
}

export default App;