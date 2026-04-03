// archiver.mjs
// Enterprise ELT Pipeline: Supabase (Hot) -> Cloudflare R2 (Cold Data Lake)

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 1. Initialize Secure Cloud Clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Bypass RLS for backend data engineering tasks
);

const s3Client = new S3Client({
  region: 'auto', // Cloudflare handles edge routing automatically
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
});

async function runELTPipeline() {
  console.log("=========================================");
  console.log("🌊 Initiating GABS Data Lake Archiver");
  console.log("=========================================");

  try {
    // --- 1. EXTRACT ---
    // For testing purposes, we will archive data older than 15 minutes.
    // In production, this would be set to 24 hours (24 * 60 * 60 * 1000).
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    console.log(`🔍 Scanning Supabase for records older than: ${cutoffTime}`);
    
    // Note: If your column is named 'created_at' instead of 'timestamp', change it below.
    const { data: records, error: extractError } = await supabase
      .from('ga_tap_ledger')
      .select('*')
      .lt('timestamp', cutoffTime);

    if (extractError) throw new Error(`Extract Failed: ${extractError.message}`);
    if (!records || records.length === 0) {
      return console.log("✅ Pipeline Complete: No cold records found to archive.");
    }

    console.log(`📦 Extracted ${records.length} records. Beginning transformation...`);

    // --- 2. TRANSFORM ---
    // Convert JSON array to a flat CSV string
    const headers = Object.keys(records[0]).join(',');
    const rows = records.map(record => 
      Object.values(record).map(value => `"${value}"`).join(',') // Wrap in quotes to prevent comma injection
    );
    const csvData = [headers, ...rows].join('\n');

    // --- 3. LOAD ---
    // Generate a unique, timestamped filename
    const filename = `gabs-archive-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const objectKey = `historical-taps/${filename}`;

    console.log(`☁️  Uploading to R2 Data Lake as: ${objectKey}`);

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      Body: csvData,
      ContentType: 'text/csv'
    });

    const s3Response = await s3Client.send(uploadCommand);

// --- 4. VERIFY & CLEAN (The Safety Gate) ---
    if (s3Response.$metadata.httpStatusCode === 200) {
      console.log(`✅ Upload Confirmed. Purging records from Hot Storage...`);
      
      // Data Engineering Best Practice: Delete using the exact same symmetric condition we used to extract
      const { error: deleteError } = await supabase
        .from('ga_tap_ledger')
        .delete()
        .lt('timestamp', cutoffTime); 

      if (deleteError) throw new Error(`Cleanup Failed (Data is safe in R2): ${deleteError.message}`);
      
      console.log("🎉 ELT Pipeline Executed Successfully.");
    } else {
      throw new Error(`R2 Upload returned non-200 status: ${s3Response.$metadata.httpStatusCode}`);
    }

  } catch (error) {
    console.error("🚨 CRITICAL PIPELINE FAILURE:", error);
  }
}

// Execute the pipeline
runELTPipeline();