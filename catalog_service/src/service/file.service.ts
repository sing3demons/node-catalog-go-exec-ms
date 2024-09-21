import { HttpLogger } from "../logger";
import { IUploadFile, IUploadFileResponse } from "../models/upload.model";
import { BaseResponse } from "../my-router";
import { FileRepository } from "../repository/file.repository";

export class FileService {
    constructor(private readonly repository: FileRepository) { }

    public async getFile(name: string, filePath: string, logger: HttpLogger) {
        logger.info('service get file')
        const response: BaseResponse<IUploadFileResponse> = {}
        try {
            const result = await this.repository.getFile(name, filePath, logger)
            if (!result) {
                response.statusCode = 40400
                response.message = 'file not found'
                return response
            }

            response.statusCode = 20000
            response.message = 'file found'
            response.data = {
                id: result.id,
                href: `http://localhost:8000/images/${result.fileName}`,
                fileName: result.fileName,
                filePath: result.filePath,
                mimetype: result.mimetype,
                size: result.size
            }
            return response
        } catch (error) {
            logger.error(error)
            throw new Error('unable to get file');
        }
    }

    public async uploadFile(file: IUploadFile, logger: HttpLogger) {
        logger.info('service upload file')
        const response: BaseResponse<IUploadFileResponse> = {}
        try {
            const result = await this.repository.uploadFile(file, logger)
            if (!result) {
                response.statusCode = 40400
                response.message = 'file not uploaded'
                return response
            }
            response.statusCode = 20100
            response.message = 'file uploaded'
            response.data = {
                id: result.id,
                href: `http://localhost:8000/images/${result.fileName}`,
                fileName: result.fileName,
                filePath: result.filePath,
                mimetype: result.mimetype,
                size: result.size
            }
            return response
        } catch (error) {
            logger.error(error)
            throw new Error('unable to upload file');
        }
    }

    public async deleteFile(name: string, filePath: string, logger: HttpLogger) {
        logger.info('service delete file')
        const response: BaseResponse = {}
        try {
            const result = await this.repository.deleteFile(name, filePath, logger)
            if (!result) {
                response.statusCode = 40400
                response.message = 'file not found'
                return response
            }
            response.statusCode = 20000
            response.message = 'file deleted'
            response.data = result
            return response
        } catch (error) {
            logger.error(error)
            throw new Error('unable to delete file');
        }
    }
}