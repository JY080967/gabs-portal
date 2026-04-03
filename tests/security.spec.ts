import { test, expect } from '@playwright/test';

test.describe('GABS Digital Portal V1.0 - Security & Intrusion', () => {
  
  test('Intrusion Detection: Blocks unauthorized API access (UAT 1.3)', async ({ request }) => {
    // ---------------------------------------------------------
    // THE ATTACK
    // ---------------------------------------------------------
    // A hacker attempts to hit the secure read layer directly, 
    // without logging in or holding a valid gabs_session cookie.
    const response = await request.get('http://localhost:3000/api/portal/dashboard');

    // ---------------------------------------------------------
    // THE DEFENSE VERIFICATION
    // ---------------------------------------------------------
    // 1. Verify the API successfully recognized the missing/invalid token 
    // and slammed the door with a strict 401 HTTP status code.
    expect(response.status()).toBe(401);

    const responseBody = await response.json();

    // 2. Verify the JSON payload safely obfuscates the system and asks for auth
    expect(responseBody.error).toBe('Unauthorized. Please log in.');

    // 3. STRICT ISOLATION CHECK: Mathematically prove that absolutely zero 
    // commuter telemetry or financial data leaked in the rejected response.
    expect(responseBody.user).toBeUndefined();
    expect(responseBody.product).toBeUndefined();
    expect(responseBody.recent_trips).toBeUndefined();
  });

});