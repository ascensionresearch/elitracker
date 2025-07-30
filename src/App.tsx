import React, { useState, useEffect } from 'react';
import { supabase, type UrineEntry as DBUrineEntry, type DressingEntry as DBDressingEntry } from './lib/supabase';

interface OutputEntry {
  id: string;
  enteredBy: string;
  date: string;
  time: string;
  amount: number;
  timestamp: number;
}

interface DressingEntry {
  id: string;
  enteredBy: string;
  date: string;
  time: string;
  weight: number;
  drainageTypes: string[];
  timestamp: number;
}

// Helper function for timezone conversion
function convertUTCtoNYC(utcString: string) {
  const date = new Date(utcString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateToNYC(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Helper function to get current NYC date in YYYY-MM-DD format
function getNYCDate() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York'
  });
}

// Helper function to get current NYC datetime for datetime-local input
function getCurrentNYCDateTime() {
  const now = new Date();
  const nycTime = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Parse the formatted string and convert to YYYY-MM-DDTHH:MM format
  const [datePart, timePart] = nycTime.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Helper function to get current NYC time string
function getNYCTimeString() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function App() {
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [dressingEntries, setDressingEntries] = useState<DressingEntry[]>([]);
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load urine entries
      const { data: urineData, error: urineError } = await supabase
        .from('urine_entries')
        .select('*')
        .order('timestamp', { ascending: false });

      if (urineError) {
        console.error('Error loading urine entries:', urineError);
      } else if (urineData) {
        const formattedUrineEntries: OutputEntry[] = urineData.map((entry: DBUrineEntry) => ({
          id: entry.id,
          enteredBy: entry.parent,
          date: new Date(entry.timestamp).toISOString().split('T')[0],
          time: new Date(entry.timestamp).toTimeString().slice(0, 5),
          amount: entry.amount,
          timestamp: new Date(entry.timestamp).getTime()
        }));
        setEntries(formattedUrineEntries);
      }

      // Load dressing entries
      const { data: dressingData, error: dressingError } = await supabase
        .from('dressing_entries')
        .select('*')
        .order('timestamp', { ascending: false });

      if (dressingError) {
        console.error('Error loading dressing entries:', dressingError);
      } else if (dressingData) {
        const formattedDressingEntries: DressingEntry[] = dressingData.map((entry: DBDressingEntry) => ({
          id: entry.id,
          enteredBy: entry.parent,
          date: new Date(entry.timestamp).toISOString().split('T')[0],
          time: new Date(entry.timestamp).toTimeString().slice(0, 5),
          weight: parseInt(entry.condition), // Store weight in condition field for now
          drainageTypes: entry.dressing_type.split(',').filter(type => type.trim() !== ''),
          timestamp: new Date(entry.timestamp).getTime()
        }));
        setDressingEntries(formattedDressingEntries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const NYC_TIMEZONE = 'America/New_York';

  // Helper function to format time in NYC timezone
  const formatTimeHelper = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    
    try {
      const utcDate = parseISO(dateString);
      const nycDate = utcToZonedTime(utcDate, NYC_TIMEZONE);
      return format(nycDate, 'MM/dd/yyyy hh:mm a');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get current NYC time for form defaults
  const getCurrentNYCDateTime = () => {
    const now = new Date();
    const nycTime = utcToZonedTime(now, NYC_TIMEZONE);
    return nycTime;
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = () => {
    const nycTime = getCurrentNYCDateTime();
    return format(nycTime, 'yyyy-MM-dd');
  };

  // Format time for input field (HH:MM)
  const formatTimeForInput = () => {
    const nycTime = getCurrentNYCDateTime();
    return format(nycTime, 'HH:mm');
  };

  // Get today's date in NYC timezone for display
  const getTodayNYC = () => {
    const nycTime = getCurrentNYCDateTime();
    return format(nycTime, 'EEEE, MMMM d, yyyy');
  };
  
  const getNYCDate = () => {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/New_York'
    });
  };
  
  const getNYCTimeString = () => {
    const nycTime = getCurrentNYCDateTime();
    return format(nycTime, 'HH:mm');
  };

  const getCurrentEasternDateTime = () => {
    // Get current time in Eastern timezone
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    return easternTime.toISOString().slice(0, 16);
  };
  
  const getTodayDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const [formData, setFormData] = useState({
    enteredBy: '',
    date: getNYCDate(),
    time: getNYCTimeString(),
    amount: ''
  });

  const [dressingFormData, setDressingFormData] = useState({
    enteredBy: '',
    date: getNYCDate(),
    time: getNYCTimeString(),
    weight: '',
    drainageTypes: {
      serousDrainage: false,
      serosanguinousFluid: false,
      purulentDrainage: false,
      urine: false
    }
  });

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and max 4 digits
    if (value === '' || (/^\d{1,4}$/.test(value))) {
      setPasscode(value);
      // Check if passcode is correct
      if (value === '1226') {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    }
  };

  const calculatePreciseHourlyAverages = () => {
    if (entries.length < 2) return {};
    
    try {
      // Sort entries by timestamp
      const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);
      
      // Initialize daily totals object
      const dailyTotals: { [date: string]: number } = {};
      
      // Process each consecutive pair of entries
      for (let i = 1; i < sortedEntries.length; i++) {
        const prevEntry = sortedEntries[i - 1];
        const currentEntry = sortedEntries[i];
        
        // Validate entries have valid timestamps
        if (!prevEntry.timestamp || !currentEntry.timestamp || 
            isNaN(prevEntry.timestamp) || isNaN(currentEntry.timestamp)) {
          continue;
        }
        
        // Calculate time elapsed in hours
        const timeElapsedMs = currentEntry.timestamp - prevEntry.timestamp;
        const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
        
        if (timeElapsedHours <= 0) continue;
        
        // Calculate hourly rate for this interval
        const hourlyRate = currentEntry.amount / timeElapsedHours;
        
        if (!isFinite(hourlyRate) || hourlyRate < 0) continue;
        
        // Get start and end times
        const startTime = new Date(prevEntry.timestamp);
        const endTime = new Date(currentEntry.timestamp);
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) continue;
        
        // Allocate volume across calendar days
        let currentTime = new Date(startTime);
        let loopCount = 0;
        const maxLoops = 100; // Prevent infinite loops
        
        while (currentTime < endTime && loopCount < maxLoops) {
          loopCount++;
          const currentDateStr = new Date(currentTime.getTime() - currentTime.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          
          // Calculate end of current day or end of interval, whichever comes first
          const endOfDay = new Date(currentTime);
          endOfDay.setHours(23, 59, 59, 999);
          
          const intervalEnd = endTime < endOfDay ? endTime : endOfDay;
          
          // Calculate hours for this day portion
          const hoursInThisDay = (intervalEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
          
          // Safety check for valid time calculation
          if (hoursInThisDay <= 0) {
            currentTime = new Date(intervalEnd.getTime() + 1);
            currentTime.setHours(0, 0, 0, 0);
            continue;
          }
          
          // Allocate volume for this day
          const volumeForThisDay = hourlyRate * hoursInThisDay;
          
          if (!isFinite(volumeForThisDay)) continue;
          
          if (!dailyTotals[currentDateStr]) {
            dailyTotals[currentDateStr] = 0;
          }
          dailyTotals[currentDateStr] += volumeForThisDay;
          
          // Move to next day
          currentTime = new Date(intervalEnd.getTime() + 1);
          currentTime.setHours(0, 0, 0, 0);
        }
      }
      
      // Calculate daily averages (total daily volume ÷ 24 hours)
      const dailyAverages: { [date: string]: number } = {};
      for (const [date, total] of Object.entries(dailyTotals)) {
        const average = total / 24;
        if (isFinite(average) && average >= 0) {
          dailyAverages[date] = Math.round(average);
        }
      }
      
      return dailyAverages;
    } catch (error) {
      console.error('Error calculating precise hourly averages:', error);
      return {};
    }
  };

  const getTotalForDay = (date: string) => {
    const dayEntries = entries.filter(entry => entry.date === date);
    return dayEntries.reduce((total, entry) => total + entry.amount, 0);
  };

  const getSimpleHourlyAverage = (date: string) => {
    const dayEntries = entries.filter(entry => entry.date === date);
    if (dayEntries.length === 0) return 0;
    const totalOutput = getTotalForDay(date);
    return Math.round(totalOutput / 24);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enteredBy || !formData.amount) return;

    // Validate amount is a positive number
    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number for amount');
      return;
    }

    const timestamp = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(timestamp.getTime())) {
      alert('Invalid date or time format');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('urine_entries')
        .insert([
          {
            parent: formData.enteredBy,
            amount: amount,
            timestamp: timestamp.toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting urine entry:', error);
        alert('Error saving entry. Please try again.');
        return;
      }

      if (data) {
        const newEntry: OutputEntry = {
          id: data.id,
          enteredBy: data.parent,
          date: new Date(data.timestamp).toISOString().split('T')[0],
          time: new Date(data.timestamp).toTimeString().slice(0, 5),
          amount: data.amount,
          timestamp: new Date(data.timestamp).getTime()
        };

        setEntries(prev => [newEntry, ...prev].sort((a, b) => b.timestamp - a.timestamp));
        setFormData({
          ...formData,
          amount: '',
          time: getNYCTimeString()
        });
      }
    } catch (error) {
      console.error('Error saving urine entry:', error);
      alert('Error saving entry. Please try again.');
    }
  };

  const handleDressingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dressingFormData.enteredBy || !dressingFormData.weight) return;

    // Validate weight is a positive number
    const weight = parseFloat(dressingFormData.weight);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid positive number for weight');
      return;
    }

    // Deduct 36g and convert to mL (1g = 1mL for water-based fluids)
    const adjustedWeightG = Math.max(0, weight - 36);
    const adjustedWeightMl = Math.round(adjustedWeightG);

    // Get selected drainage types
    const selectedDrainageTypes = Object.entries(dressingFormData.drainageTypes)
      .filter(([_, isSelected]) => isSelected)
      .map(([type, _]) => {
        switch (type) {
          case 'serousDrainage': return 'Serous Drainage';
          case 'serosanguinousFluid': return 'Serosanguinous Fluid';
          case 'purulentDrainage': return 'Purulent Drainage';
          case 'urine': return 'Urine';
          default: return type;
        }
      });

    const timestamp = new Date(`${dressingFormData.date}T${dressingFormData.time}`);
    if (isNaN(timestamp.getTime())) {
      alert('Invalid date or time format');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dressing_entries')
        .insert([
          {
            parent: dressingFormData.enteredBy,
            dressing_type: selectedDrainageTypes.join(','),
            location: 'wound', // Default location
            condition: adjustedWeightMl.toString(), // Store weight in condition field
            timestamp: timestamp.toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting dressing entry:', error);
        alert('Error saving entry. Please try again.');
        return;
      }

      if (data) {
        const newEntry: DressingEntry = {
          id: data.id,
          enteredBy: data.parent,
          date: new Date(data.timestamp).toISOString().split('T')[0],
          time: new Date(data.timestamp).toTimeString().slice(0, 5),
          weight: parseInt(data.condition),
          drainageTypes: data.dressing_type.split(',').filter(type => type.trim() !== ''),
          timestamp: new Date(data.timestamp).getTime()
        };

        setDressingEntries(prev => [newEntry, ...prev].sort((a, b) => b.timestamp - a.timestamp));
        setDressingFormData({
          ...dressingFormData,
          weight: '',
          time: getNYCTimeString(),
          drainageTypes: {
            serousDrainage: false,
            serosanguinousFluid: false,
            purulentDrainage: false,
            urine: false
          }
        });
      }
    } catch (error) {
      console.error('Error saving dressing entry:', error);
      alert('Error saving entry. Please try again.');
    }
  };

  const getDailyHourlyAverages = () => {
    const preciseAverages = calculatePreciseHourlyAverages();
    const uniqueDates = getUniqueDates();
    
    return uniqueDates.map(date => ({
      date,
      displayDate: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }),
      hourlyAverage: preciseAverages[date] || getSimpleHourlyAverage(date)
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string, timeString: string) => {
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUniqueDates = () => {
    const allDates = [...new Set([...entries.map(e => e.date), ...dressingEntries.map(e => e.date)])];
    return allDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  };

  const getAverageForDay = (date: string) => {
    const dayEntries = entries.filter(entry => entry.date === date);
    if (dayEntries.length === 0) return 0;
    return Math.round(getTotalForDay(date) / dayEntries.length);
  };

  const exportToCSV = () => {
    // Create CSV content for Urine Output Entries
    const urineHeaders = ['Date', 'Time', 'Amount (mL)', 'Entered By'];
    const urineRows = entries.map(entry => [
      new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {timeZone: 'America/New_York'}),
      new Date(`${entry.date}T${entry.time}`).toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true}),
      entry.amount.toString(),
      entry.enteredBy
    ]);
    
    const urineCSV = [urineHeaders, ...urineRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Create CSV content for Dressing Change Entries
    const dressingHeaders = ['Date', 'Time', 'Amount (mL)', 'Drainage Types', 'Entered By'];
    const dressingRows = dressingEntries.map(entry => [
      new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {timeZone: 'America/New_York'}),
      new Date(`${entry.date}T${entry.time}`).toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true}),
      entry.weight.toString(),
      entry.drainageTypes.length > 0 ? entry.drainageTypes.join('; ') : 'None',
      entry.enteredBy
    ]);
    
    const dressingCSV = [dressingHeaders, ...dressingRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Combine both sheets with sheet separators
    const combinedCSV = `Urine Output Entries\n${urineCSV}\n\n\nDressing Change Entries\n${dressingCSV}`;
    
    // Create and download the file
    const blob = new Blob([combinedCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `urine_output_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const dailyHourlyData = getDailyHourlyAverages();
  const maxDailyHourlyAverage = Math.max(...dailyHourlyData.map(d => d.hourlyAverage), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
              <span className="text-gray-700">Loading data...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center relative">
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="absolute top-0 right-0 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <Droplets className="w-10 h-10 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Urine Output Monitor</h1>
          </div>
          <p className="text-gray-600 text-lg">Medical tracking dashboard for urine bag output</p>
        </div>

        {/* Calculation Information */}
        <div className="mb-8 bg-yellow-25 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span className="text-gray-700"><strong>Weight:</strong> 17lbs/7.7kg</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span className="text-gray-700"><strong>Normal urine output range:</strong> 1-3ml/kg/hr</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span className="text-gray-700"><strong>Low end output:</strong> 7.7ml/hr</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span className="text-gray-700"><strong>High end output:</strong> 23.1ml/hr</span>
            </div>
          </div>
        </div>

        {/* Daily Summary - Full Width */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Date:</span>
              <span className="font-medium text-lg">{new Date(getNYCDate() + 'T00:00:00').toLocaleDateString('en-US', {timeZone: 'America/New_York'})}</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Total Output:</span>
              <span className="text-black font-medium text-lg">{getTotalForDay(getNYCDate())} mL</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Entries:</span>
              <span className="font-medium text-lg">{entries.filter(e => e.date === getNYCDate()).length}</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Hourly Average:</span>
              <span className={`font-medium text-lg ${
                getSimpleHourlyAverage(getNYCDate()) >= 8 
                  ? 'text-green-600' 
                  : getSimpleHourlyAverage(getNYCDate()) <= 7 
                    ? 'text-red-600' 
                    : 'text-gray-800'
              }`}>
                {getSimpleHourlyAverage(getNYCDate())} mL/hr
              </span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Urine Leak (Y/N):</span>
              <span className={`font-medium text-lg ${
                dressingEntries.filter(entry => 
                  entry.date === getNYCDate() && 
                  entry.drainageTypes.includes('Urine')
                ).length > 0 
                  ? 'text-yellow-500' 
                  : 'text-black'
              }`}>
                {dressingEntries.filter(entry => 
                  entry.date === getNYCDate() && 
                  entry.drainageTypes.includes('Urine')
                ).length > 0 ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            {/* Passcode Field */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Enter Passcode
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4-Digit Passcode
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={handlePasscodeChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-center text-lg font-mono ${
                    isUnlocked 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : passcode.length === 4 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-yellow-500'
                  }`}
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {isUnlocked && (
                  <p className="text-green-600 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Access granted
                  </p>
                )}
                {!isUnlocked && passcode.length === 4 && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Incorrect passcode
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                Add Urine Output New Entry
              </h2>
              
              {!isUnlocked ? (
                <div className="opacity-50 pointer-events-none relative">
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Entered By
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        disabled
                      >
                        <option value="">Select person</option>
                        <option value="Joe">Joe</option>
                        <option value="Tori">Tori</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Time
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Droplets className="w-4 h-4 inline mr-1" />
                        Amount (mL)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter amount in mL"
                        disabled
                      />
                    </div>

                    <button
                      type="button"
                      className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                      disabled
                    >
                      Enter Passcode to Add Urine Entry
                    </button>
                  </form>
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                    <p className="text-gray-600 font-medium">Enter passcode above to unlock</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Entered By
                  </label>
                  <select
                    value={formData.enteredBy}
                    onChange={(e) => setFormData({...formData, enteredBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select person</option>
                    <option value="Joe">Joe</option>
                    <option value="Tori">Tori</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Droplets className="w-4 h-4 inline mr-1" />
                    Amount (mL)
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({...formData, amount: value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter amount in mL"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Add Urine Entry
                </button>
                </form>
              )}
            </div>


            {/* Dressing Change Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                Add New Dressing Change Entry
              </h2>
              
              {!isUnlocked ? (
                <div className="opacity-50 pointer-events-none relative">
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Entered By
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled
                      >
                        <option value="">Select person</option>
                        <option value="Joe">Joe</option>
                        <option value="Tori">Tori</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Time
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (g)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter weight in grams"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Drainage Types
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled
                          />
                          <span className="text-sm text-gray-700">Serous Drainage</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled
                          />
                          <span className="text-sm text-gray-700">Serosanguinous Fluid</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled
                          />
                          <span className="text-sm text-gray-700">Purulent Drainage</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled
                          />
                          <span className="text-sm text-gray-700">Urine</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                      disabled
                    >
                      Enter Passcode to Add Dressing Entry
                    </button>
                  </form>
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                    <p className="text-gray-600 font-medium">Enter passcode above to unlock</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDressingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Entered By
                  </label>
                  <select
                    value={dressingFormData.enteredBy}
                    onChange={(e) => setDressingFormData({...dressingFormData, enteredBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select person</option>
                    <option value="Joe">Joe</option>
                    <option value="Tori">Tori</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={dressingFormData.date}
                    onChange={(e) => setDressingFormData({...dressingFormData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={dressingFormData.time}
                    onChange={(e) => setDressingFormData({...dressingFormData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (g)
                  </label>
                  <input
                    type="text"
                    value={dressingFormData.weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setDressingFormData({...dressingFormData, weight: value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    inputMode="decimal"
                    placeholder="Enter weight in grams"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drainage Types
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dressingFormData.drainageTypes.serousDrainage}
                        onChange={(e) => setDressingFormData({
                          ...dressingFormData,
                          drainageTypes: {
                            ...dressingFormData.drainageTypes,
                            serousDrainage: e.target.checked
                          }
                        })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Serous Drainage</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dressingFormData.drainageTypes.serosanguinousFluid}
                        onChange={(e) => setDressingFormData({
                          ...dressingFormData,
                          drainageTypes: {
                            ...dressingFormData.drainageTypes,
                            serosanguinousFluid: e.target.checked
                          }
                        })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Serosanguinous Fluid</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dressingFormData.drainageTypes.purulentDrainage}
                        onChange={(e) => setDressingFormData({
                          ...dressingFormData,
                          drainageTypes: {
                            ...dressingFormData.drainageTypes,
                            purulentDrainage: e.target.checked
                          }
                        })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Purulent Drainage</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dressingFormData.drainageTypes.urine}
                        onChange={(e) => setDressingFormData({
                          ...dressingFormData,
                          drainageTypes: {
                            ...dressingFormData.drainageTypes,
                            urine: e.target.checked
                          }
                        })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Urine</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Add Dressing Entry
                </button>
                </form>
              )}
            </div>
          </div>

          {/* Charts and Data */}
          <div className="lg:col-span-2">
            {/* Daily Hourly Average Trend Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-yellow-500" />
                Daily Hourly Average Trend (mL/hour)
              </h2>
              
              {dailyHourlyData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available for trending
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  {/* Chart container with proper margins for labels */}
                  <div className="relative h-64 ml-16 mr-8 mt-8 mb-8" style={{ minWidth: `${Math.max(dailyHourlyData.length * 80, 400)}px` }}>
                    {/* Y-axis labels - positioned outside the chart area */}
                    <div className="absolute -left-14 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                      <span>35</span>
                      <span>26</span>
                      <span>18</span>
                      <span>9</span>
                      <span>0mL</span>
                    </div>
                    
                    {/* Chart area with border */}
                    <div className="relative h-full w-full border-l-2 border-b-2 border-gray-300">
                    <svg className="absolute inset-0 w-full h-full">
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                        <line
                          key={ratio}
                          x1="0"
                          y1={`${(1 - ratio) * 90 + 5}%`}
                          x2="100%"
                          y2={`${(1 - ratio) * 90 + 5}%`}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      ))}
                      
                      {/* Reference lines */}
                      {/* Red line at 7.7ml */}
                      <line
                        x1="0"
                        y1={`${(1 - (7.7 / 35)) * 90 + 5}%`}
                        x2="100%"
                        y2={`${(1 - (7.7 / 35)) * 90 + 5}%`}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                      {/* Green line at 23.1ml */}
                      <line
                        x1="0"
                        y1={`${(1 - (23.1 / 35)) * 90 + 5}%`}
                        x2="100%"
                        y2={`${(1 - (23.1 / 35)) * 90 + 5}%`}
                        stroke="#22c55e"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                      
                      {/* Line path */}
                      {dailyHourlyData.length > 1 && [...dailyHourlyData].reverse().map((_, index, arr) => {
                        if (index === arr.length - 1) return null;
                        const current = arr[index];
                        const next = arr[index + 1];
                        
                        const x1 = (index / (arr.length - 1)) * 90 + 5;
                        const y1 = (1 - (Math.min(current.hourlyAverage, 35) / 35)) * 90 + 5;
                        const x2 = ((index + 1) / (arr.length - 1)) * 90 + 5;
                        const y2 = (1 - (Math.min(next.hourlyAverage, 35) / 35)) * 90 + 5;
                        
                        return (
                          <line
                            key={`line-${index}`}
                            x1={`${x1}%`}
                            y1={`${y1}%`}
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                            stroke="#eab308"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        );
                      })}
                      
                      {/* Data points */}
                      {[...dailyHourlyData].reverse().map((data, index, arr) => {
                        const x = arr.length === 1 ? 50 : (index / (arr.length - 1)) * 90 + 5;
                        const y = (1 - (Math.min(data.hourlyAverage, 35) / 35)) * 90 + 5;
                        return (
                          <g key={data.date}>
                            <circle
                              cx={`${x}%`}
                              cy={`${y}%`}
                              r="8"
                              fill="#eab308"
                              stroke="white"
                              strokeWidth="4"
                            />
                            {/* Value labels above points */}
                            <text
                              x={`${x}%`}
                              y={`${Math.max(y - 8, 2)}%`}
                              textAnchor="middle"
                              className="text-xs fill-gray-700 font-semibold"
                            >
                              {data.hourlyAverage}
                            </text>
                            {/* Tooltip on hover */}
                            <title>{data.displayDate}: {data.hourlyAverage} mL/hr</title>
                          </g>
                        );
                      })}
                    </svg>
                    </div>
                    
                    {/* X-axis labels - positioned outside the chart area */}
                    <div className="absolute -bottom-2 left-0 right-0 text-xs text-gray-600 font-medium">
                      {[...dailyHourlyData].reverse().map((data, index, arr) => {
                        const x = arr.length === 1 ? 50 : (index / (arr.length - 1)) * 90 + 5;
                        return (
                          <div
                            key={data.date}
                            className="absolute transform -translate-x-1/2 text-center whitespace-nowrap"
                            style={{ left: `${x}%` }}
                          >
                            {data.displayDate}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Entries Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Urine Output Entries</h2>
              
              {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No entries recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Amount</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Entered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice(0, 10).map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {timeZone: 'America/New_York'})}</td>
                          <td className="py-3 px-2">{new Date(`${entry.date}T${entry.time}`).toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true})}</td>
                          <td className="py-3 px-2 font-medium text-yellow-500">{entry.amount} mL</td>
                          <td className="py-3 px-2">{entry.enteredBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {entries.length > 10 && (
                    <p className="text-gray-500 text-center mt-4">
                      Showing 10 most recent entries. Total: {entries.length} entries
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Dressing Change Entries Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dressing Change Entries</h2>
              
              {dressingEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No dressing change entries recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Amount</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Drainage Types</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Entered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dressingEntries.slice(0, 10).map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {timeZone: 'America/New_York'})}</td>
                          <td className="py-3 px-2">{new Date(`${entry.date}T${entry.time}`).toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true})}</td>
                          <td className={`py-3 px-2 font-medium ${entry.drainageTypes.includes('Urine') ? 'text-yellow-500' : 'text-black'}`}>
                            {entry.weight} mL
                          </td>
                          <td className="py-3 px-2">{entry.drainageTypes.length > 0 ? entry.drainageTypes.join(', ') : 'None'}</td>
                          <td className="py-3 px-2">{entry.enteredBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {dressingEntries.length > 10 && (
                    <p className="text-gray-500 text-center mt-4">
                      Showing 10 most recent entries. Total: {dressingEntries.length} entries
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;