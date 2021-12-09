import { Request, RequestInfo, Response } from "@mrbbot/node-fetch";
import { KVClock } from "./helpers";
import { KVStorage } from "./storage";
export interface CacheMatchOptions {
    ignoreMethod?: boolean;
}
export interface CachedResponse {
    status: number;
    headers: Record<string, string[]>;
    body: string;
}
export interface CacheInterface {
    put(req: string | Request, res: Response): Promise<undefined>;
    match(req: string | Request, options?: CacheMatchOptions): Promise<Response | undefined>;
    delete(req: string | Request, options?: CacheMatchOptions): Promise<boolean>;
}
export declare class Cache implements CacheInterface {
    #private;
    constructor(storage: KVStorage, clock?: KVClock);
    put(req: RequestInfo, res: Response): Promise<undefined>;
    match(req: RequestInfo, options?: CacheMatchOptions): Promise<Response | undefined>;
    delete(req: RequestInfo, options?: CacheMatchOptions): Promise<boolean>;
}
export declare class NoOpCache implements CacheInterface {
    put(_req: string | Request, _res: Response): Promise<undefined>;
    match(_req: string | Request, _options?: CacheMatchOptions): Promise<Response | undefined>;
    delete(_req: string | Request, _options?: CacheMatchOptions): Promise<boolean>;
}
