const express = require("express");
const axios = require("axios");
const moment = require("moment");
const router = express.Router();

// Your Safaricom sandbox credentials (ensure these are the correct sandbox keys)
const consumerKey = "y2GBWOA9DSYo8gJcTPibAcBBdQrg5AmDPpShCKOgHHu7wauy";
const consumerSecret = "mx8zrGgGVGcIAlQkfpa6VvOKBGeAZPmGCnOQ4heqsSY2VaelcK0jMxuMLmscwUFD";

// Use sandbox defaults for STK Push
const businessShortCode = "174379"; // Default sandbox Business Short Code
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c8937"; // Default sandbox Passkey

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

// Helper function to format phone numbers to international format
function formatPhoneNumber(phoneNumber) {
  let formatted = phoneNumber.trim();
  if (formatted.startsWith("0")) {
    formatted = "254" + formatted.slice(1);
  }
  return formatted;
}

// Function to initiate an STK Push (simulate payment prompt)
async function initiateStkPush(phoneNumber, amount, accountReference) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const accessToken = await getAccessToken();
  const timestamp = moment().format("YYYYMMDDHHmmss");
  const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: formattedPhone,
    PartyB: businessShortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: "https://loansbackend.onrender.com/mpesa-callback", // Update with your actual callback URL
    AccountReference: accountReference,
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


