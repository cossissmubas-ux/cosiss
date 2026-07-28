const axios = require("axios");

const PAYCHANGU_API_URL =
  "https://api.paychangu.com";

async function initializeTransaction(paymentData) {
  const response = await axios.post(
    `${PAYCHANGU_API_URL}/payment`,
    {
      amount: paymentData.amount,
      currency: paymentData.currency,
      email: paymentData.email,
      first_name: paymentData.firstName,
      last_name: paymentData.lastName,
      callback_url: paymentData.callbackUrl,
      return_url: paymentData.returnUrl,
      tx_ref: paymentData.txRef,
      customization: {
        title: "CoSISS Membership",
        description:
          "Payment for CoSISS membership registration"
      }
    },
    {
      headers: {
        Authorization:
          `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );

  return response.data;
}

async function verifyTransaction(txRef) {
  const response = await axios.get(
    `${PAYCHANGU_API_URL}/verify-payment/${encodeURIComponent(
      txRef
    )}`,
    {
      headers: {
        Authorization:
          `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        Accept: "application/json"
      }
    }
  );

  return response.data;
}

module.exports = {
  initializeTransaction,
  verifyTransaction
};