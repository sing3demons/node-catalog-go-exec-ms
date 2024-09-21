import { customAlphabet } from 'nanoid'


class NanoIdService {
    private readonly alphanum: string
    private readonly len: number
    constructor() {
        this.len = 11
        this.alphanum = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    }

    randomNanoId(): string {
        const nanoid = customAlphabet(this.alphanum, this.len)
        return nanoid()
    }

    randomNanoIdWithLen(len: number): string {
        const nanoid = customAlphabet(this.alphanum, len)
        return nanoid()
    }
}

export default new NanoIdService()