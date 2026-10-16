import { createCustomerInquiry } from '../src/services/inquiryService';
import { subscribeToNewsletter } from '../src/services/newsletterService';
import fs from 'fs';
import path from 'path';

/**
 * ==============================================================================
 * ABUSE PREVENTION & RATE LIMITING REGRESSION TEST SUITE
 * ==============================================================================
 */

async function runTests() {
  console.log('================================================================');
  console.log('  Running Abuse Prevention & Rate Limiting Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Test Honeypot Suppression on Inquiries
  console.log('Test 1: Anti-Bot Honeypot Field on Customer Inquiry');
  const honeypotInquiryRes = await createCustomerInquiry({
    customer_name: 'Spam Bot 3000',
    email: 'spambot@example-seo-spam.com',
    subject: 'Buy Cheap Watches',
    message: 'Check out our spam website links here http://spam.xyz',
    source: 'web',
    website_url_hp: 'http://spam-link-filled-by-bot.com', // BOT FILLING HONEYPOT
  });

  assert(honeypotInquiryRes.success === true, 'Honeypot returns trapped success response to fool bot');
  assert(honeypotInquiryRes.inquiry?.admin_notes === 'Dropped honeypot bot trap', 'Honeypot marks internal drop flag');

  // 2. Test Legitimate Inquiry passes through client validation
  console.log('\nTest 2: Legitimate Customer Inquiry Validation');
  const legitimateInquiryRes = await createCustomerInquiry({
    customer_name: 'Hans Zimmer',
    email: 'hans.zimmer@example.com',
    phone: '+49 170 1234567',
    subject: 'Diving in Giftun Island',
    message: 'Hello, we would like to book a private boat trip for 4 adults next Tuesday.',
    source: 'web',
    website_url_hp: '', // EMPTY FOR REAL USERS
  });

  assert(legitimateInquiryRes.success === true, 'Legitimate inquiry passes validation and is accepted');
  assert(legitimateInquiryRes.inquiry?.email === 'hans.zimmer@example.com', 'Inquiry email is preserved and sanitized');

  // 3. Test Honeypot Suppression on Newsletter
  console.log('\nTest 3: Anti-Bot Honeypot Field on Newsletter');
  const honeypotNewsRes = await subscribeToNewsletter(
    'bot_harvester@spambot.net',
    'footer',
    'http://filled-by-automated-crawler.com'
  );

  assert(honeypotNewsRes.success === true, 'Newsletter honeypot returns trapped success response');
  assert(honeypotNewsRes.discountCode === 'REDSEA15', 'Newsletter honeypot provides static promotional code');

  // 4. Test SQL Migration & Trigger Parity
  console.log('\nTest 4: Database Trigger & Function Parity');
  const migrationPath = path.resolve('supabase/migrations/20261015000000_server_side_abuse_prevention.sql');
  const completePath = path.resolve('complete_schema.sql');
  const schemaPath = path.resolve('supabase/schema.sql');

  assert(fs.existsSync(migrationPath), 'Migration 20261015000000_server_side_abuse_prevention.sql exists');
  assert(fs.existsSync(completePath), 'complete_schema.sql exists');
  assert(fs.existsSync(schemaPath), 'supabase/schema.sql exists');

  const migSql = fs.readFileSync(migrationPath, 'utf8');
  const completeSql = fs.readFileSync(completePath, 'utf8');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  assert(migSql.includes('check_public_submission_rate_limit()'), 'Migration contains rate limiting function');
  assert(completeSql.includes('check_public_submission_rate_limit()'), 'complete_schema.sql contains rate limiting function');
  assert(schemaSql.includes('check_public_submission_rate_limit()'), 'supabase/schema.sql contains rate limiting function');

  assert(migSql.includes('trg_rate_limit_inquiries'), 'Migration contains trg_rate_limit_inquiries');
  assert(completeSql.includes('trg_rate_limit_inquiries'), 'complete_schema.sql contains trg_rate_limit_inquiries');
  assert(schemaSql.includes('trg_rate_limit_inquiries'), 'supabase/schema.sql contains trg_rate_limit_inquiries');

  assert(migSql.includes('trg_rate_limit_newsletter'), 'Migration contains trg_rate_limit_newsletter');
  assert(completeSql.includes('trg_rate_limit_newsletter'), 'complete_schema.sql contains trg_rate_limit_newsletter');
  assert(schemaSql.includes('trg_rate_limit_newsletter'), 'supabase/schema.sql contains trg_rate_limit_newsletter');

  assert(migSql.includes('trg_rate_limit_bookings'), 'Migration contains trg_rate_limit_bookings');
  assert(completeSql.includes('trg_rate_limit_bookings'), 'complete_schema.sql contains trg_rate_limit_bookings');
  assert(schemaSql.includes('trg_rate_limit_bookings'), 'supabase/schema.sql contains trg_rate_limit_bookings');

  // 5. Test Error Handling for Rate Limiting
  console.log('\nTest 5: Safe Exception Output in Trigger');
  assert(migSql.includes("ERRCODE = 'P0001'"), 'Trigger uses standard user-defined error code P0001');
  assert(migSql.includes("session_user IN ('postgres', 'service_role')"), 'Trigger explicitly permits administrative & test roles');

  console.log('\n================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
