import { URL, URLSearchParams } from "url";
import { TextDecoder, TextEncoder } from "util";
import { FetchError, Headers, Response as RawResponse, Request, RequestInfo, RequestInit } from "@mrbbot/node-fetch";
import { Crypto, CryptoKey } from "@peculiar/webcrypto";
import FormData from "formdata-node";
import { ByteLengthQueuingStrategy, CountQueuingStrategy, ReadableByteStreamController, ReadableStream, ReadableStreamBYOBReader, ReadableStreamBYOBRequest, ReadableStreamDefaultController, ReadableStreamDefaultReader, TransformStream, TransformStreamDefaultController, WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter } from "web-streams-polyfill/ponyfill/es6";
import { Log } from "../log";
import { Context, Module } from "./module";
import { WebSocket } from "./ws";
export declare type Response = RawResponse<WebSocket>;
export declare const Response: typeof RawResponse;
export { URL, URLSearchParams, TextDecoder, TextEncoder, FetchError, Headers, FormData, Request, ByteLengthQueuingStrategy, CountQueuingStrategy, ReadableByteStreamController, ReadableStream, ReadableStreamBYOBReader, ReadableStreamBYOBRequest, ReadableStreamDefaultController, ReadableStreamDefaultReader, TransformStream, TransformStreamDefaultController, WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter, CryptoKey, };
export declare function atob(s: string): string;
export declare function btoa(s: string): string;
export declare const crypto: Crypto;
export declare class StandardsModule extends Module {
    private webSockets;
    private readonly sandbox;
    constructor(log: Log);
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
    resetWebSockets(): void;
    buildSandbox(): Context;
}
