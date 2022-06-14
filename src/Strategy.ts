import {
  Strategy as OAuth2Strategy,
  type VerifyFunction,
  type VerifyFunctionWithRequest,
} from 'passport-oauth2';
import axios from 'axios';
import { type Request } from 'express';
import type {
  StrategyOptions,
  StrategyOptionsWithRequest,
} from './Strategy.types';

const AUTHORIZATION_URL = 'https://developers.shoplineapp.com/oauth/authorize';
const TOKEN_URL = 'https://developers.shoplineapp.com/oauth/token';
const STAFF_URL = 'https://open.shoplineapp.com/v1/staffs/:staffId';

export const defaultOptions = {
  authorizationURL: AUTHORIZATION_URL,
  tokenURL: TOKEN_URL,
  staffURL: STAFF_URL,
};

export default class ShoplineStrategy extends OAuth2Strategy {
  public name = 'shopline';
  private _tokenInfoURL: string;
  private _staffURL: string;

  constructor(options: StrategyOptions, verify: VerifyFunction);
  constructor(
    options: StrategyOptionsWithRequest,
    verify: VerifyFunctionWithRequest,
  );
  constructor(
    { authorizationURL, tokenURL, scopeSeparator, ...options }: any,
    _verify: any,
  ) {
    super(
      {
        authorizationURL: authorizationURL ?? defaultOptions.authorizationURL,
        tokenURL: tokenURL ?? defaultOptions.tokenURL,
        scopeSeparator: scopeSeparator ?? ' ',
        ...options,
      },
      _verify,
    );
    this._tokenInfoURL = `${tokenURL ?? defaultOptions.tokenURL}/info`;
    this._staffURL = options.staffURL ?? defaultOptions.staffURL;
  }

  get tokenInfoURL() {
    return this._tokenInfoURL;
  }

  get staffURL() {
    return this._staffURL;
  }

  authenticate(req: Request, _options?: any): void {
    const options = { ..._options, reqQuery: req.query };
    super.authenticate(req, options);
  }

  authorizationParams(options: any): object {
    const params = super.authorizationParams(options);
    return {
      ...params,
      merchant_id: options.reqQuery?.merchant_id,
    };
  }

  async userProfile(
    accessToken: string,
    done: (err?: Error | null, profile?: any) => void,
  ): Promise<void> {
    try {
      const { data: tokenInfo } = await axios({
        method: 'get',
        url: this._tokenInfoURL,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const staffURL = this._staffURL.replace(':staffId', tokenInfo.staff._id);
      const { data: staff } = await axios({
        method: 'get',
        url: staffURL,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      done(null, { ...tokenInfo, staff });
    } catch (error) {
      done(error);
    }
  }
}
