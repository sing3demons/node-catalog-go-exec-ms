import { pinoHttp } from "pino-http";
import pino from "pino";
import { Request } from "express";

export const logger = pino({
    level: "info",
    base: {
        serviceName: "catalog-service",
    },
    serializers: pino.stdSerializers,
    timestamp: () => `,"@timestamp":"${new Date(Date.now()).toISOString()}"`,

})

export interface ILogger {
    info: (obj: object, msg?: string) => void;
    error: (obj: object, msg?: string) => void;
    warn: (obj: object, msg?: string) => void;
}

export class HttpLogger {
    private readonly _logger: pino.Logger

    constructor(req: Request) {
        this._logger = logger.child({ transactionId: req.headers['x-transaction-id'] })
    }
    info(obj: unknown, msg?: string, ...args: any[]) {
        this._logger.info(obj, msg, ...args)
        return this
    }

    error(obj: unknown, msg?: string, ...args: any[]) {
        this._logger.error(obj, msg)
        return this
    }



    flush() {
        return this._logger.flush()
    }
}

export const httpLogger = (req: Request) => {
    console.log(`Request received with transaction id: ${req.headers['x-transaction-id']}`)

    return logger.child({ transactionId: req.headers['x-transaction-id'] })
}


