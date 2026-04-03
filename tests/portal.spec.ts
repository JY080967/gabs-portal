import { test, expect } from '@playwright/test';

// Use your actual test user password here!
const TEST_EMAIL = 'testuser@commuter.co.za';
const TEST_PASSWORD = 'SecurePass123!'; 

test.describe('GABS Digital Portal V1.0 - MVP Core Flow', () => {
  
  test('Commuter can log in, view dashboard, and freeze card', async ({ page }) => {
    // ---------------------------------------------------------
    // EPIC 1: SECURE AUTHENTICATION
    // ---------------------------------------------------------
    await page.goto('http://localhost:3000');
    
    // Fill out the login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Log In")');

    // Verify successful login by checking for the Dashboard Header
    await expect(page.locator('h1', { hasText: 'GABS GOLD' })).toBeVisible({ timeout: 10000 });

    // ---------------------------------------------------------
    // EPIC 2: READ LAYER & DATABASE ISOLATION
    // ---------------------------------------------------------
    // Verify RLS is showing the correct linked card
    await expect(page.getByText('GA-99999')).toBeVisible();
    
    // Verify the card is currently active before we begin
    await expect(page.getByText('STATUS: ACTIVE')).toBeVisible();

    // ---------------------------------------------------------
    // EPIC 3: HARDWARE STATE MUTATION (THE KILL SWITCH)
    // ---------------------------------------------------------
    // UAT 3.1: Accidental Click Prevention
    await page.click('button:has-text("Report Lost")');
    await expect(page.getByText('Cancel')).toBeVisible(); 
    await expect(page.getByText('Confirm Freeze')).toBeVisible();
    
    // Test the cancel button safely backs out
    await page.click('button:has-text("Cancel")');
    await expect(page.getByText('Confirm Freeze')).not.toBeVisible();

    // UAT 3.2 & 3.3: The Synchronized Freeze
    await page.click('button:has-text("Report Lost")');
    await page.click('button:has-text("Confirm Freeze")');

    // THE FINAL VERIFICATION: Check that the UI successfully transitions to red FROZEN text
    await expect(page.getByText('STATUS: FROZEN')).toBeVisible({ timeout: 5000 });
    
    // UAT 3.4: Double-Tap Prevention 
    // Ensure the original "Report Lost" button is no longer visible in its default state
    await expect(page.locator('button:has-text("Report Lost")').first()).not.toBeVisible();
  });

});