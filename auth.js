require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const puppeteer = require("puppeteer");

const app = express();

// Global variables
let authorizationCode;
let accessToken;
let refreshToken;
const takeScreenshots = false; // Set to true to enable screenshots

// Load from .env file
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

// Start the HTTPS server
function startServer() {
  return new Promise((resolve, reject) => {
    const httpsOptions = {
      key: fs.readFileSync("server-key.pem"), // Don't forget to create your Self Signed SSL Cert
      cert: fs.readFileSync("server-cert.pem"), // Don't forget to create your Self Signed SSL Cert
    };

    const server = https.createServer(httpsOptions, app);

    // Listen for GET requests on /
    app.get("/", (req, res) => {
      // Extract URL parameters
      authorizationCode = req.query.code;

      if (!authorizationCode) {
        return res.status(400).send("Missing authorization code");
      }

      // Call the getAuthToken function
      getAuthToken()
        .then((tokens) => {
          // Send response to client
          res.send("Authorization process completed. Check the logs for details.");
          resolve(tokens); // Resolve with the tokens once received
        })
        .catch(reject);
    });

    // Start the server
    server.listen(443, () => {
      console.log("Express server is listening on port 443");
    });

    // Set a timeout to close the server after 60 seconds if no authorization code is received
    setTimeout(() => {
      if (!authorizationCode) {
        console.log("Timeout: No authorization code received. Shutting down the server.");
        server.close(() => resolve(null));
      }
    }, 60000);
  });
}

// Function to fetch the auth token
async function getAuthToken() {
  // Base64 encode the client_id:client_secret
  const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await axios({
      method: "POST",
      url: "https://api.schwabapi.com/v1/oauth/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Credentials}`,
      },
      data: `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${redirectUri}`,
    });

    console.log("*** GOT NEW AUTH TOKEN ***");

    // Log the refresh_token and access_token before exiting
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    return response.data;
  } catch (error) {
    console.error("Error fetching auth token:", error);
    throw error;
  }
}

