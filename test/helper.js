"use strict";
let Hapi = require("co-hapi");
module.exports = {
  startServer: function*(options, port){
    let server = new Hapi.Server("localhost", port || 3001);
    options = options || {};
    options.extendUserModel = function(schema){
      schema.virtual("name").get(function () {
        return this.userName;
      });
    };
    options.extendAccessTokenModel = function(schema){
      schema.virtual("accessToken").get(function () {
        return this.token;
      });
    };
    yield server.pack.register([
      require("co-hapi-models"),
      {plugin: require("co-hapi-mongoose"), options: {connectionString: "mongodb://localhost/test"}},
      {plugin: require(".."), options: options || {}}
    ]);
    yield server.start();
    return server;
  }
};
