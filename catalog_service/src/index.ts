import { faker } from "@faker-js/faker";
import { connect, disconnect } from "./db";
import { HttpService } from "./external-services/http.external.services";
import { logger } from "./logger";
import { Product } from "./models/product.model";
import app from "./server";

const port = process.env.PORT || 8000;

export const StartServer = async () => {
    await connect();
    app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
    });




    process.on('unhandledRejection', (reason, promise) => {
        logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    })

    process.on('uncaughtException', async (error) => {
        logger.error(`Uncaught Exception thrown: ${error}`);
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

// async function createFakeData() {
//     const httpServer = new HttpService({
//         retries: 3,
//         timeout: 5000,
//         endpoint: 'http://localhost:8000/api/product'
//     });
//     for (let i = 0; i < 10000; i++) {
//         const data: Product & { username: string } = {
//             name: faker.commerce.productName(),
//             price: +faker.commerce.price(),
//             description: faker.commerce.productDescription(),
//             image: faker.image.url(),
//             stock: faker.number.int({ min: 1, max: 100 }),
//             username: 'admin'
//         }
//         await httpServer.post(data, {})
//     }

// }

// createFakeData()