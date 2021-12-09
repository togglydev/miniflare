import { Event, EventTarget } from "event-target-shim";
import StandardWebSocket from "ws";
import { Context, Module } from "./module";
export declare class MessageEvent extends Event<"message"> {
    readonly data: string;
    constructor(data: string);
}
export declare class CloseEvent extends Event<"close"> {
    readonly code?: number | undefined;
    readonly reason?: string | undefined;
    constructor(code?: number | undefined, reason?: string | undefined);
}
export declare class ErrorEvent extends Event<"error"> {
    readonly error?: Error | undefined;
    constructor(error?: Error | undefined);
}
declare const pairSymbol: unique symbol;
declare type EventMap = {
    message: MessageEvent;
    close: CloseEvent;
    error: ErrorEvent;
};
export declare class WebSocket extends EventTarget<EventMap> {
    #private;
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
    [pairSymbol]?: WebSocket;
    get readyState(): number;
    accept(): void;
    send(message: string): void;
    close(code?: number, reason?: string): void;
}
export declare class WebSocketPair {
    [key: string]: WebSocket;
    0: WebSocket;
    1: WebSocket;
    constructor();
}
export declare function terminateWebSocket(ws: StandardWebSocket, pair: WebSocket): Promise<void>;
export declare class WebSocketsModule extends Module {
    buildSandbox(): Context;
}
export {};
