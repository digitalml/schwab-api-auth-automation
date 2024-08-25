# Schwab API Automation with Puppeteer and Express

This project demonstrates how to automate Schwab's OAuth-based authentication with Schwab API (https://developer.schwab.com/) by using Puppeteer and an HTTPS Express server. The project includes functions for OAuth authentication, token refresh, and an API test call to retrieve account information.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
   - [Environment Variables](#environment-variables)
   - [OpenSSL and Certificates](#openssl-and-certificates)
3. [Usage](#usage)
   - [Starting the Server and Running Puppeteer Automation](#starting-the-server-and-running-puppeteer-automation)
   - [API Test Calls](#api-test-calls)
4. [License](#license)

## Overview

This project uses Puppeteer to automate the OAuth login process for Schwab API. It also includes an HTTPS server built with Express to handle the OAuth redirect and capture the authorization code, which is then exchanged for an access token and refresh token.

The project includes:

- **HTTPS Server**: Listens for OAuth redirect and processes the authorization code.
- **Puppeteer Automation**: Automates the login process to acquire the authorization code.
- **API Test**: Retrieves account information using the acquired access token and demonstrates token refreshing.

### Schwab Developer Portal Setup

You need to make sure you have a Schwab Developer Portal account created and a Schwab Developer Portal 'Ready For Use' App created for 'Production'.

I use the **Accounts and Trading Production** and **Market Data Production** APIs. The "App Key" in your Schwab Developer Portal App details section is the `Client ID` and the "Secret" is the `Client Secret`.

The redirect URL should be an HTTPS server that can immediately respond (within 30 seconds or less) to the Schwab OAuth authentication response. The redirect URL is set up in your Schwab Developer Portal App details section labeled as "Callback URL".

For local development, my App's "Callback URL" is set to `https://127.0.0.1` so I can run this Node.js Express server to intercept the call.

## Setup

### Environment Variables

You need to create a `.env` file in the root directory of the project to store your sensitive information. This file will not be included in the repository, so you will need to create it manually.

Example `.env` file:

```bash
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
REDIRECT_URI=https://127.0.0.1
LOGIN_ID=your-login-id
PASSWORD=your-password
```

- **CLIENT_ID**: Your Schwab API App Key.
- **CLIENT_SECRET**: Your Schwab API App Secret.
- **REDIRECT_URI**: The Callback URL that the OAuth flow will redirect to (usually `https://127.0.0.1`).
- **LOGIN_ID**: Your Schwab login ID - the one you log into the website or thinkorswim with (used by Puppeteer).
- **PASSWORD**: Your Schwab password - the one you log into the website or thinkorswim with (used by Puppeteer).

### OpenSSL and Certificates

Since the Express server requires HTTPS, you will need to generate a self-signed certificate using OpenSSL. Follow these steps to generate the necessary SSL key and certificate.

1. **Install OpenSSL**: If OpenSSL is not already installed, you can download and install it from [OpenSSL's official website](https://www.openssl.org/).

2. **Generate a Private Key**: Run the following command to generate a private key (`server-key.pem`):

   ```bash
   openssl genrsa -out server-key.pem 2048
   ```

3. **Create a Self-Signed Certificate**: Run the following command to generate a self-signed certificate (`server-cert.pem`):

   ```bash
   openssl req -new -x509 -key server-key.pem -out server-cert.pem -days 365
   ```

   You will be prompted to enter information like country, state, etc. For local development, you can use default values.

4. **Place the Key and Certificate**: Ensure that the generated `server-key.pem` and `server-cert.pem` are in the root directory of your project.

These certificates will allow your local HTTPS server to run securely. Note that since they are self-signed, your browser might show a security warning, which can be bypassed during development.

## Usage

### Starting the Server and Running Puppeteer Automation

1. **Install Dependencies**: Run the following command to install all required dependencies:

   ```bash
   npm install
   ```

2. **Run the Project**: Start the project with the following command from the terminal:

   ```bash
   npm start
   ```

   This will:

   - Start the HTTPS server to listen for the OAuth redirect.
   - Trigger Puppeteer to automate the login process and retrieve the authorization code.
   - Exchange the authorization code for access and refresh tokens.
   - Test API calls with the access token.
   - Demonstrate token refreshing.

3. **Screenshots**: Screenshots will only be taken if the `takeScreenshots` global variable is set to `true` in the code. You can enable this if you want to debug the automation visually.

### API Test Calls

Once the OAuth flow is complete, an API call is made to retrieve account information using the `getAccounts()` function. The token refreshing process is also demonstrated with the `refreshAuthToken()` function, and a subsequent API call is made using the refreshed access token.

You can modify these functions to test other API endpoints as needed.

## License

This project is licensed under the MIT License. You are free to use this code without providing credit.
