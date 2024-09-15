import express, { Request, Response, NextFunction } from 'express';
import catalogRoute from './routes/catalog.route';
import { v7 as uuid } from 'uuid'
import { httpLogger, logger } from './logger';
import helmet from 'helmet';

const app = express()
const transaction = 'x-transaction-id'
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, _res, next) => {
    if (!req.headers[transaction]) {
        req.headers[transaction] = uuid()
    }
    next()
})
app.use(httpLogger)

app.use('/api', catalogRoute)
app.use((req, res) => {
    res.status(404).json({ message: 'Unknown URL', path: req.originalUrl })
})
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500
    let message = 'An unknown error occurred'
    if (err instanceof Error) {
        logger.error(err)
        message = err.message

        if (message.includes('not found')) {
            statusCode = 404
        }
    } else {
        logger.error(`Unknown error: ${String(err)}`)
        message = `An unknown error occurred, ${String(err)}`
    }

    const data = {
        statusCode: statusCode,
        message,
        success: false,
        data: null,
        traceStack: process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
    }
    res.status(statusCode).send(data)
})
export default app
