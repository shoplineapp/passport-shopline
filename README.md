# Passport-Shopline

[Passport](http://passportjs.org/) strategy for authenticating with [Shopline](https://shopline-developers.readme.io/docs/get-started)
using the OAuth 2.0 API.

This module lets you authenticate using Shopline in your Node.js applications.
By plugging into Passport, Shopline authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install @shopline/passport-shopline

## Usage

#### Configure Strategy

The Shopline authentication strategy authenticates users using a Shopline
account and OAuth 2.0 tokens. The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a app ID, app secret, and callback URL.

    passport.use(new ShoplineStrategy({
        clientID: SHOPLINE_APP_ID,
        clientSecret: SHOPLINE_APP_SECRET,
        callbackURL: 'http://localhost:3000/auth/shopline',
        scope: [
          'merchants',
          'staffs',
          'permissions',
          'settings',
        ],
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ id: profile.staff._id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'shopline'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/shopline', passport.authenticate('shopline'));

## License

[The MIT License](http://opensource.org/licenses/MIT)
