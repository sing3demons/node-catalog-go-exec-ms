import { connect, disconnect } from "./db";
import { logger } from "./logger";
import app from "./server";

const port = process.env.PORT || 8000;

export const StartServer = async () => {
    await connect();
    app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    })

    process.on('uncaughtException', async (error) => {
        console.error(`Uncaught Exception thrown: ${error}`);
        await disconnect();
        process.exit(1);
    });

    process.on('SIGINT', async () => {
        logger.info('Received SIGINT. Shutting down');
        await disconnect();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM. Shutting down');
        await disconnect();
        process.exit(0);
    });
}

StartServer().then(() => {
    logger.info('Server started successfully');
})