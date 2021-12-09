import { Log, Options } from "./index";
export default function parseArgv(raw: string[]): Options;
export declare function updateCheck({ pkg, cachePath, log, now, registry, }: {
    pkg: {
        name: string;
        version: string;
    };
    cachePath: string;
    log: Log;
    now?: number;
    registry?: string;
}): Promise<void>;
