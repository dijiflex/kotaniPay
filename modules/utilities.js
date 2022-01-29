var tinyURL = require('tinyurl');
const functions = require('firebase-functions');
const moment = require('moment');

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const randomstring = require('randomstring')
const request = require('request');

//SEND GET shortURL
exports.getTxidUrl = async(txid) => {
  return await getSentTxidUrl(txid);
}

function getSentTxidUrl(txid){      
  return new Promise(resolve => {    
      const sourceURL = `https://explorer.celo.org/tx/${txid}/token-transfers`;
      resolve (tinyURL.shorten(sourceURL))        
  });
}

exports.getDeepLinkUrl = (deeplink) => {      
  return new Promise(resolve => {    
    const sourceURL = deeplink;
    resolve (tinyURL.shorten(sourceURL))        
  });
}
 
 //GET ACCOUNT ADDRESS shortURL
 exports.getAddressUrl = async (userAddress) => {
    return await getUserAddressUrl(userAddress);
 }
 
function getUserAddressUrl(userAddress){
  return new Promise(resolve => {    
    const sourceURL = `https://explorer.celo.org/address/${userAddress}/tokens`;
    resolve (tinyURL.shorten(sourceURL));
  });   
}

exports.getPinFromUser = () => {
  return new Promise(resolve => {    
    let loginpin = randomstring.generate({ length: 4, charset: 'numeric' });
    resolve (loginpin);
  });
}

const getEncryptKey = (userMSISDN) => {    
  const crypto = require('crypto');
  const hash_fn = functions.config().env.algo.key_hash;
  let key = crypto.createHash(hash_fn).update(userMSISDN).digest('hex');
  return key;
}
exports.getEncryptKey = getEncryptKey;

exports.createcypher = async (text, userMSISDN, iv) => {
  const crypto = require('crypto');
  let key = await getEncryptKey(userMSISDN);
  const cipher = crypto.createCipher('aes192',  key, iv);  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted; 
}
  
exports.decryptcypher = async (encrypted, userMSISDN, iv) => {    
  const crypto = require('crypto');
  let key = await getEncryptKey(userMSISDN);
  const decipher = crypto.createDecipher('aes192', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

exports.sendMessage = async (recipients, message) => {
  try {
    console.log('...start of SMS log...')
     
    var options = {
      'method': 'POST',
      'url': 'https://api.africastalking.com/version1/messaging',
      'headers': {
        'apiKey': AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      form: {
        'username': 'kotani',
        'to': recipients,
        'message': message,
        'from': 'KotaniPay'
      }
    };
    request(options,  (error, response) => {
      if (error) throw new Error(error);
      console.log(response.body);
      return response.body
    });
  } catch (e) {console.log(JSON.stringify(e))}  
};

exports.sendGmail = async(userEmail, message) => {
  const gmailSendOptions = {
    "user": functions.config().env.gmail.user,
    "pass": functions.config().env.gmail.pass,
    "to": userEmail,
    "subject": "KotaniPay PIN"
  }
  //SEND GMAIL
  const send = require('gmail-send')(gmailSendOptions);  
  try {
    const res = await send({text: message});
    console.log('Gmail Sent res.result: ',res.result);
  } catch(e) {console.error('Error:', e)}
};

exports.arraytojson = (item, index, arr) => {
  arr[index] = item.replace(/=/g, '": "')
}

exports.stringToObj = (string) => {
  var obj = {}; 
  var stringArray = string.split('&'); 
  for(var i = 0; i < stringArray.length; i++){ 
    var kvp = stringArray[i].split('=');
    if(kvp[1]){ obj[kvp[0]] = kvp[1] }
  }
  return obj;
}

exports.parseMsisdn = (userMSISDN) => {
  try {
      e64phoneNumber = parsePhoneNumber(`${userMSISDN}`, 'KE')  
      console.log(e64phoneNumber.number)    
  } catch (error) {
      if (error instanceof ParseError) {console.log(error.message)
      } else {
          throw error
      }
  }
  return e64phoneNumber.number;    
}

exports.validateMSISDN = async (phoneNumber, countryISOCode) => {  
  let isValidPhoneNo = phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phoneNumber, countryISOCode));
  if(!isValidPhoneNo){ return 'invalid' }
  let userMSISDN;
  try { userMSISDN = phoneUtil.format(phoneUtil.parseAndKeepRawInput(phoneNumber, countryISOCode), PNF.E164) } catch (e) { console.log(e) }
  return userMSISDN.substring(1);
}

exports.emailIsValid = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

exports.isDobValid = (dateofbirth) => {
  var m = moment(dateofbirth, 'YYYY-MM-DD', true);
  return m.isValid();
}

exports.isValidKePhoneNumber = (phoneNumber) => {
  const _phone = phoneUtil.parseAndKeepRawInput(phoneNumber, 'KE');
  let isValidKe = phoneUtil.isValidNumber(_phone);
  return isValidKe;
}

exports.isValidPhoneNumber = (phoneNumber, countryCode) => {
  const _phone = phoneUtil.parseAndKeepRawInput(phoneNumber, countryCode);
  let isValid = phoneUtil.isValidNumber(_phone);
  return isValid;
}
