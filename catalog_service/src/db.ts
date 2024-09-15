import { PrismaClient } from '@prisma/client'
import type { DefaultArgs, PrismaClientOptions } from "@prisma/client/runtime/library";

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

const prisma = new PrismaClient({
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


export default prisma;
export const connect = async () => await prisma.$connect();
export const disconnect = async () => await prisma.$disconnect();