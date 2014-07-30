"use strict";
let Hapi = require("co-hapi");
module.exports = {
  startServer: function*(options, port){
    let server = new Hapi.Server("localhost", port || 3001);
    yield server.pack.register([
      require("co-hapi-models"),
      {plugin: require("co-hapi-mongoose"), options: {connectionString: "mongodb://localhost/testdb"}},
      {plugin: require(".."), options: options || {}}
    ]);
    yield server.start();
    return server;
  }
};
