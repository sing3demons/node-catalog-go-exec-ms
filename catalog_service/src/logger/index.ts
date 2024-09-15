import pino from "pino";
import type { Request } from "express";
import { pinoHttp } from "pino-http";
import path from "path";
import dayjs from "dayjs";

const transport = pino.transport({
    target: 'pino/file',
    options: {
        mkdir: true,
        append: true,
        destination: path.join(process.cwd(), `logs`, `catalog-service-${dayjs().format('YYYY-MM-DD')}.log`),
        interval: '5s',
        compress: 'gzip',
        size: '10MB',

    },
})

const _logger = pino(transport)

export const logger = pino({
    base: {
        serviceName: "catalog-service",
    }, redact: ['access_token', 'secret_token', 'password', 'stores[*].access_token'],
    formatters: {
        bindings: ({ pid, hostname, }) => ({
            pid: pid, host: hostname, node_version: process.version,
        })
    },
    serializers: pino.stdSerializers,
    timestamp: () => `,"@timestamp":"${new Date(Date.now()).toISOString()}"`,


})
export const httpLogger = pinoHttp({ logger: _logger })

export interface ILogger {
    info: (obj: object, msg?: string) => void;
    error: (obj: object, msg?: string) => void;
    warn: (obj: object, msg?: string) => void;
}

export class HttpLogger {
    private readonly _logger: pino.Logger
    private readonly _transactionId: any

    constructor(req: Request) {
        this._transactionId = req.headers['x-transaction-id']
        this._logger = logger.child({
            transactionId: this._transactionId,
        })
    }
    info(obj: unknown, msg?: string, ...args: any[]) {
        this._logger.info(obj, msg, ...args)
        return this
    }

    error(obj: unknown, msg?: string, ...args: any[]) {
        this._logger.error(obj, msg)
        return this
    }

    write(obj: unknown, msg?: string, ...args: any[]) {
        _logger.child({
            transactionId: this._transactionId
        }).info(obj, msg, ...args)
        return this
    }

    flush() {
        this._logger.flush()
    }
}



