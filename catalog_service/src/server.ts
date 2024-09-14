import express from 'express';
import catalogRoute from './routes/catalog.route';

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', catalogRoute)

export default app
