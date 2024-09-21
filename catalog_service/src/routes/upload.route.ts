import { Request, Router, Express, Response, NextFunction } from "express"
import { AppRouter } from "../my-router"
import path from 'path'
import fs from 'fs'
import  { UploadedFile } from 'express-fileupload'
import { IUploadFileResponse, UploadFileSchema } from "../models/upload.model"
import { HttpLogger } from "../logger"
import { FileRepository } from "../repository/file.repository"
import { FileService } from "../service/file.service"


const rootDir = path.join('public', 'images')

if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true })
}
const fileRepository = new FileRepository()
const fileService = new FileService(fileRepository)
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
        console.log('file ===> ', file)
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

        const result = await fileService.uploadFile({
            fileName: filename,
            filePath: filePath,
            mimetype: file.mimetype,
            size: file.size,
        }, logger)

        console.log('result ===> ', result)
        if (result.data) {
            data.push(result.data)
        } else {
            fs.unlinkSync(path.join(filePath, filename))
            return {
                statusCode: 400,
                message: result.message
            }
        }
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

appRouter.delete('/file/:filename', async ({ params: { filename }, query, req }) => {
    const logger = new HttpLogger(req)

    let filePath = rootDir
    if (query?.filePath) {
        filePath = path.join(rootDir, query.filePath)
    }
    const data = await fileService.deleteFile(filename, filePath, logger)
    return {
        statusCode: data ? 200 : 400,
        message: data ? 'file deleted' : 'file not found'
    }
}, {
    query: UploadFileSchema
})

export default appRouter.register()
// export default router