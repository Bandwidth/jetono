"use strict";
let helper = require("./helper");

describe("models", function(){
  let server;
  before(function*(){
    server = yield helper.startServer({
      minPasswordLength: 4
    });
  });

  after(function*(){
    yield server.stop();
  });

  it("should add models user and accessToken", function*(){
    let models = yield server.methods.models.get();
    models.user.should.be.ok;
    models.accessToken.should.be.ok;
  });

  it("should add ability to extend models user and accessToken", function*(){
    let models = yield server.methods.models.get();
    let user = new models.user({userName: "user1"});
    user.name.should.equal("user1");
    let accessToken = new models.accessToken({token: "token1", user: user});
    accessToken.accessToken.should.equal("token1");
  });

  describe("user", function(){
    let User;
    before(function*(){
      User = yield server.methods.models.get("user");
    });
    describe("#setPassword", function(){
      it("should set encoded password", function*(){
        let user = new User({userName: "test"});
        (!!user.encryptedPassword).should.be.false;
        yield user.setPassword("1234567890");
        (!!user.encryptedPassword).should.be.true;
        user.encryptedPassword.should.not.equal("123456789");
      });
      it("should check password length", function*(){
        let user = new User({userName: "test"});
        yield user.setPassword("1234567890");
        try{
          yield user.setPassword("123"); //short password
          throw new Error("should fail")
        }
        catch(err){
          err.message.should.not.equal("should fail");
        }
      });
      it("should reset password with null", function*(){
        let user = new User({userName: "test"});
        (!!user.encryptedPassword).should.be.false;
        yield user.setPassword("1234567890");
        (!!user.encryptedPassword).should.be.true;
        yield user.setPassword(null);
        (!!user.encryptedPassword).should.be.false;
      });
    });
    describe("#comparePassword", function(){
      it("should check encoded password", function*(){
        let user = new User({userName: "test"});
        yield user.setPassword("1234567890");
        (yield user.comparePassword("1234567890")).should.be.true;
        (yield user.comparePassword("123")).should.be.false;
      });
    });
  });

  describe("accessToken", function(){
    let User, AccessToken, user;
    before(function*(){
      let models = yield server.methods.models.get();
      User = models.user;
      AccessToken = models.accessToken;
      user = new User({userName: "test"});
      yield user.setPassword("111111");
      yield user.saveQ();
    });
    after(function*(){
      yield user.removeQ();
    });
    describe("pre save", function(){
      it("should generate new token it token is missing", function*(){
        let accessToken = yield new AccessToken({user: user.id}).saveQ();
        accessToken.token.should.be.a.String;
      });
      it("should not change existing token", function*(){
        let accessToken = yield new AccessToken({user: user.id}).saveQ();
        let token = accessToken.token;
        accessToken.user = accessToken.id;
        accessToken.user = user.id;
        yield accessToken.saveQ();
        accessToken = yield AccessToken.findById(accessToken.id).execQ();
        accessToken.token.should.equal(token);
      });
    });
  });
});



