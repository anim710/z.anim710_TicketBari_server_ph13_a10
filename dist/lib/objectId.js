import { ObjectId } from "mongodb";
import { AppError } from "../errors/AppError.js";
export function paramString(value) {
    return Array.isArray(value) ? value[0] : value;
}
export function parseObjectId(id, label = "id") {
    const raw = paramString(id);
    try {
        return new ObjectId(raw);
    }
    catch {
        throw new AppError(400, `Invalid ${label}`);
    }
}
//# sourceMappingURL=objectId.js.map