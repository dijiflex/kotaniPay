### Get Access Token:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/api/login:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v1/api/login'
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
   { accessToken: `${accessToken}` } 
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
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v1/kyc/user/create'
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
   { "status": 201, "userId": {{userID}} } 
```

<dl><dt>fail</dt></dl>

```json5 
  { "status": 400, "desc": "user exists", "userId": {{userID}} }
  { "status": 400, "desc": "invalid phoneNumber" }
```
---

### Reset User Access PIN:
https://europe-west3-kotanimac.cloudfunctions.net/api_v2/user/resetPin:
```javascript
curl --location --request POST 'https://europe-west3-kotanimac.cloudfunctions.net/api_v2/user/resetPin'
--header 'Authorization: Bearer {{accessToken}}'
--header 'Content-Type: application/json'
--data-raw '{
    "phoneNumber": {{phoneNumber}},
    "newUserPin": {{newUserPin}}
}'
```
#### RESPONSE
---
<dl><dt>success</dt></dl>

```json5  
   { "status": 201, "desc": {{userMSISDN}} "Kotani Pay PIN updated successfully" } 
```

<dl><dt>fail</dt></dl>

```json5 
  { "status": 400, "desc": "user exists", "userId": {{userID}} }
  { "status": 400, "desc": "invalid phoneNumber" }
  { "status": 400, "desc": "User does not exist" }
  { "status": 400, "desc": "PIN must be atleast 4 characters"}
  { "status": 400, "desc": "invalid information provided" }
```
---
