import { Request, Router, Response } from "express"
import { AppRouter, t } from "../my-router"
import path from 'path'
import fs from 'fs'
import { UploadedFile } from 'express-fileupload'
import { fileSchema, IUploadFileResponse, UploadFileSchema } from "../models/upload.model"
import { HttpLogger } from "../logger"
import { FileRepository } from "../repository/file.repository"
import { FileService } from "../service/file.service"
import { fromZodError } from "zod-validation-error"

const rootDir = path.join('public', 'images')

if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true })
}
const fileRepository = new FileRepository()
const fileService = new FileService(fileRepository)
const router = Router()
router.get('/download', async (req: Request, res: Response) => {
    const validateSchema = await fileSchema.safeParseAsync(req.query)
    if (!validateSchema.success) {
        const validationError = fromZodError(validateSchema.error)
        const msg = `${validationError.message}`.replace(/"/g, `'`)
        res.status(400).json({
            statusCode: 400,
            message: msg,
            details: validateSchema.error.issues.map((issue) => ({
                path: issue.path,
                message: issue.message,
            }))
        })
        return
    }

    const { filePath, filename } = req.query as unknown as { filePath: string, filename: string }

    let fullPath = path.join(rootDir, filename)
    if (filePath) {
        fullPath = path.join(rootDir, filePath, filename)
    }

    if (!fs.existsSync(fullPath)) {
        res.status(400).json({
            statusCode: 400,
            message: 'file already exists'
        })
        return
    }
    return res.download(fullPath)
})

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

        const result = await fileService.uploadFile({
            fileName: filename,
            filePath: filePath,
            mimetype: file.mimetype,
            size: file.size,
        }, logger)

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

appRouter.get('/file', async ({ query: { filePath, filename, options = 'base64' } }) => {
    let fullPath = path.join(rootDir, filename)

    if (filePath) {
        fullPath = path.join(rootDir, filePath, filename)
    }

    if (!fs.existsSync(fullPath)) {
        return {
            statusCode: 400,
            message: 'file already exists'
        }
    }

    const data = fs.readFileSync(fullPath, options)

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


appRouter.get('/files', async () => {
    const data = await fileService.walk(rootDir)
    const [err, results] = await fileService.walk(rootDir)
    if (err) {
        return {
            statusCode: 400,
            message: err.message
        }
    }

    return {
        statusCode: 200,
        data: results
    }
})

export default appRouter.register()