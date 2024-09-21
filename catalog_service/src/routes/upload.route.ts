import { Request, Router, Express, Response, NextFunction } from "express"
import { AppRouter } from "../my-router"
import path from 'path'
import fs from 'fs'
import fileUpload, { UploadedFile } from 'express-fileupload'
import { IUploadFileResponse, UploadFileSchema } from "../models/upload.model"
import { HttpLogger } from "../logger"


const rootDir = path.join('public', 'images')

if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true })
}

const router = Router()

const appRouter = new AppRouter(router)
appRouter.post('/upload', async ({ req }) => {
    const logger = new HttpLogger(req)
    if (!req.files) {
        return {
            statusCode: 400,
            message: 'file not found'
        }
    }

    logger.info('upload file')

    const data: IUploadFileResponse[] = []
    for (const key in req.files) {
        const file: UploadedFile = req.files[key] as UploadedFile
        let filename = file.name
        if (req.body?.replaceFileName) {
            filename = req.body.replaceFileName + path.extname(file.name)
        }

        let filePath = rootDir
        if (req.body?.filePath) {
            filePath = path.join(rootDir, req.body.filePath)
        }

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true })
        }


        await file.mv(path.join(filePath, filename))

        data.push({
            url: `http://localhost:8000/images/${filename}`,
            filename
        })
    }
    logger.info(data)
    logger.flush()
    return {
        statusCode: 200,
        message: 'success',
        data: data.length === 1 ? data[0] : data
    }
}, {
    body: UploadFileSchema
})


appRouter.get('/file/:filename', async ({ params: { filename }, query: { filePath } }) => {
    let fullPath = path.join(rootDir, filename)

    if (filePath) {
        fullPath = path.join(rootDir, filePath, filename)
    }
    console.log('fullPath ===> ', fullPath)
    if (!fs.existsSync(fullPath)) {
        return {
            statusCode: 400,
            message: 'file already exists'
        }
    }

    const data = fs.readFileSync(fullPath, 'base64')

    return {
        statusCode: 200,
        data
    }
}, {
    query: UploadFileSchema
})

export default appRouter.register()
// export default router