import dayjs from "dayjs";
import Prisma, { type TPrismaClient } from "../db";
import type { HttpLogger } from "../logger";
import { IUploadFile } from "../models/upload.model";
import path from "path";
import fs from 'fs'

export class FileRepository {
    constructor(private readonly _prisma: TPrismaClient = Prisma()) { }

    private query = (logger: HttpLogger) => {
        this._prisma.$on('query', (e) => {
            const query = {
                query: e.query.replace(/"/g, `'`),
                params: e.params.replace(/"/g, `'`),
                duration: `${e.duration} ms`,
                target: e.target
            }
            logger.write(query)
        })

        return this._prisma
    }

    public async getFile(name: string, filePath: string, logger: HttpLogger) {
        logger.info('repository get file')
        try {
            const result = await this.query(logger).file.findFirst({
                where: {
                    fileName: name,
                    filePath: filePath
                },
                select: {
                    id: true,
                    fileName: true,
                    filePath: true,
                    mimetype: true,
                    size: true
                }
            })

            return result
        } catch (error) {
            logger.error(error)
            throw new Error('unable to get file');
        }
    }

    public async uploadFile(file: IUploadFile, logger: HttpLogger) {
        logger.info('repository upload file')
        try {
            const exist = await this.query(logger).file.findFirst({
                where: {
                    fileName: file.fileName,
                    filePath: file.filePath
                }
            })

            if (exist) {
                logger.info('repository update file')
                const result = await this.query(logger).file.update({
                    data: {
                        fileName: file.fileName,
                        filePath: file.filePath,
                        mimetype: file.mimetype,
                        size: file.size,
                        updateBy: 'system',
                    }, where: {
                        id: exist.id
                    }
                })

                return result

            } else {
                logger.info('repository create file')
                const result = await this.query(logger).file.create({
                    data: {
                        fileName: file.fileName,
                        filePath: file.filePath,
                        mimetype: file.mimetype,
                        size: file.size,
                        createBy: 'system',
                        updateBy: 'system'
                    }
                })

                return result
            }

        } catch (error) {
            logger.error(error)
            return null
        }
    }

    public async deleteFile(name: string, filePath: string, logger: HttpLogger) {
        logger.info('repository delete file')
        try {

            const exist = await this.query(logger).file.findFirst({
                where: {
                    fileName: name,
                    filePath: filePath
                }
            })

            if (!exist) {
                return null
            }
            const now = dayjs()
            const result = await this.query(logger).file.update({
                where: {
                    id: exist.id
                },
                data: {
                    deleted: true,
                    updateBy: 'system',
                    deletedAt: now.add(30, 'day').toISOString()
                }
            })


            return result
        } catch (error) {
            logger.error(error)
            throw new Error('unable to delete file');
        }
    }

    public async getForDelete(logger: HttpLogger) {
        logger.info('repository get for delete')
        try {
            const result = await this.query(logger).file.findMany({
                where: {
                    deleted: true,
                    deletedAt: {
                        lte: dayjs().toISOString()
                    }
                }
            })

            if (result.length === 0) {
                return null
            }

            for (const file of result) {
                const filePath = path.join(file.filePath, file.fileName)
                if (!fs.existsSync(filePath)) {
                    logger.info(`file ${filePath} not found`)
                    continue
                }
                fs.unlinkSync(filePath)
                logger.info(`file ${filePath} deleted`)
            }

            return result
        } catch (error) {
            logger.error(error)
            throw new Error('unable to get file for delete');
        }
    }
}