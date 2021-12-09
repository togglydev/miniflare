/// <reference types="node" />
import { URL } from "url";
import { Event, EventTarget } from "event-target-shim";
import { Log } from "../log";
import { Context, Module } from "./module";
import { Request, Response } from "./standards";
export declare const responseSymbol: unique symbol;
export declare const passThroughSymbol: unique symbol;
export declare const waitUntilSymbol: unique symbol;
export declare class FetchEvent extends Event<"fetch"> {
    readonly request: Request;
    [responseSymbol]?: Promise<Response>;
    [passThroughSymbol]: boolean;
    readonly [waitUntilSymbol]: Promise<any>[];
    constructor(request: Request);
    respondWith(response: Response | Promise<Response>): void;
    passThroughOnException(): void;
    waitUntil(promise: Promise<any>): void;
}
export declare class ScheduledEvent extends Event<"scheduled"> {
    readonly scheduledTime: number;
    readonly cron: string;
    readonly [waitUntilSymbol]: Promise<any>[];
    constructor(scheduledTime: number, cron: string);
    waitUntil(promise: Promise<any>): void;
}
export declare type ModuleFetchListener = (request: Request, environment: Context, ctx: {
    passThroughOnException: () => void;
    waitUntil: (promise: Promise<any>) => void;
}) => Response | Promise<Response>;
export declare type ModuleScheduledListener = (controller: {
    scheduledTime: number;
    cron: string;
}, environment: Context, ctx: {
    waitUntil: (promise: Promise<any>) => void;
}) => any;
export declare type ResponseWaitUntil<WaitUntil extends any[] = any[]> = Response & {
    waitUntil: () => Promise<WaitUntil>;
};
export declare const addModuleFetchListenerSymbol: unique symbol;
export declare const addModuleScheduledListenerSymbol: unique symbol;
export declare const dispatchFetchSymbol: unique symbol;
export declare const dispatchScheduledSymbol: unique symbol;
declare type EventMap = {
    fetch: FetchEvent;
    scheduled: ScheduledEvent;
};
export declare class ServiceWorkerGlobalScope extends EventTarget<EventMap> {
    #private;
    global: this;
    globalThis: this;
    self: this;
    constructor(log: Log, sandbox: Context, environment: Context, modules?: boolean);
    addEventListener<T extends keyof EventMap>(type: T, listener?: EventTarget.EventListener<this, EventMap[T]> | null, options?: EventTarget.AddOptions | boolean): void;
    removeEventListener<T extends string & keyof EventMap>(type: T, listener?: EventTarget.EventListener<this, EventMap[T]> | null, options?: EventTarget.Options | boolean): void;
    dispatchEvent(event: Event): boolean;
    [addModuleFetchListenerSymbol](listener: ModuleFetchListener): void;
    [addModuleScheduledListenerSymbol](listener: ModuleScheduledListener): void;
    [dispatchFetchSymbol]<WaitUntil extends any[] = any[]>(request: Request, upstreamUrl?: URL): Promise<ResponseWaitUntil<WaitUntil>>;
    [dispatchScheduledSymbol]<WaitUntil extends any[] = any[]>(scheduledTime?: number, cron?: string): Promise<WaitUntil>;
}
export declare class EventsModule extends Module {
    buildSandbox(): Context;
}
export {};
