export const PDF_CACHE:string;
export type PdfCacheResult={response:Response;fromCache:boolean;cached:boolean;url:string};
export function createPdfCache(env?:{fetch?:typeof fetch;caches?:CacheStorage;origin?:string;crypto?:Crypto;maxBytes?:number;maxFiles?:number}):{load:(input:string)=>Promise<PdfCacheResult>};
export function loadCachedPdf(input:string):Promise<PdfCacheResult>;
export function pdfRangeResponse(response:Response,range?:string|null,ifRange?:string|null):Promise<Response>;
