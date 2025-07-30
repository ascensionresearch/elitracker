import React, { useState, useEffect } from 'react';
import { supabase, type UrineEntry as DBUrineEntry, type DressingEntry as DBDressingEntry } from './lib/supabase';
import { Droplets, User, Calendar, Clock, Download, TrendingUp } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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

function App() {
  console.log('App component is rendering');
  
  return (
    <div style={{padding: '20px', backgroundColor: 'lightblue', minHeight: '100vh'}}>
      <h1 style={{color: 'red', fontSize: '24px'}}>TEST: React is working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
}

export default App;