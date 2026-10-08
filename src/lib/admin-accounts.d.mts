import type {ManagedAccount} from './server/auth-core.mjs';
export type AccountFilters={query?:string;term?:'all'|number;access?:'all'|'active'|'pending'|'removed'};
export function filterAccounts(accounts:ManagedAccount[],filters?:AccountFilters):ManagedAccount[];
export function accountTermOptions(accounts:ManagedAccount[]):number[];
export function accountSummary(accounts:ManagedAccount[]):{total:number;active:number;pending:number;removed:number};
