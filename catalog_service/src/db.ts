import { PrismaClient } from '@prisma/client'
import type { DefaultArgs } from "@prisma/client/runtime/library";

export type TPrismaClient = PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "stdout";
        level: "error";
    } | {
        emit: "stdout";
        level: "info";
    } | {
        emit: "stdout";
        level: "warn";
    })[];
}, "query", DefaultArgs>

const _prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'stdout',
            level: 'error',
        },
        {
            emit: 'stdout',
            level: 'info',
        },
        {
            emit: 'stdout',
            level: 'warn',
        },
    ],
})

function Prisma() {
    return _prisma
}


export default Prisma
export const connect = async () => await _prisma.$connect();
export const disconnect = async () => await _prisma.$disconnect();