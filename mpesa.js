const express = require("express");
const axios = require("axios");
const moment = require("moment");
const router = express.Router();

// Replace with your actual Safaricom sandbox credentials
const consumerKey = "YOUR_CONSUMER_KEY";
const consumerSecret = "YOUR_CONSUMER_SECRET";
const businessShortCode = "4096591"; // Your paybill number
const passkey = "YOUR_PASSKEY"; // Your sandbox passkey

// Sandbox endpoints
const authUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const stkPushUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

// Function to get an access token
async function getAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await axios.get(authUrl, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return response.data.access_token;
}

// Function to initiate an STK Push (simulate payment prompt)
async function initiateStkPush(phoneNumber, amount, accountReference) {
  const accessToken = await getAccessToken();
  const timestamp = moment().format("YYYYMMDDHHmmss");
  const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount, // Here, 100 for processing fee
    PartyA: phoneNumber, // Customer's number (format: 2547XXXXXXXX)
    PartyB: businessShortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: "https://yourdomain.com/mpesa-callback", // Update with your callback URL
    AccountReference: accountReference, // For example, client's name
    TransactionDesc: "Loan processing fee",
  };

  const response = await axios.post(stkPushUrl, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

// POST endpoint to trigger STK Push
router.post("/stkpush", async (req, res) => {
  try {
    const { phoneNumber, accountReference } = req.body;
    const amount = 100; // Fixed fee for processing
    const result = await initiateStkPush(phoneNumber, amount, accountReference);
    res.status(200).json(result);
  } catch (error) {
    console.error("STK Push error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to initiate Mpesa payment." });
  }
});

module.exports = router;
