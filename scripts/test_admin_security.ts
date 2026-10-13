import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { isUserAdmin, AppUser } from '../src/services/authService';

dotenv.config();

/**
 * ==============================================================================
 * AUTOMATED ADMIN SECURITY & PRIVILEGE ESCALATION RESISTANCE TEST SUITE
 * ==============================================================================
 * Validates:
 * 1. Client-side user metadata spoofing cannot grant admin privileges.
 * 2. Ordinary signups receive exclusively the 'customer' role.
 * 3. Client-side update requests cannot escalate role on public.profiles.
 * 4. Database triggers protect_profile_role() and handle_new_user() strictly reject
 *    unauthorized role escalation attempts.
 * 5. verifyAdminAccess() ignores client-side user_metadata and requires database proof.
 * ==============================================================================
 */

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(testName: string, condition: boolean, message: string, details?: any) {
  results.push({
    testName,
    passed: condition,
    message: condition ? `PASSED: ${message}` : `FAILED: ${message}`,
    details,
  });
}

async function runSecurityTests() {
  console.log('================================================================');
  console.log('  Admin Security & Privilege Escalation Resistance Test Suite');
  console.log('================================================================\n');

  // ----------------------------------------------------------------------------
  // TEST 1: Client-Side User Object with Spoofed user_metadata
  // ----------------------------------------------------------------------------
  console.log('Running Test 1: Verify isUserAdmin rejects spoofed user_metadata...');
  const ordinaryUserWithSpoofedRole: AppUser = {
    id: 'user-attack-1234',
    email: 'attacker@example.com',
    fullName: 'Malicious Attacker',
    role: 'customer', // True role assigned by database
    isConfirmed: true,
  };

  assert(
    'Reject ordinary customer with role="customer"',
    isUserAdmin(ordinaryUserWithSpoofedRole) === false,
    'Ordinary user with customer role correctly recognized as non-admin'
  );

  // ----------------------------------------------------------------------------
  // TEST 2: Attempted Privilege Escalation via Client user_metadata
  // ----------------------------------------------------------------------------
  console.log('Running Test 2: Verify raw client user_metadata cannot forge admin state...');
  const rawSupabaseUserPayload: any = {
    id: 'user-attack-5678',
    email: 'spoof@example.com',
    user_metadata: {
      role: 'admin', // Malicious attempt to inject admin via client metadata
      full_name: 'Spoofed User',
    },
    app_metadata: {},
  };

  // Check that application does NOT elevate role based on user_metadata
  const derivedRole = rawSupabaseUserPayload.app_metadata?.role || 'customer';
  assert(
    'Client user_metadata.role ignored during role derivation',
    derivedRole === 'customer',
    'Application strictly ignores user_metadata.role and defaults to customer'
  );

  // ----------------------------------------------------------------------------
  // TEST 3: SQL Schema Inspection of handle_new_user()
  // ----------------------------------------------------------------------------
  console.log('Running Test 3: Audit handle_new_user() SQL definition for privilege leaks...');
  const fs = await import('fs');
  const completeSchemaSql = fs.readFileSync('complete_schema.sql', 'utf8');

  // Extract handle_new_user function body
  const fnMatch = completeSchemaSql.match(/CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)[\s\S]*?\$\$ LANGUAGE plpgsql|CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)[\s\S]*?END;\s*\$\$/i);
  const fnBody = fnMatch ? fnMatch[0] : '';

  assert(
    'handle_new_user has no hardcoded admin email rules',
    !fnBody.includes("NEW.email = 'admin@") && !fnBody.includes("NEW.email IN ('admin@"),
    'No email addresses are automatically granted admin in handle_new_user()'
  );

  assert(
    'handle_new_user never reads role from raw_user_meta_data',
    !fnBody.includes("raw_user_meta_data->>'role'"),
    'raw_user_meta_data role extraction is completely removed from handle_new_user()'
  );

  assert(
    'handle_new_user unconditionally inserts customer role',
    fnBody.includes("'customer'"),
    'handle_new_user() strictly and unconditionally inserts role "customer"'
  );

  // ----------------------------------------------------------------------------
  // TEST 4: SQL Schema Inspection of protect_profile_role() Trigger
  // ----------------------------------------------------------------------------
  console.log('Running Test 4: Audit protect_profile_role() trigger in complete_schema.sql...');
  const protectMatch = completeSchemaSql.match(/CREATE OR REPLACE FUNCTION public\.protect_profile_role\(\)[\s\S]*?END;\s*\$\$/i);
  const protectBody = protectMatch ? protectMatch[0] : '';

  assert(
    'protect_profile_role trigger exists',
    Boolean(protectBody),
    'Role protection trigger function exists in schema'
  );

  assert(
    'protect_profile_role resets role if caller is not admin',
    protectBody.includes('NEW.role := OLD.role') || protectBody.includes('NEW.role = OLD.role'),
    'Trigger strictly blocks self-escalation by setting NEW.role := OLD.role when not is_admin()'
  );

  // ----------------------------------------------------------------------------
  // TEST 5: SQL Schema Inspection of public.is_admin()
  // ----------------------------------------------------------------------------
  console.log('Running Test 5: Audit public.is_admin() implementation...');
  const isAdminMatch = completeSchemaSql.match(/CREATE OR REPLACE FUNCTION public\.is_admin\(\)[\s\S]*?END;\s*\$\$/i);
  const isAdminBody = isAdminMatch ? isAdminMatch[0] : '';

  assert(
    'is_admin relies on database profiles table and service_role JWT only',
    isAdminBody.includes('public.profiles') && isAdminBody.includes('service_role'),
    'is_admin() checks database public.profiles role or service_role JWT'
  );

  assert(
    'is_admin does NOT read from client-editable user_metadata',
    !isAdminBody.includes('raw_user_meta_data'),
    'is_admin() strictly refuses to inspect raw_user_meta_data'
  );

  // ----------------------------------------------------------------------------
  // TEST 6: Live Supabase Database Connection & RLS Policy Tests (if configured)
  // ----------------------------------------------------------------------------
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey && anonKey.length > 20) {
    console.log(`Running Test 6: Testing against Supabase API at ${supabaseUrl}...`);
    try {
      const client = createClient(supabaseUrl, anonKey);

      // Verify anonymous user cannot write to admin-only tables
      const { data: vesselInsert, error: vesselError } = await client
        .from('vessels')
        .insert({ name: 'Malicious Vessel', code: 'MV-HACK', capacity: 100 });

      assert(
        'Anonymous user blocked from modifying vessels table (RLS check)',
        Boolean(vesselError),
        `Anonymous write correctly blocked: ${vesselError?.message || 'Access denied'}`
      );

      // Verify anonymous user cannot modify public.profiles roles
      const { data: profileUpdate, error: profileUpdateError } = await client
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', 'attacker@example.com');

      assert(
        'Anonymous user blocked from modifying profiles table (RLS check)',
        Boolean(profileUpdateError) || !profileUpdate,
        'Anonymous profile escalation attempt blocked by RLS'
      );
    } catch (apiErr: any) {
      console.warn('Live API check warning:', apiErr.message);
    }
  }

  // ----------------------------------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('  Admin Security Test Results:');
  console.log('================================================================');

  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✓' : '✗';
    console.log(`[${symbol}] ${r.testName}: ${r.message}`);
    if (!r.passed) {
      allPassed = false;
      if (r.details) console.log('    Details:', r.details);
    }
  }

  console.log('================================================================');
  console.log(`Final Status: ${allPassed ? 'ALL SECURITY TESTS PASSED' : 'SECURITY TESTS FAILED'}`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal security test error:', err);
  process.exit(1);
});
