import { t } from "../my-router"
import { Stats } from "fs"



export const UploadFileSchema = t.object({
    replaceFileName: t.string().optional(),
    filePath: t.string().optional(),
})

export const GetUploadFileSchema = t.object({
    replaceFileName: t.string().optional(),
    filePath: t.string().optional(),
    filename: t.string(),
    options: t.enum(["ascii"
        , "utf8"
        , "utf-8"
        , "utf16le"
        , "utf-16le"
        , "ucs2"
        , "ucs-2"
        , "base64"
        , "base64url"
        , "latin1"
        , "binary"
        , "hex"]).default("utf-8")
})

export const fileSchema = t.object({
    filename: t.string(),
    filePath: t.string().optional()
})


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

export type IFile = Stats

export interface FileStats extends Stats {
    path: string;
}