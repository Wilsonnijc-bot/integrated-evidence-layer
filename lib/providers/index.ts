import { goplusAdapter } from "./goplus";
import { honeypotAdapter } from "./honeypot";
import {
  tokensnifferStub,
  cyberscopeStub,
  defiStub,
  solidityscanStub,
  dexanalyzerStub,
  quillcheckStub,
  aegisStub,
  blocksafuStub,
  contractwolfStub,
  staysafuStub,
} from "./stubs";
import type { ProviderAdapter } from "../types";

// MVP: Only 2 active providers
export const activeProviders: ProviderAdapter[] = [
  goplusAdapter,
  honeypotAdapter,
];

// Stub providers (disabled in MVP, can be enabled later with API keys)
export const stubProviders: ProviderAdapter[] = [
  tokensnifferStub,
  cyberscopeStub,
  defiStub,
  solidityscanStub,
  dexanalyzerStub,
  quillcheckStub,
  aegisStub,
  blocksafuStub,
  contractwolfStub,
  staysafuStub,
];

// All providers (for future use)
export const allProviders: ProviderAdapter[] = [
  ...activeProviders,
  ...stubProviders,
];
