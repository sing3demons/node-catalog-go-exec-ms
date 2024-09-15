import express from 'express';
import catalogRoute from './routes/catalog.route';
import { httpLogger, session } from './logger';
import helmet from 'helmet';
import { globalErrorHandler, notFoundError } from './my-router';

const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session)
app.use(httpLogger)

app.use('/api', catalogRoute)
app.use(notFoundError)
app.use(globalErrorHandler)

export default app
