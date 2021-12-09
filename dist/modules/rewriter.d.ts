import { Comment, ContentTypeOptions, Doctype, DocumentEnd, DocumentHandlers, Element, ElementHandlers, TextChunk } from "html-rewriter-wasm";
import { Context, Module } from "./module";
import { Response } from "./standards";
export declare function transformToArray(chunk: any): Uint8Array;
export declare class HTMLRewriter {
    #private;
    on(selector: string, handlers: ElementHandlers): this;
    onDocument(handlers: DocumentHandlers): this;
    transform(response: Response): Response;
}
export declare class HTMLRewriterModule extends Module {
    buildSandbox(): Context;
}
export { Element, Comment, TextChunk, Doctype, DocumentEnd, ContentTypeOptions, };
