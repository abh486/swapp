/**
 * Microsoft Clarity Live Insights Sync Script
 * 
 * This script fetches live insights from the Microsoft Clarity Export API for
 * both Android and iOS projects, and pushes the data to your admin backend.
 * 
 * Clarity Limit: Microsoft Clarity limits Data Export API requests to 10 requests per project per day.
 * Scheduling: Run this script exactly 10 times per day (e.g., every 2 hours and 24 minutes, or 10 specific times).
 * 
 * Setup:
 * 1. Install dependencies:
 *    npm install axios dotenv
 * 2. Configure environment variables in a .env file or at the top of this script.
 * 3. Run:
 *    node scripts/syncClarity.js
 */

const axios = require('axios');
require('dotenv').config();

// CONFIGURATION (Can be configured here or in environment variables)
const CONFIG = {
  // Clarity API Tokens (Generate from your Clarity Project > Settings > Data Export)
  CLARITY_ANDROID_TOKEN: process.env.CLARITY_ANDROID_TOKEN || 'YOUR_ANDROID_CLARITY_TOKEN_HERE',
  CLARITY_IOS_TOKEN: process.env.CLARITY_IOS_TOKEN || 'YOUR_IOS_CLARITY_TOKEN_HERE',
  
  // Your Admin Backend endpoint where you want to POST the formatted data
  ADMIN_API_URL: process.env.ADMIN_API_URL || 'https://bleachable-maricruz-neglectingly.ngrok-free.dev/api/v1/admin/clarity-insights',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'YOUR_ADMIN_API_SECRET_KEY_HERE',
};

const CLARITY_API_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';

/**
 * Fetch insights from Clarity for a specific platform using its project token
 */
async function fetchClarityInsights(platform, token) {
  if (!token || token.includes('YOUR_')) {
    console.warn(`[ClaritySync] Warning: No valid token configured for platform: ${platform}. Skipping.`);
    return null;
  }

  console.log(`[ClaritySync] Fetching insights for ${platform}...`);
  try {
    const response = await axios.get(CLARITY_API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        numOfDays: 1, // Last 24 hours
        dimension1: 'Device',
        dimension2: 'OS',
        dimension3: 'Country'
      }
    });

    console.log(`[ClaritySync] Successfully fetched insights for ${platform}.`);
    return response.data;
  } catch (error) {
    console.error(`[ClaritySync] Error fetching from Clarity API for ${platform}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Send the aggregated insights data to the Admin API
 */
async function sendToAdmin(payload) {
  if (!CONFIG.ADMIN_API_URL || CONFIG.ADMIN_API_URL.includes('YOUR_')) {
    console.error('[ClaritySync] Error: Admin API URL is not configured. Print data to console instead:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`[ClaritySync] Sending aggregated insights to Admin API: ${CONFIG.ADMIN_API_URL}...`);
  try {
    const response = await axios.post(CONFIG.ADMIN_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': CONFIG.ADMIN_API_KEY
      }
    });
    console.log('[ClaritySync] Insights synced to Admin successfully. Response status:', response.status);
  } catch (error) {
    console.error('[ClaritySync] Error sending data to Admin API:', error.response?.data || error.message);
  }
}

/**
 * Main function runner
 */
async function run() {
  console.log('[ClaritySync] Starting Microsoft Clarity daily sync sync...');
  
  const androidInsights = await fetchClarityInsights('Android', CONFIG.CLARITY_ANDROID_TOKEN);
  const iosInsights = await fetchClarityInsights('iOS', CONFIG.CLARITY_IOS_TOKEN);

  if (!androidInsights && !iosInsights) {
    console.log('[ClaritySync] No insights could be retrieved. Exiting sync.');
    return;
  }

  const payload = {
    syncTimestamp: new Date().toISOString(),
    platforms: {
      android: androidInsights,
      ios: iosInsights
    }
  };

  await sendToAdmin(payload);
}

run();
