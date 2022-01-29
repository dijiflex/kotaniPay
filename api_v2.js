const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firestore = admin.firestore();
const { getUserId, getUserDetails, getTargetCountry, getLocalCurrencyAmount, getTargetEscrow, number_format, checkIfSenderExists, processApiWithdraw, setProcessedTransaction, checkisUserKyced, addUserKycToDB, getExchangeRate  } = require("./modules/libraries");
// Express and CORS middleware init
const express = require('express');
 const cors = require('cors');

 const bearerToken = require('express-bearer-token');
const bcrypt = require('bcryptjs');
 const api_v2 = express().use(cors({ origin: true }), bearerToken());
const lib = require('./modules/libraries');
const {generateAccessToken, authenticateToken} = require('./modules');
var {  isValidPhoneNumber, validateMSISDN } = require('./modules/utilities');

const {  weiToDecimal, sendcUSD, checkIfBeneficiary, addBeneficiary, checkUbiScBalance, sendUBIClaim, buyCelo, getContractKit,  getLatestBlock, validateWithdrawHash } = require('./modules/celokit');



// 👍🏽 
api_v2.post('/api/login', async (req, res) => {
  let userMSISDN = await validateMSISDN(req.body.phoneNumber, req.body.countryCode)
  console.log('MSISDN:', userMSISDN);
  let userId = await lib.getUserId(userMSISDN);

  let userInfo = await lib.getKotaniPartnerDetails(userId);
  if (userInfo.data() === undefined || userInfo.data() === null || userInfo.data() === '') {
    return res.status(400).send('Cannot find user')
  }
  try {
    if(await bcrypt.compare(req.body.password, userInfo.data().password)) {
      const accessToken = generateAccessToken(userInfo.data());
      res.json({ status:201, accessToken: accessToken });
    } 
    else {return res.json({status:400, desc: 'Not Allowed'})}
  } catch (e){console.log(e); res.status(500).send() }
});


// 👍🏽
api_v2.post("/kyc/user/create", authenticateToken, async (req, res) => {
  console.log("Received request for: " + req.url);
  try{
    const phoneNumber = req.body.phoneNumber;
    console.log(JSON.stringify(req.body));
    
    let permissionLevel = req.user.permissionLevel;
    let targetCountry = getTargetCountry(permissionLevel, req.user.targetCountry);

    let _isValidPhoneNumber = await isValidPhoneNumber(phoneNumber, targetCountry);
    console.log('isValidKePhoneNumber ', _isValidPhoneNumber)
    if(!_isValidPhoneNumber){return res.json({status: 400, desc: 'invalid phoneNumber'})}

    let userMSISDN = await validateMSISDN(phoneNumber, targetCountry);

    let userId = await lib.getUserId(userMSISDN);
    console.log('senderId: ', userId); 
    let userExists = await lib.checkIfSenderExists(userId);
    console.log("Sender Exists? ",userExists);
    if(userExists){ return res.json({status: 400, desc: 'user exists', userId: userId}) }

    if(!userExists){       
      await lib.createNewUser(userId, userMSISDN);     
      console.log('Created user with userID: ', userId); 
      res.json({status: 201, userId: userId});
    }
  }catch(e){ res.json({ "status": 400, "desc": `Invalid PhoneNumber Supplied` }) }
});



module.exports = functions.https.onRequest(api_v2);
