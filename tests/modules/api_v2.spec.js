let assert = require('chai').assert;
let chai = require('chai');
let chaiHttp = require('chai-http');
let baseUrl = 'https://europe-west3-kotani-api-v2.cloudfunctions.net/api_v2';
let expect = require('chai').expect;
let should = require('chai').should();
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();
chai.use(chaiHttp);
let agent = chai.request.agent(baseUrl);


describe('API_V2', () => {
  describe("POST /auth/signup", () => {
    it("It should return an ok if signup is successful", (done) => {
        const credentials = {
            "firstname": "John",
            "lastname": "Smith",
            "organization": "Kotani Pay",
            "emailAddress": "test@kotanipay.com",
            "password" : "some_very_strong_password",
            "permissionLevel": "admin",
            "countryCode": "KE",
            "targetCountry" : "KE",
            "phoneNumber": "+254721234567",
            "localCurrency": "kes"
        }
        chai.request(baseUrl)                
            .post("/auth/signup")
            .send(credentials)
            .end((err, res) => {
                res.should.have.status(201);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eq('OK');
            done();
        });
    });
  });

  describe("POST /api/login", () => {
    it("It should return an accessToken", (done) => {
        const adminCredentials = {
            phoneNumber: {{phoneNumber}},
            countryCode: {{countryCode}},
            password: {{password}}
        };
        chai.request(baseUrl)                
            .post("/api/login")
            .send(adminCredentials)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('accessToken');
            done();
        });
    });
  });

  describe("POST /kyc/user/create", () => {
    it("It should return an ok if create user is successful", (done) => {
        const userDetails = { phoneNumber: "+254722123456" };
        const adminCredentials = {
            phoneNumber: {{phoneNumber}},
            countryCode: {{countryCode}},
            password: {{password}}
        };
        chai.request(baseUrl).post('/api/login').send(adminCredentials)
        .then(res => {
                chai.request(baseUrl)                
                .post("/kyc/user/create")
                .set('Authorization', `Bearer ${res.body.accessToken}`)
                .send(userDetails)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('userId').eq('938c89b541ff60171641f0a88c45c441553df5cb');
                done();
            });
        });        
    });
  });

  describe("POST /kyc/user/isverifiedcheck", () => {
    it("It should return false if the user is not verified", (done) => {
        const userDetails = { phoneNumber: "+254720123456" };
        const adminCredentials = {
            phoneNumber: {{phoneNumber}},
            countryCode: {{countryCode}},
            password: {{password}}
        };
        chai.request(baseUrl).post('/api/login').send(adminCredentials)
        .then(res => {
                chai.request(baseUrl)                
                .post("/kyc/user/isverifiedcheck")
                .set('Authorization', `Bearer ${res.body.accessToken}`)
                .send(userDetails)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eq(false);
                done();
            });
        });        
    });
  });

  describe("POST /user/account/generateAddress", () => {
    it("It should return false if the user is not verified", (done) => {
        const userDetails = { phoneNumber: "+254720123456" };
        const adminCredentials = {
            phoneNumber: {{phoneNumber}},
            countryCode: {{countryCode}},
            password: {{password}}
        };
        chai.request(baseUrl).post('/api/login').send(adminCredentials)
        .then(res => {
                chai.request(baseUrl)                
                .post("/user/account/generateAddress")
                .set('Authorization', `Bearer ${res.body.accessToken}`)
                .send(userDetails)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status'); // .eq(true)
                done();
            });
        });        
    });
  });

  describe("POST /user/account/getBalance", () => {

    it("It should return the user balance in local currency", (done) => {
        const userDetails = { phoneNumber: "+254720123456" };
        
        chai.request(baseUrl).post('/api/login').send(adminCredentials)
        .then(res => {
                chai.request(baseUrl)                
                .post("/user/account/getBalance")
                .set('Authorization', `Bearer ${res.body.accessToken}`)
                .send(userDetails)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eq(201);
                    res.body.should.have.property('address');
                    res.body.should.have.property('balance');
                    assert.equal(res.status, 200, 'the response code is not 200');
                done();
            });
        });        
    });
  });


});
