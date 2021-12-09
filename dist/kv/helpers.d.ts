import Redis from "ioredis";
import { KVStorage, MemoryKVStorage } from "./storage";
export declare function sanitise(fileName: string): string;
export declare function intersects<T>(a: Set<T>, b: Set<T>): boolean;
export declare type KVClock = () => number;
export declare const defaultClock: KVClock;
export declare function millisToSeconds(millis: number): number;
export declare class KVStorageFactory {
    private defaultPersistRoot;
    private memoryStorages;
    private redisConnections;
    constructor(defaultPersistRoot: string, memoryStorages?: Map<string, MemoryKVStorage>, redisConnections?: Map<string, Redis.Redis>);
    getStorage(namespace: string, persist?: boolean | string): KVStorage;
    dispose(): void;
}
export declare class Mutex {
    private locked;
    private resolveQueue;
    private lock;
    private unlock;
    run<T>(closure: () => Promise<T>): Promise<T>;
}
