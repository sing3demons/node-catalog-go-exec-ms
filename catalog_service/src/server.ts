import express, { Request, Response, NextFunction } from 'express';
import catalogRoute from './routes/catalog.route';
import { v7 as uuid } from 'uuid'

const app = express()
const transaction = 'x-transaction-id'
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, _res, next) => {
    if (!req.headers[transaction]) {
        req.headers[transaction] = `default-${uuid()}`
    }
    next()
})

app.use('/api', catalogRoute)
app.use((req, res) => {
    res.status(404).json({ message: 'Unknown URL', path: req.originalUrl })
})
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500
    let message = 'An unknown error occurred'
    if (err instanceof Error) {
        console.log(`${err.name}: ${err.message}`)
        message = err.message

        if (message.includes('not found')) {
            statusCode = 404
        }
    } else {
        console.log('Unknown error')
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
