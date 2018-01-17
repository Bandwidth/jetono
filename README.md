# ⚠️ DEPRECATED⚠️ 

## jetono
[![Build](https://travis-ci.org/bandwidthcom/jetono.png)](https://travis-ci.org/bandwidthcom/jetono)
[![Dependencies](https://david-dm.org/bandwidthcom/jetono.png)](https://david-dm.org/bandwidthcom/jetono)

Simple token based auth provider for service_maker. Plugins `co-hapi-mongoose` and `co-hapi-models` are required to use this plugin.

After installing this plugin you can use

- auth scheme `jetono-token` which will validate token from header `Authorization` or query field `token` (you can change query field name if need),
- named route handlers `jetono-signin` and `jetono-signup` to handle user sign in and sign up. In both cases token value will be returned,
- models 'user' and 'accessToken' (you can extend them if need via settings `extendUserModel` and `extendAccessTokenModel`)

Also you can add own validation procedure with setting `validateToken` like
```
server.auth.strategy("token", "jetono-token", {validateToken: function*(accessToken){
  //accessToken.token - token value
  //accessToken.user - user's data
  //throw an exception here to fail validation
}});
```

### Options
`tokenField` is name of query filed with token value (default: token),

`validateToken` is global custom token validator (you can define it per strategy too),

`minPasswordLength` is minimal allowed password length (default: 6),

`pepper` is pepper value to validate password (min 10 symbols),

`extendUserModel` is function to extend user schema (like function(schema){}),

`extendAccessTokenModel`:  is function to extend accessToken schema (like function(schema){}),

`accessTokenCacheExpiresIn`: time (in ms) to live of accessToken items in cache (default: 300000 (5 minutes))


### Example

```
server.route({
  method: "POST",
  path: "/auth/signin",
  handler: {"jetono-signin": {}}
}); //POST /auth/signin with form fields 'username' and  'password' (you can change field names if need)

server.route({
  method: "POST",
  path: "/auth/signup",
  handler: {"jetono-signup": {}}
}); //POST /auth/signin with form fields 'username',  'password' and 'repeatPassword' (you can change field names if need)

server.auth.strategy("token", "jetono-token");

server.route({
  method: "GET",
  path: "/protected/resource",
  config: {
    auth: "route"
  }
});

```

