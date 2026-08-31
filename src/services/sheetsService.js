import Papa from 'papaparse';
import { processDataset } from '../utils/dataProcessor';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/13Mk7TOzRQEQDwMX7v4JmHXI5XzI00gdl/export?format=csv&gid=1197285468';
const CACHE_KEY = 'kbb_kepegawaian_data_cache';
const CACHE_TIME_KEY = 'kbb_kepegawaian_last_sync';

export async function fetchLiveKepegawaianData() {
  try {
    const response = await fetch(SHEET_CSV_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv'
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengunduh data Google Sheet (HTTP ${response.status})`);
    }

    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('Data Google Sheet kosong atau tidak valid'));
            return;
          }
          
          const processed = processDataset(results.data);
          
          // Save to LocalStorage cache
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(results.data));
            localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());
          } catch (err) {
            console.warn('LocalStorage full or disabled:', err);
          }

          resolve({
            success: true,
            data: processed,
            lastSynced: new Date(),
            source: 'live'
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (err) {
    console.error('Error fetching live Google Sheet data:', err);
    
    // Try fallback from cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedData) {
      try {
        const rawRows = JSON.parse(cachedData);
        const processed = processDataset(rawRows);
        return {
          success: true,
          data: processed,
          lastSynced: cachedTime ? new Date(cachedTime) : new Date(),
          source: 'cache',
          warning: 'Menggunakan data tersimpan (offline/fallback)'
        };
      } catch (cacheErr) {
        console.error('Failed to parse cached data:', cacheErr);
      }
    }
    
    throw err;
  }
}

export function getCachedLastSyncedTime() {
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  return cachedTime ? new Date(cachedTime) : null;
}