// Function to automate the login process using Puppeteer
async function automateLogin() {
  const browser = await puppeteer.launch({
    headless: true, // May need to set to false in the future to avoid automation dectection
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled", // To make automation less detectable
      "--ignore-certificate-errors", // Ignore all certificate errors
      "--disable-web-security", // Optionally disable web security
      "--disable-features=SecureDNS,EnableDNSOverHTTPS", // Disable Secure DNS and DNS-over-HTTPS
    ],
  });

  const page = await browser.newPage();

  // Set user agent to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    // Go to the OAuth authorization URL
    await page.goto(
      `https://api.schwabapi.com/v1/oauth/authorize?response_type=code&client_id=${clientId}&scope=readonly&redirect_uri=${redirectUri}`,
      { waitUntil: "load" }
    );

    // Conditionally take a screenshot after loading the page
    if (takeScreenshots) await page.screenshot({ path: "login-page.png" });
    console.log("Navigation to login page successful.");

    // Wait for the login ID input field to be visible
    await page.waitForSelector("#loginIdInput", { visible: true });
    console.log("Login ID input is visible.");

    // Wait for the password input field to be visible
    await page.waitForSelector("#passwordInput", { visible: true });
    console.log("Password input is visible.");

    // Fill in the login ID with a slower typing speed
    await page.type("#loginIdInput", process.env.LOGIN_ID, { delay: 100 }); // Replace with your actual login ID
    console.log("Login ID entered.");

    // Fill in the password with a slower typing speed
    await page.type("#passwordInput", process.env.PASSWORD, { delay: 100 }); // Replace with your actual password
    console.log("Password entered.");

    // Conditionally take a screenshot after filling in the form
    if (takeScreenshots) await page.screenshot({ path: "filled-form.png" });

    // Click the login button
    await page.click("#btnLogin");
    console.log("Login button clicked.");

    // Wait for navigation to the terms acceptance page
    await page.waitForNavigation({ waitUntil: "load" });
    console.log("Navigation to terms page successful.");

    // Conditionally take a screenshot after navigating to the terms page
    if (takeScreenshots) await page.screenshot({ path: "terms-page.png" });

    // Wait for the terms checkbox to be visible
    await page.waitForSelector("#acceptTerms", { visible: true });
    console.log("Terms checkbox is visible.");

    // Check the terms checkbox
    await page.click("#acceptTerms");
    console.log("Terms checkbox clicked.");

    // Conditionally take a screenshot after checking the checkbox
    if (takeScreenshots) await page.screenshot({ path: "terms-checkbox.png" });

    // Click the "Continue" button
    await page.click("#submit-btn");
    console.log("Continue button clicked.");

    // Wait for the modal dialog to appear
    await page.waitForSelector("#agree-modal-btn-", { visible: true });
    console.log("Modal dialog is visible.");

    // Conditionally take a screenshot of the modal
    if (takeScreenshots) await page.screenshot({ path: "modal-dialog.png" });

    // Click the "Accept" button in the modal
    await page.click("#agree-modal-btn-");
    console.log("Modal 'Accept' button clicked.");

    // Wait for navigation to the accounts page
    await page.waitForNavigation({ waitUntil: "load" });
    console.log("Navigation to accounts page successful.");

    // Wait for checkbox's to appear
    await page.waitForSelector("input[type='checkbox']", { visible: true });

    // Conditionally take a screenshot after navigating to accounts page
    if (takeScreenshots) await page.screenshot({ path: "accounts-page.png" });

    // Make sure all accounts are checked (if they aren't by default)
    const accountsChecked = await page.$eval("input[type='checkbox']", (checkbox) => checkbox.checked);
    if (!accountsChecked) {
      await page.click("input[type='checkbox']");
      console.log("Account checkbox clicked.");
    } else {
      console.log("Account checkbox was already checked.");
    }

    // Conditionally take a screenshot after ensuring accounts are checked
    if (takeScreenshots) await page.screenshot({ path: "accounts-checked.png" });

    // Click the "Continue" button on the accounts page
    await page.click("#submit-btn");
    console.log("Continue button clicked on accounts page.");

    // Wait for navigation to the confirmation page
    await page.waitForNavigation({ waitUntil: "load" });
    console.log("Navigation to confirmation page successful.");

    // Conditionally take a screenshot after navigating to the confirmation page
    if (takeScreenshots) await page.screenshot({ path: "confirmation-page.png" });

    // Click the "Done" button on the confirmation page
    await page.click("#cancel-btn");
    console.log("Done button clicked.");

    // Wait for the final redirect to your HTTPS server
    await page.waitForNavigation({ waitUntil: "load" });
    console.log("Redirect to HTTPS server successful.");

    // Conditionally take a screenshot after the final redirect
    if (takeScreenshots) await page.screenshot({ path: "final-redirect.png" });

    console.log("Puppeteer automation completed.");
  } catch (error) {
    console.error("Error during automation:", error);
  } finally {
    await browser.close();
  }
}

async function refreshAuthToken() {
  console.log("*** REFRESHING ACCESS TOKEN ***");

  // Base64 encode the client_id:client_secret
  const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await axios({
      method: "POST",
      url: "https://api.schwabapi.com/v1/oauth/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Credentials}`,
      },
      data: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    });

    // Log the new refresh_token and access_token
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    console.log("New Refresh Token:", response.data.refresh_token);
    console.log("New Access Token:", response.data.access_token);

    return response.data;
  } catch (error) {
    console.error("Error refreshing auth token:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getAccounts() {
  console.log("*** API TEST CALL: ACCOUNTS ***");

  const res = await axios({
    method: "GET",
    url: "https://api.schwabapi.com/trader/v1/accounts?fields=positions",
    contentType: "application/json",
    headers: {
      "Accept-Encoding": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  });

  console.log(res.data);
}

// Main function to coordinate the server and Puppeteer
async function main() {
  // Start the HTTPS server
  const serverPromise = startServer();

  // Run Puppeteer automation
  await automateLogin();

  // Wait for the server to finish (either timeout or successful authorization)
  const tokens = await serverPromise;

  if (tokens) {
    console.log("Authorization process completed successfully.");

    // Test api with new accessToken
    await getAccounts();

    // Test refreshToken
    await refreshAuthToken();

    // Test api with refreshed accessToken
    await getAccounts();
  } else {
    console.log("No tokens received within the timeout period.");
  }

  process.exit();
}

main().catch(console.error);
