import { type JwtPayload } from "jsonwebtoken";

export interface Payload extends JwtPayload {
    username: string
}

declare global {
    namespace Express {
        interface Request {
            user: Payload
        }
    }
}