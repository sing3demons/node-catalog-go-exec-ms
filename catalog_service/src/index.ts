import { connect, disconnect } from "./db";
import app from "./server";

const port = process.env.PORT || 8000;

export const StartServer = async () => {
    await connect();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
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
        console.log('Received SIGINT. Shutting down');
        await disconnect();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM. Shutting down');
        await disconnect();
        process.exit(0);
    });
}

StartServer().then(() => {
    console.log('Server started successfully');
})