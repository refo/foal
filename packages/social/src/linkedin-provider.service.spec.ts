// std
import { deepStrictEqual, strictEqual } from 'assert';

// 3p
import { Context, createApp, createService, Get, HttpResponseBadRequest, HttpResponseOK } from '@foal/core';
import { SocialTokens } from './abstract-provider.service';
import { LinkedInProvider } from './linkedin-provider.service';
import { UserInfoError } from './user-info.error';

describe('LinkedInProvider', () => {

  describe('has a "getUserInfoFromTokens" that', () => {

    class LinkedInProvider2 extends LinkedInProvider {
      userInfoEndpoint = 'http://localhost:3000/users/me';
    }

    let server;
    let provider: LinkedInProvider;

    beforeEach(() => {
      provider = createService(LinkedInProvider2);
    });

    afterEach(() => {
      if (server) {
        server.close();
      }
    });

    it('should send a request with the access token and return the response body.', async () => {
      const userInfo = { email: 'john@foalts.org' };

      class AppController {
        @Get('/users/me')
        token(ctx: Context) {
          const { authorization } = ctx.request.headers;
          strictEqual(authorization, 'Bearer an_access_token');
          return new HttpResponseOK(userInfo);
        }
      }

      server = createApp(AppController).listen(3000);

      const tokens: SocialTokens = {
        access_token: 'an_access_token',
        token_type: 'token_type'
      };

      const actual = await provider.getUserInfoFromTokens(tokens);
      deepStrictEqual(actual, userInfo);
    });

    it('should accept a "projection" to use in the request.', async () => {
      class AppController {
        @Get('/users/me')
        token(ctx: Context) {
          const { projection } = ctx.request.query;
          strictEqual(projection, '(geoLocation(geo~,autoGenerated))');
          return new HttpResponseOK({});
        }
      }

      server = createApp(AppController).listen(3000);

      const tokens: SocialTokens = {
        access_token: 'an_access_token',
        token_type: 'token_type'
      };

      await provider.getUserInfoFromTokens(tokens, {
        projection: '(geoLocation(geo~,autoGenerated))'
      });
    });

    it('should throw a UserInfoError if the user info endpoint returns an error.', async () => {
      class AppController {
        @Get('/users/me')
        token() {
          return new HttpResponseBadRequest({
            error: 'bad request'
          });
        }
      }

      server = createApp(AppController).listen(3000);

      const tokens: SocialTokens = {
        access_token: 'an_access_token',
        token_type: 'token_type'
      };

      try {
        await provider.getUserInfoFromTokens(tokens);
        throw new Error('getUserInfoFromTokens should have thrown a TokenError.');
      } catch (error) {
        if (!(error instanceof UserInfoError)) {
          throw error;
        }
        deepStrictEqual(error.error, {
          error: 'bad request'
        });
      }
    });

  });

});
