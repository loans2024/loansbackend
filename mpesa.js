require("dotenv").config();
const axios = require("axios");
const moment = require("moment");
const express = require("express");
const getAccessToken = require("./getAccessToken");

const router = express.Router();

// Use your actual Paybill number
const businessShortCode = "4096591"; 
const passkey = process.env.PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c8937";

const stkPushUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

function formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.trim();
    if (formatted.startsWith("0")) {
        formatted = "254" + formatted.slice(1);
    }
    return formatted;
}

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
        CallBackURL: "https://2990-102-216-154-41.ngrok-free.app/mpesa-callback",
        AccountReference: accountReference,
        TransactionDesc: "Loan processing fee",
    };

    try {
        const response = await axios.post(stkPushUrl, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        return response.data;
    } catch (error) {
        console.error("STK Push error:", error.response ? error.response.data : error.message);
        throw new Error("Failed to initiate Mpesa payment.");
    }
}

router.post("/stkpush", async (req, res) => {
    try {
        const { phoneNumber, accountReference } = req.body;
        const amount = 100;
        const result = await initiateStkPush(phoneNumber, amount, accountReference);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;





