import express from 'express';
import { httpLogger, session } from './logger';
import helmet from 'helmet';
import { globalErrorHandler, notFoundError } from './my-router';
import path from 'path'
import uploadRoute from './routes/upload.route';
import fileUpload from 'express-fileupload';

const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload())
app.use(session)
app.use(httpLogger)
app.use('/images', express.static(path.join('public', 'images')))

app.use('/api', uploadRoute)
app.use(notFoundError)
app.use(globalErrorHandler)

export default app
