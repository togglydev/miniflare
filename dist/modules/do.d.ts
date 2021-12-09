import { RequestInfo, RequestInit } from "@mrbbot/node-fetch";
import { DurableObjectStorage } from "../kv";
import { KVStorageFactory } from "../kv/helpers";
import { Log } from "../log";
import { ProcessedOptions } from "../options";
import { Context, Module } from "./module";
import { Request, Response } from "./standards";
export declare class DurableObjectState {
    id: DurableObjectId;
    storage: DurableObjectStorage;
    constructor(id: DurableObjectId, storage: DurableObjectStorage);
    waitUntil(_promise: Promise<any>): void;
}
export interface DurableObjectConstructor {
    new (state: DurableObjectState, environment: Context): DurableObject;
}
export interface DurableObject {
    fetch(request: Request): Response | Promise<Response>;
}
export declare type DurableObjectFactory = (id: DurableObjectId) => Promise<DurableObject>;
export declare class DurableObjectId {
    #private;
    name?: string | undefined;
    constructor(hexId: string, name?: string | undefined);
    toString(): string;
}
export declare class DurableObjectStub {
    #private;
    id: DurableObjectId;
    constructor(factory: DurableObjectFactory, id: DurableObjectId);
    get name(): string | undefined;
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
    storage(): Promise<DurableObjectStorage>;
}
export declare class DurableObjectNamespace {
    #private;
    constructor(objectName: string, factory: DurableObjectFactory);
    newUniqueId(): DurableObjectId;
    idFromName(name: string): DurableObjectId;
    idFromString(hexId: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}
export declare class DurableObjectsModule extends Module {
    private storageFactory;
    readonly _instances: Map<string, DurableObject>;
    private _contextPromise;
    private _contextResolve?;
    private _constructors;
    private _environment;
    constructor(log: Log, storageFactory?: KVStorageFactory);
    resetInstances(): void;
    setContext(constructors: Record<string, DurableObjectConstructor>, environment: Context): void;
    getNamespace(objectName: string, persist?: boolean | string): DurableObjectNamespace;
    buildEnvironment(options: ProcessedOptions): Context;
    dispose(): void;
}
