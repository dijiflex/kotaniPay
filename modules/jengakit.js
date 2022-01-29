const functions = require('firebase-functions');
const axios = require("axios");
const qs = require('qs');
const crypto = require('crypto');
const fs = require('fs')
var randomstring = require("randomstring");

const jenga_username = functions.config().env.jenga.username; 
const jenga_password = functions.config().env.jenga.password;
const jenga_api_key = functions.config().env.jenga.api_key;
const merchant_code = functions.config().env.jenga.merchant_code;
const account_id = functions.config().env.jenga.account_id;
const jenga_api_url = functions.config().env.jenga.api_url;
const country_code = 'KE';

const getAccessToken = async () => {
  let res = await axios({
    method: 'post',
    url: 'https://api.jengahq.io/identity/v2/token',
    data: qs.stringify({
      username: jenga_username,
      password: jenga_password
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      'Authorization': jenga_api_key
    }
  });
  return res.data.access_token;
};

const getSignature = async () => {
  let countrycode = country_code;
  let acountId = account_id;
  const jenga_account_id = `${countrycode}${acountId}`;
  // console.log('Signature ID: ',jenga_account_id)

  const sign = crypto.createSign('SHA256');
  sign.write(jenga_account_id);
  sign.end();

  const privateKey = fs.readFileSync('jenga-api_privatekey.pem');
  signature_b64 = sign.sign(privateKey, 'base64');
  return signature_b64;
};

const generateReferenceCode = () => {
  return new Promise(resolve => {
    resolve (randomstring.generate({ length: 12, charset: 'numeric' }));
  });
};

const getSendToUserMobileSignature = async (amount, currencyCode, referenceCode) => {
  const jenga_transfer_account_id = amount+currencyCode+referenceCode+account_id;   //amount+currencyCode+refrenceCode+accountNumber

  const sign = crypto.createSign('SHA256');
  sign.write(jenga_transfer_account_id);
  sign.end();

  const privateKey = fs.readFileSync('jenga-api/privatekey.pem');
  signature_b64 = sign.sign(privateKey, 'base64');
  return signature_b64;
};

const getTimeStamp = async () => {
  var timestamp = new Date();
  var dd = timestamp.getDate();  
  var mm = timestamp.getMonth()+1; 
  var yyyy = timestamp.getFullYear();
  if(dd<10){ dd='0'+dd; }   
  if(mm<10){ mm='0'+mm; } 
  today = yyyy+'-'+mm+'-'+dd;

  return today;
  // return [year, month, day].join('-');
};

exports.getBalance = async () => {
  let access_token = await getAccessToken();
  // console.log('Access Token: ',access_token);

  let signature = await getSignature();
  // console.log('Signature=> ',signature);

  let countryCode = country_code;
  let accountID = account_id;
  let jenga_account_balance_url = `https://api.jengahq.io/account/v2/accounts/balances/${countryCode}/${accountID}`;

  let res = await axios({
    method: 'get',
    url: jenga_account_balance_url,
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'signature': signature,
      'Content-Type': 'application/json'
    }
  });
  console.log('Jenga get balance response: ',JSON.stringify(res.data));
  return res.data;
};

