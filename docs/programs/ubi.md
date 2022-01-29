### RIO-UBI isBeneficiary:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/ubi/checkIfBeneficiary:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/ubi/checkIfBeneficiary'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber" : {{phoneNumber}},
    "programId" : {{programId}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   {status: 201, desc: `User is a beneficiary`} 
```

<dl><dt>fail</dt></dl>

```json5 
  {status: 400, desc: `Not a beneficiary`}
  {status: 400, desc: `Invalid request` }
```
---

### UBI addBeneficiary:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/ubi/setBeneficiary:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/ubi/setBeneficiary'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber" : {{phoneNumber}},
    "programId" : {{programId}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   {status: 201, desc: `User added as a beneficiary`, address: _beneficiaryAddress, txhash: transactionHash} 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, "desc" : `${senderMSISDN} is not a valid phoneNumber`}
  {status: 400,  "desc": "user account is not verified" }  
  {status: 400, "desc": `User is already a beneficiary`}
  {status: 400, desc: `Invalid request` }
```
---


### RIO-UBI Claim:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/ubi/claimfunds:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/transactions/ubi/claimfunds'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber" : {{phoneNumber}},
    "programId" : {{programId}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { status: 201, desc: `Your UBI Claim Request was successful. \nTransaction Details: ${url}` } 
```

<dl><dt>fail</dt></dl>

```json5 
  { status: 400, desc: `Unable to process your UBI claim, Its not yet time, Retry claim after: ${claimTime}` }
  { status: 400, desc: `Insufficient funds in the UBI account. \nPlease try again later` }
  { status: 400, desc: `You\'re not approved to access this service` }
  { status: 400, desc: "user account is not verified" }
  { status: 400, desc: `${userMSISDN} is not a valid phoneNumber` } 
```
---
