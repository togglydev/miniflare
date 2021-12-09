export interface Log {
    log(data: string): void;
    debug(data: string): void;
    info(data: string): void;
    warn(data: string): void;
    error(data: string): void;
}
export declare class NoOpLog implements Log {
    log(): void;
    debug(): void;
    info(): void;
    warn(): void;
    error(data: string): void;
}
export declare class ConsoleLog implements Log {
    private logDebug;
    constructor(logDebug?: boolean);
    log(data: string): void;
    debug(data: string): void;
    info(data: string): void;
    warn(data: string): void;
    error(data: string): void;
}
export declare type HRTime = [seconds: number, nanoseconds: number];
export declare function logResponse(log: Log, { start, method, url, status, waitUntil, }: {
    start: HRTime;
    method: string;
    url: string;
    status?: number;
    waitUntil?: Promise<any[]>;
}): Promise<void>;
