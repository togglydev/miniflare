/// <reference types="node" />
import { KVStorage } from "./storage";
export interface DurableObjectListOptions {
    start?: string;
    end?: string;
    reverse?: boolean;
    limit?: number;
    prefix?: string;
}
export interface DurableObjectOperator {
    get<Value = unknown>(key: string): Promise<Value | undefined>;
    get<Value = unknown>(keys: string[]): Promise<Map<string, Value>>;
    put<Value = unknown>(key: string, value: Value): Promise<void>;
    put<Value = unknown>(entries: Record<string, Value>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    deleteAll(): Promise<void>;
    list<Value = unknown>(options?: DurableObjectListOptions): Promise<Map<string, Value>>;
}
declare const internalsSymbol: unique symbol;
declare class DurableObjectTransactionInternals {
    startTxnCount: number;
    readonly readSet: Set<string>;
    readonly copies: Map<string, Buffer | undefined>;
    rolledback: boolean;
    constructor(startTxnCount: number);
    get writeSet(): Set<string>;
}
export declare class DurableObjectTransaction implements DurableObjectOperator {
    #private;
    readonly [internalsSymbol]: DurableObjectTransactionInternals;
    constructor(storage: KVStorage, startTxnCount: number);
    get<Value = unknown>(key: string): Promise<Value | undefined>;
    get<Value = unknown>(keys: string[]): Promise<Map<string, Value>>;
    put<Value = unknown>(key: string, value: Value): Promise<void>;
    put<Value = unknown>(entries: Record<string, Value>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    deleteAll(): Promise<void>;
    list<Value = unknown>(options?: DurableObjectListOptions): Promise<Map<string, Value>>;
    rollback(): void;
}
export declare const transactionReadSymbol: unique symbol;
export declare const transactionValidateWriteSymbol: unique symbol;
export declare const abortAllSymbol: unique symbol;
export declare class DurableObjectStorage implements DurableObjectOperator {
    #private;
    constructor(storage: KVStorage);
    [transactionReadSymbol]<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<{
        txn: DurableObjectTransaction;
        result: T;
    }>;
    [transactionValidateWriteSymbol](txn: DurableObjectTransaction): Promise<boolean>;
    [abortAllSymbol](): void;
    transaction<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T>;
    get<Value = unknown>(key: string): Promise<Value | undefined>;
    get<Value = unknown>(keys: string[]): Promise<Map<string, Value>>;
    put<Value = unknown>(key: string, value: Value): Promise<void>;
    put<Value = unknown>(entries: Record<string, Value>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    deleteAll(): Promise<void>;
    list<Value = unknown>(options?: DurableObjectListOptions): Promise<Map<string, Value>>;
}
export {};
