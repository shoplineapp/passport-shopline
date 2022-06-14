import {
  type StrategyOptions as OAuth2StrategyOptions,
  type StrategyOptionsWithRequest as OAuth2StrategyOptionsWithRequest,
} from 'passport-oauth2';

export type ShoplineStrategyOptions = {
  staffURL?: string;
};

export type StrategyOptions = OAuth2StrategyOptions & ShoplineStrategyOptions;

export type StrategyOptionsWithRequest = OAuth2StrategyOptionsWithRequest &
  ShoplineStrategyOptions;