exports.getMiniStatement = async () => {
  let access_token = await getAccessToken();
  // console.log('Access Token: ',access_token);
  let signature = await getSignature();
  // console.log('Signature=> ',signature)

  let res = await axios({
    method: 'get',
    url: `https://api.jengahq.io/account/v2/accounts/ministatement/KE/${ACCOUNT_NUMBER}`,
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'signature': signature,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
};

const getReceiveFromEasypaySignature = async (trxReference, trxAmount, merchantCode, countryCode) => {
  const jenga_trx_reference_id = trxReference+trxAmount+merchantCode+countryCode;

  const sign = crypto.createSign('SHA256');
  sign.write(jenga_trx_reference_id);
  sign.end();

  const privateKey = fs.readFileSync('jenga-api/privatekey.pem');
  signature_b64 = sign.sign(privateKey, 'base64');
  return signature_b64;
};

exports.receiveFromEazzypayPush = async (mobileNumber, referenceCode,  amount) => {
  try{
    let jenga_mpesaStkpush_url = `https://api.jengahq.io/transaction/v2/payments`;

    let access_token = await getAccessToken();
    // console.log(access_token);

    let referenceCode = await generateReferenceCode();
    // console.log(reference);

    let signature = await getReceiveFromEasypaySignature(referenceCode, amount, merchant_code, country_code);
    // console.log(signature);

    let res = await axios({
      method: 'post',
      url: jenga_mpesaStkpush_url,
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'signature': signature,
        'Content-Type': 'application/json'
      },
      data: {
        "customer": {
            "mobileNumber": mobileNumber,
            "countryCode": "KE"
        },
        "transaction": {
            "amount": amount,
            "description": "Kotani Pay EazzyPay PUSH",
            "type": "EazzyPayOnline",
            "reference": referenceCode
        }
      }
    });
    return res.data;
  }catch(e){console.log(e)}
};

exports.sendFromJengaToMobileMoney = async (amount, referenceCode, currencyCode, countryCode, recipientName, mobileNumber) => {
  try{
    let access_token = await getAccessToken();
    let signature = await getSendToUserMobileSignature(amount, currencyCode, referenceCode);
    let date = await getTimeStamp();

    let res = await axios({
      method: 'post',
      url: `https://api.jengahq.io/transaction/v2/remittance`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'signature': signature,
        'Content-Type': 'application/json'
      },
      data: {
        "source": {
            "countryCode": countryCode,
            "name": "Kotani Pay Limited",
            "accountNumber": account_id
        },
        "destination": {
            "type": "mobile",
            "countryCode": countryCode,
            "name": recipientName,
            "mobileNumber": mobileNumber,
            "walletName": "Mpesa"
        },
        "transfer": {
            "type": "MobileWallet",
            "amount": amount,
            "currencyCode": currencyCode,
            "reference": referenceCode,
            "date": date,
            "description": "Cash From Kotani Pay via Jenga"
        }
      }
    });
    return res.data;
  }catch(e){console.log(e)}
};

const getKycSignature = async (merchantcode, documentNumber, countryCode) => {
  const jenga_kyc_account_id = merchantcode + documentNumber + countryCode;

  const sign = crypto.createSign('SHA256');
  sign.write(jenga_kyc_account_id);
  sign.end();

  const privateKey = fs.readFileSync('jenga_api_privatekey.pem');
  signature_b64 = sign.sign(privateKey, 'base64');
  return signature_b64;
};

exports.getUserKyc = async (merchantcode, documentType, documentNumber, firstName, lastName, dateOfBirth, countryCode) => {
  let access_token = await getAccessToken();
  // console.log('Access Token: ',access_token);
  let signature = await getKycSignature(merchantcode, documentNumber, countryCode);
  // console.log('Signature=> ',signature)
  let res = await axios({
    method: 'post',
    url: `https://api.jengahq.io/customer/v2/identity/verify`,
    data: { 
     "identity": {
       "documentType": documentType, 
       "firstName": firstName,  
       "lastName": lastName, 
       "dateOfBirth": dateOfBirth,  
       "documentNumber": documentNumber, 
       "countryCode": countryCode 
     }
    },
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'signature': signature,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
};

exports.getTransactionStatus = async (requestId, date) => {
  let access_token = await getAccessToken();
  // console.log('Access Token: ',access_token);
  let res = await axios({
    method: 'post',
    url: `https://api.jengahq.io/transaction/v2/b2c/status/query`,
    data: { 
      "requestId": requestId,
      "destination": {
         "type": "M-Pesa"
      },
      "transfer": {
         "date": date
      }
    },
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
};
