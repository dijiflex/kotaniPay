### Get Access Token:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/api/login:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/api/login'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber": {{phoneNumber}},
    "countryCode": {{countryCode}},
    "password" : {{password}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { status: 201, accessToken: `${accessToken}` } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, desc: `cannot find user` }
  { status: 400, desc: `not allowed` }
  { status: 500 }
```
---
### Create a new user account:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/kyc/user/create:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/kyc/user/create'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber": {{phoneNumber}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { status: 201, userId: {{userID}} } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, desc: "user exists", userId: {{userID}} }
  { status: 400, desc: "invalid phoneNumber" }
```
---

### Set new user KYC details:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/programs/kyc/updateUser:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/kyc/user/setDetails'
--header 'Authorization: Bearer {{accessToken}}' 
--header 'Content-Type: application/json' 
--data-raw '{
    phoneNumber: {{phoneNumber}},
    documentType: {{documentType}}, // ID or AlienId or Passport
    documentNumber: {{documentNumber}},
    fullname: {{firstname lastname}},
    dateofbirth: {{dateofbirth}}, // YYYY-MM-DD
    programName: {{programName}}, // CANNOT BE EMPTY
    email: {{email}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { status: 201, desc: `KYC completed successfully` } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, desc: `invalid information provided` }
```
---


### Get User Blockchain Address:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/user/account/details:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/user/account/details' 
--header 'Authorization: Bearer {{accessToken}}' 
--header 'Content-Type: application/json' 
--data-raw '{
    "phoneNumber" : {{phoneNumber}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   {status: 201, address : `${publicAddress}`} 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 401, desc: `user does not exist` }
  { status: 400, desc: `invalid request` }
  { status: 400, phoneNumber: `${userMSISDN}`, desc: `invalid ${targetCountry} phoneNumber` }
```
---


### Get User Account Balance:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/user/account/getBalance:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/user/account/getBalance'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
	"phoneNumber": {{phoneNumber}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { 
      status: 201,     
      address: `${publicAddress}`, 
      balance: {
        currency: `${localCurrency}`, 
        amount: `${amountInLocalCurrency}`,
      }   
    } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, user: `${name}`, phoneNumber: `${userMSISDN}`, desc: `The number provided is not a valid phoneNumber` }
  { status: 400, desc: `invalid request` }  
```
---


### User funds-deposit:
```
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/deposit/momo:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/deposit/momo'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber": {{phoneNumber}},
    "amount": {{amount}},
    "currency": {{currencySymbol}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { status: 201, phoneNumber: `${phoneNumber}`,  deposited: { currency: `${localCurrency}`, amount: `${localCurrencyAmount}`}, txnHash: `${transactionHash}`, depositReference: `momoRefId` } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, phoneNumber: `${withdrawMSISDN}`, desc: `invalid phoneNumber`}
  { status: 400, desc: "user account does not exist" }
  { status: 400, desc: "user account is not verified" } 
```
---
```
---


### User funds-withdraw:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/withdraw/momo:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/withdraw/momo'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber" : {{phoneNumber}},
    "amount" : {{localCurrencyAmount}},
    "fiatTxnReferenceId" : {{fiatTxnReferenceId}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { status: 201, phoneNumber: `${phoneNumber}`,  amountWithdrawn: { currency: `${localCurrency}`, amount: `${localCurrencyAmount}`}, txnHash: `${transactionHash}`, depositReference: `fiatTxnReferenceId` } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, phoneNumber: `${withdrawMSISDN}`, desc: `invalid phoneNumber`}
  { status: 400, desc: "user account does not exist" }
  { status: 400, desc: "user account is not verified" } 
```
---

```
