// archiver.mjs
// Nightly ETL Job: Moves old PostgreSQL data to cheap Object Storage

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runArchiver() {
  console.log('==================================================');
  console.log('📦 Starting Cold Storage ETL Pipeline...');
  console.log('==================================================');

  try {
    // 1. Define the retention policy (e.g., 30 days for this test)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffString = cutoffDate.toISOString();

    console.log(`🔍 Scanning ledger for records older than ${cutoffDate.toLocaleDateString()}...`);

    // 2. EXTRACT: Pull the old records from the live database (Removed 'id')
    const { data: oldRecords, error: fetchErr } = await supabase
      .from('ga_tap_ledger')
      .select('card_number, location, timestamp') 
      .lt('timestamp', cutoffString);

    if (fetchErr) throw fetchErr;

    if (!oldRecords || oldRecords.length === 0) {
      console.log('✅ No old records found. Database is clean.');
      return;
    }

    console.log(`📊 Found ${oldRecords.length} stale records. Processing...`);

    // 3. TRANSFORM: Convert JSON array into a raw CSV string (Removed 'id')
    const headers = ['card_number', 'location', 'timestamp'];
    const csvRows = oldRecords.map(row => 
      `${row.card_number},"${row.location}",${row.timestamp}`
    );
    const csvData = [headers.join(','), ...csvRows].join('\n');

    // 4. LOAD: Upload the compressed CSV to Supabase Storage
    const fileName = `ledger_archive_${new Date().toISOString().split('T')[0]}.csv`;
    
    const { error: uploadErr } = await supabase.storage
      .from('cold-storage')
      .upload(fileName, csvData, {
        contentType: 'text/csv',
        upsert: true 
      });

    if (uploadErr) throw uploadErr;
    console.log(`☁️ Successfully uploaded [${fileName}] to the Data Lake.`);

    // 5. CLEANUP: Delete the extracted rows from the live PostgreSQL database
    console.log('🧹 Purging archived records from the active database...');
    const { error: deleteErr } = await supabase
      .from('ga_tap_ledger')
      .delete()
      .lt('timestamp', cutoffString);

    if (deleteErr) throw deleteErr;

    console.log('✅ ARCHIVE COMPLETE. Live database optimized.');
    console.log('==================================================');

  } catch (error) {
    console.error('❌ Pipeline Failed:', error);
  }
}

runArchiver();