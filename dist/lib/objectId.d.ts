import { ObjectId } from "mongodb";
export declare function paramString(value: string | string[]): string;
export declare function parseObjectId(id: string | string[], label?: string): ObjectId;
