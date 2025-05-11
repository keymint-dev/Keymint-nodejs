// manual-test.js
const { KeyMintSDK } = require('./dist/index.js'); // Import the compiled SDK

async function testKeyMint() {
  const validAccessToken = "at_PeXNJnwg0t224ATok06bBWGEaKJ7QasUpjDYWilsvKQ2f175509d3ed680bfb43590dd7a030dc1";
  const invalidAccessToken = "at_invalid_token_string_example";
  const validProductId = "4b37dac291c517aad2f958";
  const malformedProductId = "malformed-pid";
  const validHostId = "manual-test-host- thriving-banana-07";
  const anotherHostId = "manual-test-host-active-giraffe-08";
  const validDeviceTag = "TestDevice_MacBookPro";
  
  let createdLicenseKey = null; // To store the license key string from createKey

  if (!validAccessToken) {
    console.error("Please set the validAccessToken variable.");
    return;
  }

  const sdk = new KeyMintSDK(validAccessToken);
  const sdkInvalidToken = new KeyMintSDK(invalidAccessToken);

  console.log("\n--- Starting KeyMint SDK Full Manual Test Suite ---");

  // --- 1. Test createKey ---
  console.log("\n--- [1] Testing createKey ---");
  console.log("\n[1.1] Attempting to create a key (Valid Params)...");
  try {
    const createParams = { productId: validProductId, metadata: { test_suite_run: "full_flow" } };
    const newKeyResponse = await sdk.createKey(createParams);
    console.log("[1.1] Raw response from createKey (Valid Params):");
    console.log(newKeyResponse);
    if (newKeyResponse && newKeyResponse.key) {
      createdLicenseKey = newKeyResponse.key;
      console.log(`Stored licenseKey for subsequent tests: ${createdLicenseKey}`);
    } else {
      console.error("Could not extract licenseKey from successful creation. ABORTING further tests that depend on it.");
      return; // Abort if we can't get a key
    }
  } catch (error) {
    console.error("Raw error creating key (Valid - if it failed unexpectedly):");
    console.error(error);
    console.error("ABORTING further tests as initial key creation failed.");
    return; // Abort if key creation fails
  }
  // Invalid createKey scenarios (quick checks)
  console.log("\n[1.2] Attempting to create a key (Missing productId)...");
  try { await sdk.createKey({}); console.log("Unexpected success"); } catch (error) { console.error("[1.2] Raw error (Missing productId - Expected):"); console.error(error); }
  console.log("\n[1.3] Attempting to create a key (Malformed productId)...");
  try { await sdk.createKey({ productId: malformedProductId }); console.log("Unexpected success"); } catch (error) { console.error("[1.3] Raw error (Malformed productId - Expected):"); console.error(error); }
  console.log("\n[1.4] Attempting to create a key (Invalid Access Token)...");
  try { await sdkInvalidToken.createKey({ productId: validProductId }); console.log("Unexpected success"); } catch (error) { console.error("[1.4] Raw error (Invalid AT - Expected):"); console.error(error); }

  // --- 2. Test getKey (Initial state) ---
  console.log("\n\n--- [2] Testing getKey (Initial State) ---");
  console.log(`\n[2.1] Attempting to get key details (Key: ${createdLicenseKey}, Product: ${validProductId})...`);
  try {
    const keyDetails = await sdk.getKey({ productId: validProductId, licenseKey: createdLicenseKey });
    console.log("[2.1] Raw response from getKey (Initial State):");
    console.log(keyDetails);
  } catch (error) {
    console.error("[2.1] Raw error getting key details (Initial State):");
    console.error(error);
  }

  // --- 3. Test activateKey ---
  console.log("\n\n--- [3] Testing activateKey ---");
  const activateParams = { productId: validProductId, licenseKey: createdLicenseKey, hostId: validHostId, deviceTag: validDeviceTag };
  console.log(`\n[3.1] Attempting to activate key (Params: ${JSON.stringify(activateParams)})...`);
  try {
    const activationResponse = await sdk.activateKey(activateParams);
    console.log("[3.1] Raw response from activateKey (Valid):");
    console.log(activationResponse);
  } catch (error) {
    console.error("[3.1] Raw error activating key (Valid):");
    console.error(error);
  }
  // Invalid activateKey scenarios
  console.log("\n[3.2] Attempting to activate key (Missing licenseKey)...");
  try { await sdk.activateKey({ productId: validProductId, hostId: validHostId }); console.log("Unexpected success"); } catch (e) { console.error("[3.2] Raw error (Missing licenseKey - Expected):"); console.error(e);}
  console.log("\n[3.3] Attempting to activate key (Missing productId)...");
  try { await sdk.activateKey({ licenseKey: createdLicenseKey, hostId: validHostId }); console.log("Unexpected success"); } catch (e) { console.error("[3.3] Raw error (Missing productId - Expected):"); console.error(e);}
  console.log("\n[3.4] Attempting to activate key (Non-existent licenseKey)...");
  try { await sdk.activateKey({ productId: validProductId, licenseKey: 'NONEXISTENT-KEY-12345', hostId: validHostId }); console.log("Unexpected success"); } catch (e) { console.error("[3.4] Raw error (Non-existent key - Expected):"); console.error(e);}
  // Note: Activating an already active key on the same hostId might be a valid NOP or an error - API behavior dependent.
  console.log(`\n[3.5] Attempting to activate key again on same hostId (${validHostId})...`);
   try {
    const activationResponse = await sdk.activateKey(activateParams); // Same params as 3.1
    console.log("[3.5] Raw response from activateKey (Again on same hostId):");
    console.log(activationResponse);
  } catch (error) {
    console.error("[3.5] Raw error activating key (Again on same hostId):");
    console.error(error);
  }

  // --- 4. Test getKey (After Activation) ---
  console.log("\n\n--- [4] Testing getKey (After Activation) ---");
  console.log(`\n[4.1] Attempting to get key details (Key: ${createdLicenseKey})...`);
  try {
    const keyDetails = await sdk.getKey({ productId: validProductId, licenseKey: createdLicenseKey });
    console.log("[4.1] Raw response from getKey (After Activation):");
    console.log(keyDetails);
    // You might want to check keyDetails.data.license.devices or activations here
  } catch (error) {
    console.error("[4.1] Raw error getting key details (After Activation):");
    console.error(error);
  }

  // --- 5. Test deactivateKey ---
  console.log("\n\n--- [5] Testing deactivateKey ---");
  const deactivateParams = { productId: validProductId, licenseKey: createdLicenseKey, hostId: validHostId };
  console.log(`\n[5.1] Attempting to deactivate key (Params: ${JSON.stringify(deactivateParams)})...`);
  try {
    const deactivationResponse = await sdk.deactivateKey(deactivateParams);
    console.log("[5.1] Raw response from deactivateKey (Valid):");
    console.log(deactivationResponse);
  } catch (error) {
    console.error("[5.1] Raw error deactivating key (Valid):");
    console.error(error);
  }
  // Invalid deactivateKey scenarios
  console.log("\n[5.2] Attempting to deactivate key (Wrong hostId)...");
  try { await sdk.deactivateKey({ productId: validProductId, licenseKey: createdLicenseKey, hostId: anotherHostId }); console.log("Unexpected success"); } catch (e) { console.error("[5.2] Raw error (Wrong hostId - Expected to fail or be NOP):"); console.error(e);}
  console.log("\n[5.3] Attempting to deactivate key (No hostId if it was activated with one - might fail or succeed depending on API logic)...");
  try { await sdk.deactivateKey({ productId: validProductId, licenseKey: createdLicenseKey }); console.log("Unexpected success/NOP"); } catch (e) { console.error("[5.3] Raw error (No hostId - behavior may vary):"); console.error(e);}

  // --- 6. Test getKey (After Deactivation) ---
  console.log("\n\n--- [6] Testing getKey (After Deactivation) ---");
  console.log(`\n[6.1] Attempting to get key details (Key: ${createdLicenseKey})...`);
  try {
    const keyDetails = await sdk.getKey({ productId: validProductId, licenseKey: createdLicenseKey });
    console.log("[6.1] Raw response from getKey (After Deactivation):");
    console.log(keyDetails);
  } catch (error) {
    console.error("[6.1] Raw error getting key details (After Deactivation):");
    console.error(error);
  }

  // --- 7. Test blockKey ---
  console.log("\n\n--- [7] Testing blockKey ---");
  const blockParams = { productId: validProductId, licenseKey: createdLicenseKey };
  console.log(`\n[7.1] Attempting to block key (Params: ${JSON.stringify(blockParams)})...`);
  try {
    const blockResponse = await sdk.blockKey(blockParams);
    console.log("[7.1] Raw response from blockKey (Valid):");
    console.log(blockResponse);
  } catch (error) {
    console.error("[7.1] Raw error blocking key (Valid):");
    console.error(error);
  }
  // Invalid blockKey scenarios
  console.log("\n[7.2] Attempting to block key (Non-existent key)...");
  try { await sdk.blockKey({ productId: validProductId, licenseKey: 'NONEXISTENT-KEY-BLOCK' }); console.log("Unexpected success"); } catch (e) { console.error("[7.2] Raw error (Non-existent key - Expected):"); console.error(e);}

  // --- 8. Test getKey (After Block) ---
  console.log("\n\n--- [8] Testing getKey (After Block) ---");
   console.log(`\n[8.1] Attempting to get key details (Key: ${createdLicenseKey})...`);
  try {
    const keyDetails = await sdk.getKey({ productId: validProductId, licenseKey: createdLicenseKey });
    console.log("[8.1] Raw response from getKey (After Block):");
    console.log(keyDetails); // Check if 'activated' field or other indicators change
  } catch (error) {
    console.error("[8.1] Raw error getting key details (After Block):");
    console.error(error);
  }

  // --- 9. Test activateKey (On Blocked Key - Expected to Fail) ---
  console.log("\n\n--- [9] Testing activateKey (On Blocked Key) ---");
  console.log(`\n[9.1] Attempting to activate blocked key (Params: ${JSON.stringify(activateParams)})...`);
  try {
    const activationResponse = await sdk.activateKey(activateParams);
    console.log("[9.1] Raw response from activateKey (On Blocked Key - UNEXPECTED SUCCESS):");
    console.log(activationResponse);
  } catch (error) {
    console.error("[9.1] Raw error activating key (On Blocked Key - EXPECTED FAILURE):");
    console.error(error);
  }

  // --- 10. Test unblockKey ---
  console.log("\n\n--- [10] Testing unblockKey ---");
  const unblockParams = { productId: validProductId, licenseKey: createdLicenseKey };
  console.log(`\n[10.1] Attempting to unblock key (Params: ${JSON.stringify(unblockParams)})...`);
  try {
    const unblockResponse = await sdk.unblockKey(unblockParams);
    console.log("[10.1] Raw response from unblockKey (Valid):");
    console.log(unblockResponse);
  } catch (error) {
    console.error("[10.1] Raw error unblocking key (Valid):");
    console.error(error);
  }

  // --- 11. Test getKey (After Unblock) ---
  console.log("\n\n--- [11] Testing getKey (After Unblock) ---");
  console.log(`\n[11.1] Attempting to get key details (Key: ${createdLicenseKey})...`);
  try {
    const keyDetails = await sdk.getKey({ productId: validProductId, licenseKey: createdLicenseKey });
    console.log("[11.1] Raw response from getKey (After Unblock):");
    console.log(keyDetails);
  } catch (error) {
    console.error("[11.1] Raw error getting key details (After Unblock):");
    console.error(error);
  }

  // --- 12. Test activateKey (On Unblocked Key - Expected to Succeed) ---
  console.log("\n\n--- [12] Testing activateKey (On Unblocked Key) ---");
  // Use a different hostId for a fresh activation or re-use validHostId if allowed
  const activateAfterUnblockParams = { productId: validProductId, licenseKey: createdLicenseKey, hostId: anotherHostId, deviceTag: "SecondTestDevice" };
  console.log(`\n[12.1] Attempting to activate unblocked key (Params: ${JSON.stringify(activateAfterUnblockParams)})...`);
  try {
    const activationResponse = await sdk.activateKey(activateAfterUnblockParams);
    console.log("[12.1] Raw response from activateKey (On Unblocked Key - Expected Success):");
    console.log(activationResponse);
  } catch (error) {
    console.error("[12.1] Raw error activating key (On Unblocked Key - UNEXPECTED FAILURE):");
    console.error(error);
  }
  
  // Final getKey to see the state
  console.log("\n\n--- [13] Final getKey ---");
  console.log(`\n[13.1] Attempting to get key details (Key: ${createdLicenseKey})...`);
  try {
    const keyDetails = await sdk.getKey({ productId: validProductId, licenseKey: createdLicenseKey });
    console.log("[13.1] Raw response from getKey (Final State):");
    console.log(keyDetails);
  } catch (error) {
    console.error("[13.1] Raw error getting key details (Final State):");
    console.error(error);
  }

  console.log("\n--- KeyMint SDK Full Manual Test Suite Finished ---");
}

testKeyMint();
 