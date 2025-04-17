require("dotenv").config();
const axios = require("axios");

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds

    if (cachedToken && tokenExpiry && now < tokenExpiry) {
        console.log("Using cached token");
        return cachedToken;
    }

    try {
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        cachedToken = response.data.access_token;
        tokenExpiry = now + parseInt(response.data.expires_in, 10);

        console.log("New token generated:", cachedToken);
        return cachedToken;
    } catch (error) {
        console.error("Error fetching token:", error.response ? error.response.data : error.message);
        throw new Error("Failed to fetch M-Pesa access token.");
    }
}

module.exports = getAccessToken;


