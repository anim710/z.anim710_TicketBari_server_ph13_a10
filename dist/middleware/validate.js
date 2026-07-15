export function validate(schemas) {
    return (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                // Express 5: req.query is a getter-only property — replace via defineProperty
                const parsed = schemas.query.parse(req.query);
                Object.defineProperty(req, "query", {
                    value: parsed,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map