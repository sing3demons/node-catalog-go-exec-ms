import { t } from "../my-router"


export const UploadFileSchema = t.object({
    replaceFileName: t.string().optional(),
    filePath: t.string().optional()
})

export type IUploadFileResponse = {
    url: string
    filename: string
}