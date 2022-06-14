import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import axios, { type AxiosResponse } from 'axios';
import type { Request } from 'express';
import type { StrategyOptions } from './Strategy.types';
import ShoplineStrategy, { defaultOptions } from './Strategy';

jest.mock('passport-oauth2');
jest.mock('axios');

const axiosMock = axios as jest.MockedFunction<typeof axios>;

describe('ShoplineStrategy', () => {
  const options = {
    authorizationURL: 'https://developers.shoplineapp.com/oauth/authorize',
    tokenURL: 'https://developers.shoplineapp.com/oauth/token',
    staffURL: 'https://open.shoplineapp.com/v1/staffs/:staffId',
    clientID: process.env.SL_OAUTH_APPLICATION_ID,
    clientSecret: process.env.SL_OAUTH_SECRET,
    callbackURL: `${process.env.DASH_HOST}/auth/shopline`,
    scope: [
      'campaigns',
      'order_campaign_items',
      'merchants',
      'orders',
      'order_items',
    ],
    scopeSeparator: ' ',
  };
  const verify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should call parent constructor', () => {
      const strategy = new ShoplineStrategy(options, verify);

      expect(OAuth2Strategy).toHaveBeenCalledTimes(1);
      expect(OAuth2Strategy).toHaveBeenCalledWith(options, verify);

      expect(strategy.tokenInfoURL).toBe(
        'https://developers.shoplineapp.com/oauth/token/info',
      );
      expect(strategy.staffURL).toBe(
        'https://open.shoplineapp.com/v1/staffs/:staffId',
      );
    });

    test('use defaultOptions', () => {
      const strategy = new ShoplineStrategy({} as StrategyOptions, verify);

      expect(OAuth2Strategy).toHaveBeenCalledTimes(1);
      expect(OAuth2Strategy).toHaveBeenCalledWith(
        {
          authorizationURL: defaultOptions.authorizationURL,
          scopeSeparator: ' ',
          tokenURL: defaultOptions.tokenURL,
        },
        verify,
      );

      expect(strategy.tokenInfoURL).toBe(`${defaultOptions.tokenURL}/info`);
      expect(strategy.staffURL).toBe(defaultOptions.staffURL);
    });
  });

  describe('authenticate', () => {
    it('should pass options to super.authenticate with reqQuery', () => {
      const authenticateSpy = jest.spyOn(
        OAuth2Strategy.prototype,
        'authenticate',
      );
      const req = {
        query: {
          foo: 'bar',
        },
      };
      const overrideOptions = { overrideOption: 'override' };
      const strategy = new ShoplineStrategy(options, verify);

      strategy.authenticate(req as unknown as Request, overrideOptions);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(authenticateSpy).toHaveBeenCalledWith(req, {
        overrideOption: 'override',
        reqQuery: {
          foo: 'bar',
        },
      });

      authenticateSpy.mockRestore();
    });
  });

  describe('authorizationParams', () => {
    it('should return params with merchant_id', () => {
      const authorizationParamsSpy = jest
        .spyOn(OAuth2Strategy.prototype, 'authorizationParams')
        .mockReturnValue({ foo: 'bar' });
      const strategy = new ShoplineStrategy(options, verify);
      const composedOptions = {
        reqQuery: {
          merchant_id: 'merchant-id',
        },
      };

      expect(strategy.authorizationParams(composedOptions)).toEqual({
        foo: 'bar',
        merchant_id: 'merchant-id',
      });
      expect(authorizationParamsSpy).toHaveBeenCalledTimes(1);
      expect(authorizationParamsSpy).toHaveBeenCalledWith(composedOptions);

      authorizationParamsSpy.mockRestore();
    });

    test('without merchant_id', () => {
      const authorizationParamsSpy = jest
        .spyOn(OAuth2Strategy.prototype, 'authorizationParams')
        .mockReturnValue({ foo: 'bar' });
      const strategy = new ShoplineStrategy(options, verify);

      expect(strategy.authorizationParams({})).toEqual({
        foo: 'bar',
      });

      authorizationParamsSpy.mockRestore();
    });
  });

  describe('userProfile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    test('fetch userProfile from /oauth/token/info & /v1/staffs/:staffId', async () => {
      const accessToken = 'fake token';
      const done = jest.fn();
      axiosMock
        .mockResolvedValueOnce({
          data: {
            staff: {
              _id: 'staff-id',
            },
            foo: 'bar',
          },
        } as AxiosResponse)
        .mockResolvedValueOnce({
          data: {
            _id: 'staff-id',
            bar: 'baz',
          },
        } as AxiosResponse);

      const strategy = new ShoplineStrategy(options, verify);
      await strategy.userProfile(accessToken, done);

      expect(axios).toHaveBeenCalledTimes(2);
      expect(axios).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: `${options.tokenURL}/info`,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      expect(axios).toHaveBeenNthCalledWith(2, {
        method: 'get',
        url: options.staffURL.replace(':staffId', 'staff-id'),
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      expect(done).toHaveBeenCalledTimes(1);
      expect(done).toHaveBeenCalledWith(null, {
        foo: 'bar',
        staff: {
          _id: 'staff-id',
          bar: 'baz',
        },
      });
    });
    test('fetch userProfile from /oauth/token/info failed', async () => {
      const accessToken = 'fake token';
      const done = jest.fn();
      axiosMock.mockRejectedValueOnce(new Error('Unknown error'));

      const strategy = new ShoplineStrategy(options, verify);
      await strategy.userProfile(accessToken, done);

      expect(done).toHaveBeenCalledTimes(1);
      expect(done).toHaveBeenCalledWith(new Error('Unknown error'));
    });
  });
});
