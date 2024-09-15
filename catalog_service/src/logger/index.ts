import pino from "pino";
import type { NextFunction, Request, Response } from "express";
import { pinoHttp } from "pino-http";
import path from "path";
import dayjs from "dayjs";
import { v7 as uuid } from 'uuid'

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
    },
    redact: ['access_token', 'secret_token', 'password', 'stores[*].access_token'],
    formatters: {
        bindings: ({ pid, hostname, }) => ({
            pid: pid, host: hostname, node_version: process.version,
        })
    },
    serializers: pino.stdSerializers,
    timestamp: () => `,"@timestamp":"${new Date(Date.now()).toISOString()}"`,


})
export const httpLogger = pinoHttp({ logger: _logger })
const transaction = 'x-transaction-id'
export interface ILogger {
    info: (obj: object, msg?: string) => void;
    error: (obj: object, msg?: string) => void;
    warn: (obj: object, msg?: string) => void;
}

export const session = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers[transaction]) {
        req.headers[transaction] = uuid()
    }
    next()
}

export class HttpLogger {
    private readonly _logger: pino.Logger
    private readonly _transactionId: any

    constructor(req: Request) {
        if (!req.headers[transaction]) {
            req.headers[transaction] = uuid()
        }
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
        this._logger.error(obj, msg, ...args)
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



