import path from "path";
import { HttpLogger } from "../logger";
import { FileStats, IFile, IUploadFile, IUploadFileResponse } from "../models/upload.model";
import { BaseResponse } from "../my-router";
import { FileRepository } from "../repository/file.repository";
import fsPromise from 'fs/promises'

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
                href: path.join('{BASE_URL}', `${file.filePath.replace('public', '')}`, `${result.fileName}`),
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

    private isOlderThan30Days(stats: IFile, day: number = 30): boolean {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        return stats.mtime < thirtyDaysAgo;
    }

    public async removeFile(dir: string): Promise<FileStats[]> {
        let result: FileStats[] = [];
        try {
            const files = await fsPromise.readdir(dir);
            for (const file of files) {
                const itemPath = path.join(dir, file);
                const stats = await fsPromise.stat(itemPath);

                if (stats.isFile()) {
                    if (this.isOlderThan30Days(stats, 0)) {
                        console.log(`Deleting old file: ${itemPath}`);
                        result.push({ path: itemPath, ...stats });
                        await fsPromise.unlink(itemPath);
                    }
                } else if (stats.isDirectory()) {
                    const subDirFiles = await this.removeFile(itemPath);
                    result = result.concat(subDirFiles);
                }
            }
        } catch (err) {
            console.error('Unable to scan directory:', err);
        }

        return result;
    }



    public async walk(dir: string): Promise<[error: Error | null, results: FileStats[]]> {
        let result: FileStats[] = [];
        let error: Error | null = null;
        try {
            const files = await fsPromise.readdir(dir);
            for (const file of files) {
                const itemPath = path.join(dir, file);
                const stats = await fsPromise.stat(itemPath);

                if (stats.isFile()) {
                    result.push({ path: itemPath, ...stats });
                } else if (stats.isDirectory()) {
                    const subDirFiles = await this.walk(itemPath);
                    result = result.concat(subDirFiles[1]);
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                error = err;
            } else {
                error = new Error(String(err));
            }
        }

        return [error, result];
    }
}