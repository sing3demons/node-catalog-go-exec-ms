import { type Request, type Response, Router } from 'express';
import { AppRouter } from '../my-router';
import { CatalogService } from '../service/catalog.service';
import { CatalogRepository } from '../repository/catalog.repository';
import { z } from 'zod';
const router = Router()

const catalogRepository = new CatalogRepository()
const catalogService = new CatalogService(catalogRepository)
const appRouter = new AppRouter(router)

appRouter.post('/product', async ({ body }) => {
    try {
        const result = await catalogService.createProduct(body)
        if (result.err) {
            return {
                statusCode: 50000,
                message: result.data instanceof Error ? result.data.message : 'unable to create product'
            }
        }

        return {
            statusCode: 20100,
            message: 'Product created successfully',
            data: result.data
        }
    } catch (error) {
        console.log(error)
        return {
            statusCode: 500,
            message: error instanceof Error ? error.message : 'unable to create product'
        }

    }
}, {
    body: z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        image: z.string(),
        stock: z.number()
    })
})

export default appRouter.register()
