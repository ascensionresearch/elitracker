import React, { useState, useEffect } from 'react';
import { supabase, type UrineEntry as DBUrineEntry, type DressingEntry as DBDressingEntry } from './lib/supabase';
import { Droplets, User, Calendar, Clock, Download, TrendingUp } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import * as XLSX from 'xlsx';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';

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

// Helper function to convert NYC date/time to UTC timestamp
function nycToUTC(dateStr: string, timeStr: string): string {
  // Create a date string in NYC timezone
  const nycDateTime = `${dateStr}T${timeStr}:00`;
  
  // Use date-fns-tz to convert NYC time to UTC
  const nycDate = toZonedTime(new Date(nycDateTime), 'America/New_York');
  
  return nycDate.toISOString();
}

function App() {
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [dressingEntries, setDressingEntries] = useState<DressingEntry[]>([]);
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
        const formattedUrineEntries: OutputEntry[] = urineData.map((entry: DBUrineEntry) => {
          // Convert UTC timestamp to NYC time
          const nycDate = new Date(entry.timestamp).toLocaleDateString('en-CA', {
            timeZone: 'America/New_York'
          });
          const nycTime = new Date(entry.timestamp).toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          return {
            id: entry.id,
            enteredBy: entry.parent,
            date: nycDate,
            time: nycTime,
            amount: entry.amount,
            timestamp: new Date(entry.timestamp).getTime()
          };
        });
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
        const formattedDressingEntries: DressingEntry[] = dressingData.map((entry: DBDressingEntry) => {
          // Convert UTC timestamp to NYC time
          const nycDate = new Date(entry.timestamp).toLocaleDateString('en-CA', {
            timeZone: 'America/New_York'
          });
          const nycTime = new Date(entry.timestamp).toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          return {
            id: entry.id,
            enteredBy: entry.parent,
            date: nycDate,
            time: nycTime,
            weight: parseInt(entry.condition), // Store weight in condition field for now
            drainageTypes: entry.dressing_type.split(',').filter((type: string) => type.trim() !== ''),
            timestamp: new Date(entry.timestamp).getTime()
          };
        });
        setDressingEntries(formattedDressingEntries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Form state for urine output
  const [urineFormData, setUrineFormData] = useState({
    enteredBy: '',
    date: getNYCDate(),
    time: new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    amount: ''
  });

  // Form state for dressing change
  const [dressingFormData, setDressingFormData] = useState({
    enteredBy: '',
    date: getNYCDate(),
    time: new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
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
    if (value === '' || (/^\d{1,4}$/.test(value))) {
      setPasscode(value);
      if (value === '1226') {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    }
  };

  const handleUrineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urineFormData.enteredBy || !urineFormData.amount) return;

    // Validate amount is a positive number
    const amount = parseInt(urineFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number for amount');
      return;
    }

    // Create timestamp treating the input as NYC time
    const timestamp = new Date(`${urineFormData.date}T${urineFormData.time}:00`);
    if (isNaN(timestamp.getTime())) {
      alert('Invalid date or time format');
      return;
    }
    
    // Convert NYC time to UTC for storage
    const utcTimestamp = nycToUTC(urineFormData.date, urineFormData.time);

    try {
      const { data, error } = await supabase
        .from('urine_entries')
        .insert([
          {
            parent: urineFormData.enteredBy,
            amount: amount,
            timestamp: utcTimestamp
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
        // Convert UTC timestamp back to NYC time for display
        const nycDate = new Date(data.timestamp).toLocaleDateString('en-CA', {
          timeZone: 'America/New_York'
        });
        const nycTime = new Date(data.timestamp).toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const newEntry: OutputEntry = {
          id: data.id,
          enteredBy: data.parent,
          date: nycDate,
          time: nycTime,
          amount: data.amount,
          timestamp: new Date(data.timestamp).getTime()
        };

        setEntries(prev => [newEntry, ...prev].sort((a, b) => b.timestamp - a.timestamp));
        setUrineFormData({
          ...urineFormData,
          amount: '',
          time: new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
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
      .map(([type, _]: [string, boolean]) => {
        switch (type) {
          case 'serousDrainage': return 'Serous Drainage';
          case 'serosanguinousFluid': return 'Serosanguinous Fluid';
          case 'purulentDrainage': return 'Purulent Drainage';
          case 'urine': return 'Urine';
          default: return type;
        }
      });

    // Create timestamp treating the input as NYC time
    const timestamp = new Date(`${dressingFormData.date}T${dressingFormData.time}:00`);
    if (isNaN(timestamp.getTime())) {
      alert('Invalid date or time format');
      return;
    }
    
    // Convert NYC time to UTC for storage
    const utcTimestamp = nycToUTC(dressingFormData.date, dressingFormData.time);

    try {
      const { data, error } = await supabase
        .from('dressing_entries')
        .insert([
          {
            parent: dressingFormData.enteredBy,
            dressing_type: selectedDrainageTypes.join(','),
            location: 'wound', // Default location
            condition: adjustedWeightMl.toString(), // Store weight in condition field
            timestamp: utcTimestamp
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
        // Convert UTC timestamp back to NYC time for display
        const nycDate = new Date(data.timestamp).toLocaleDateString('en-CA', {
          timeZone: 'America/New_York'
        });
        const nycTime = new Date(data.timestamp).toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const newEntry: DressingEntry = {
          id: data.id,
          enteredBy: data.parent,
          date: nycDate,
          time: nycTime,
          weight: parseInt(data.condition),
          drainageTypes: data.dressing_type.split(',').filter((type: string) => type.trim() !== ''),
          timestamp: new Date(data.timestamp).getTime()
        };

        setDressingEntries(prev => [newEntry, ...prev].sort((a, b) => b.timestamp - a.timestamp));
        setDressingFormData({
          ...dressingFormData,
          weight: '',
          time: new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
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

  const getDailyHourlyData = () => {
    const uniqueDates = [...new Set(entries.map(e => e.date))];
    
    return uniqueDates.map(date => ({
      date,
      displayDate: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }),
      hourlyAverage: Math.round(entries.filter(e => e.date === date).reduce((total, entry) => total + entry.amount, 0) / 24)
    }));
  };

  const exportToExcel = () => {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Helper function to convert 24-hour time to 12-hour format
    const convertTo12Hour = (time24: string) => {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    // Helper function to format timestamp in 12-hour format
    const formatTimestamp = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    };
    
    // Prepare urine entries data
    const urineData = entries.map(entry => ({
      'Date': entry.date,
      'Time': convertTo12Hour(entry.time),
      'Amount (mL)': entry.amount,
      'Entered By': entry.enteredBy,
      'Timestamp': formatTimestamp(entry.timestamp)
    }));
    
    // Prepare dressing entries data
    const dressingData = dressingEntries.map(entry => ({
      'Date': entry.date,
      'Time': convertTo12Hour(entry.time),
      'Amount (mL)': entry.weight,
      'Drainage Types': entry.drainageTypes.join(', '),
      'Entered By': entry.enteredBy,
      'Timestamp': formatTimestamp(entry.timestamp)
    }));
    
    // Prepare daily summary data
    const dailySummaryData = getDailyHourlyData().map(data => ({
      'Date': data.date,
      'Display Date': data.displayDate,
      'Hourly Average (mL/hr)': data.hourlyAverage
    }));
    
    // Create worksheets
    const urineSheet = XLSX.utils.json_to_sheet(urineData);
    const dressingSheet = XLSX.utils.json_to_sheet(dressingData);
    const summarySheet = XLSX.utils.json_to_sheet(dailySummaryData);
    
    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, urineSheet, 'Urine Entries');
    XLSX.utils.book_append_sheet(workbook, dressingSheet, 'Dressing Entries');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Daily Summary');
    
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `urine_output_data_${dateStr}_${timeStr}.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center relative">
          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="absolute top-0 right-0 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <Droplets className="w-10 h-10 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Urine Output and Leak Monitor</h1>
          </div>
          <p className="text-gray-600 text-lg">Medical Tracking Dashboard For Urine Bag Output And Dressing Changes</p>
          
          {/* Passcode Field */}
          <div className="mt-6 max-w-md mx-auto">
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
              <p className="text-green-600 text-sm mt-1 flex items-center justify-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Access granted
              </p>
            )}
            {!isUnlocked && passcode.length === 4 && (
              <p className="text-red-600 text-sm mt-1 flex items-center justify-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Incorrect passcode
              </p>
            )}
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${!isUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
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

        {/* Daily Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Date:</span>
              <span className="font-medium text-lg">{new Date().toLocaleDateString('en-US')}</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Total Output:</span>
              <span className="text-black font-medium text-lg">{entries.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((total, entry) => total + entry.amount, 0)} mL</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Entries:</span>
              <span className="font-medium text-lg">{entries.filter(e => e.date === new Date().toISOString().split('T')[0]).length}</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Hourly Average:</span>
              <span className="font-medium text-lg text-gray-800">
                {entries.filter(e => e.date === new Date().toISOString().split('T')[0]).length > 0 
                  ? Math.round(entries.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((total, entry) => total + entry.amount, 0) / 24)
                  : 0} mL/hr
              </span>
            </div>
            <div className="text-center">
              <span className="block text-gray-600 text-sm mb-1">Urine Leak (Y/N):</span>
              <span className="font-medium text-lg text-black">
                {dressingEntries.filter(entry => 
                  entry.date === new Date().toISOString().split('T')[0] && 
                  entry.drainageTypes.includes('Urine')
                ).length > 0 ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  Add Urine Output New Entry
                </h2>
                
                <form onSubmit={handleUrineSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      Entered By
                    </label>
                    <select 
                      value={urineFormData.enteredBy}
                      onChange={(e) => setUrineFormData({...urineFormData, enteredBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      disabled={!isUnlocked}
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
                      value={urineFormData.date}
                      onChange={(e) => setUrineFormData({...urineFormData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      disabled={!isUnlocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={urineFormData.time}
                      onChange={(e) => setUrineFormData({...urineFormData, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      disabled={!isUnlocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Droplets className="w-4 h-4 inline mr-1" />
                      Amount (mL)
                    </label>
                    <input
                      type="text"
                      value={urineFormData.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setUrineFormData({...urineFormData, amount: value});
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter amount in mL"
                      disabled={!isUnlocked}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      isUnlocked 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!isUnlocked}
                  >
                    Add Urine Entry
                  </button>
                </form>
              </div>

              {/* Dressing Change Form */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  Add New Dressing Change Entry
                </h2>
                
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
                      disabled={!isUnlocked}
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
                      disabled={!isUnlocked}
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
                      disabled={!isUnlocked}
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
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setDressingFormData({...dressingFormData, weight: value});
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter weight in grams"
                      disabled={!isUnlocked}
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
                          disabled={!isUnlocked}
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
                          disabled={!isUnlocked}
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
                          disabled={!isUnlocked}
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
                          disabled={!isUnlocked}
                        />
                        <span className="text-sm text-gray-700">Urine</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      isUnlocked 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!isUnlocked}
                  >
                    Add Dressing Entry
                  </button>
                </form>
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
                
                {entries.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available for trending
                  </div>
                ) : (
                  <div className="relative overflow-x-auto">
                    {/* Chart container with proper margins for labels */}
                    <div className="relative h-64 ml-16 mr-8 mt-8 mb-8" style={{ minWidth: `${Math.max(getDailyHourlyData().length * 80, 400)}px` }}>
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
                        {getDailyHourlyData().length > 1 && [...getDailyHourlyData()].reverse().map((_, index, arr) => {
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
                        {[...getDailyHourlyData()].reverse().map((data, index, arr) => {
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
                        {[...getDailyHourlyData()].reverse().map((data, index, arr) => {
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
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Output Amount</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Entered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-2 text-gray-500" colSpan={4}>
                            <div className="text-center py-8">No entries recorded yet</div>
                          </td>
                        </tr>
                      ) : (
                        entries.slice(0, 10).map((entry) => (
                          <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US')}</td>
                            <td className="py-3 px-2">{new Date(`${entry.date}T${entry.time}`).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td className="py-3 px-2 font-medium text-yellow-500">{entry.amount} mL</td>
                            <td className="py-3 px-2">{entry.enteredBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dressing Change Entries Table */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Dressing Change Entries</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Leak Amount</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Drainage Types</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Entered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dressingEntries.length === 0 ? (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-2 text-gray-500" colSpan={5}>
                            <div className="text-center py-8">No dressing change entries recorded yet</div>
                          </td>
                        </tr>
                      ) : (
                        dressingEntries.slice(0, 10).map((entry) => (
                          <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US')}</td>
                            <td className="py-3 px-2">{new Date(`${entry.date}T${entry.time}`).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td className={`py-3 px-2 font-medium ${entry.drainageTypes.includes('Urine') ? 'text-yellow-500' : 'text-black'}`}>
                              {entry.weight} mL
                            </td>
                            <td className="py-3 px-2">{entry.drainageTypes.length > 0 ? entry.drainageTypes.join(', ') : 'None'}</td>
                            <td className="py-3 px-2">{entry.enteredBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;