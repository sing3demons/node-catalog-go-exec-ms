import { t } from "../my-router"


export const UploadFileSchema = t.object({
    replaceFileName: t.string().optional(),
    filePath: t.string().optional()
})

// export type IUploadFileResponse = {
//     url: string
//     filename: string
// }

export type IUploadFile = {
    fileName: string
    filePath: string
    size: number
    mimetype: string
}

export type IUploadFileResponse = {
    id: string;
    href: string;
    fileName: string;
    filePath: string;
    size: number;
    mimetype: string;
}