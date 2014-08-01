
"use strict";
let helper = require("./helper");
let supertest = require("co-supertest");
let sinon = require("sinon");
describe("auth", function(){
  let server, token2Settings = {validateToken: function*(){}};
  before(function*(){
    server = yield helper.startServer({});
    server.auth.strategy("token", "jetono-token");
    server.auth.strategy("signin", "jetono-signin");
    server.auth.strategy("signup", "jetono-signup");
    server.auth.strategy("token2", "jetono-token", token2Settings);
    server.route([{
      method: "POST",
      path: "/signup",
      config: {
        auth: {
          strategy: "signup",
          mode: "required",
          payload: true
        }
      },
      handler: function*(request){
        return request.auth;
      }
    },{
      method: "POST",
      path: "/signin",
      config: {
        auth: {
          strategy: "signin",
          mode: "required",
          payload: true
        }
      },
      handler: function*(request){
        return request.auth;
      }
    },{
      config: {auth: "token"},
      handler: function* (request) {
        return request.auth;
      },
      method: "GET",
      path: "/token"
    },{
      config: { auth: "token2" },
      handler: function* (request) {
        return request.auth;
      },
      method: "GET",
      path: "/token2"
    }]);
  });

  after(function*(){
    yield server.stop();
  });

  describe("jetono-signup", function(){
    let models;
    beforeEach(function*(){
      models = yield server.methods.models.get();
      yield models.user.find({userName: "testUser"}).remove().execQ();
    });
    it("should register new user and return access token", function*(){
      let result = yield supertest(server.listener).post("/signup")
        .send({username: "testUser", password: "1234567890",  repeatPassword: "1234567890"}).expect(200).end();
      result.body.artifacts.token.should.be.ok;
      result.body.credentials.username.should.equal("testUser");
      let user = yield models.user.findOne({userName: "testUser"}).execQ();
      (!!user).should.be.true;
      let accessToken = yield models.accessToken.findOne({token: result.body.artifacts.token}).execQ();
      (!!accessToken).should.be.true;
      accessToken.user.toString().should.equal(user.id);
    });

    it("should fail if passwords are mismatched", function*(){
      yield supertest(server.listener).post("/signup")
        .send({username: "testUser", password: "1234567890", repeatPassword: "0234567890"}).expect(401).end();
    });

    it("should fail if required data is missing", function*(){
      yield supertest(server.listener).post("/signup")
        .send({username: "testUser"}).expect(400).end();
    });
  });

  describe("jetono-signin", function(){
    let models;
    beforeEach(function*(){
      models = yield server.methods.models.get();
      yield models.user.find({userName: "testUser"}).remove().execQ();
      yield supertest(server.listener).post("/signup")
        .send({username: "testUser", password: "1234567890",  repeatPassword: "1234567890"}).expect(200).end();
    });
    it("should return access token", function*(){
      let result = yield supertest(server.listener).post("/signin")
        .send({username: "testUser", password: "1234567890"}).expect(200).end();
      result.body.artifacts.token.should.be.ok;
      result.body.credentials.username.should.equal("testUser");
      let user = yield models.user.findOne({userName: "testUser"}).execQ();
      (!!user).should.be.true;
      let accessToken = yield models.accessToken.findOne({token: result.body.artifacts.token}).execQ();
      (!!accessToken).should.be.true;
      accessToken.user.toString().should.equal(user.id);
    });
    it("should fail if password is invalid", function*(){
      yield supertest(server.listener).post("/signin")
        .send({username: "testUser", password: "000"}).expect(401).end();
    });
    it("should fail if user is not exists", function*(){
      yield supertest(server.listener).post("/signin")
        .send({username: "testUser1", password: "1234567890"}).expect(401).end();
    });
  });

  describe("jetono-token", function(){
    let models, token;
    beforeEach(function*(){
      models = yield server.methods.models.get();
      yield models.user.find({userName: "testUser"}).remove().execQ();
      let result = yield supertest(server.listener).post("/signup")
        .send({username: "testUser", password: "1234567890",  repeatPassword: "1234567890"}).expect(200).end();
      token = result.body.artifacts.token;
    });
    it("should return credentials for valid token (via header)", function*(){
      let result = yield supertest(server.listener).get("/token")
        .set("Authorization", "Bearer " + token).expect(200).end();
      result.body.credentials.username.should.equal("testUser");
    });
    it("should return credentials for valid token (via query)", function*(){
      let result = yield supertest(server.listener).get("/token?token=" + token).expect(200).end();
      result.body.credentials.username.should.equal("testUser");
    });
    it("should fail for invalid token", function*(){
      let result = yield supertest(server.listener).get("/token")
        .set("Authorization", "Bearer 123").expect(401).end();
    });

    it("should support custom token validator", function*(){
      let spy = sinon.spy(token2Settings, "validateToken");
      try{
        let result = yield supertest(server.listener).get("/token2")
          .set("Authorization", "Bearer " + token).expect(200).end();
        result.body.credentials.username.should.equal("testUser");
        spy.called.should.be.true;
        spy.args[0][0].token.should.equal(token);
      }
      finally{
        spy.restore();
      }
    });

  });
});
