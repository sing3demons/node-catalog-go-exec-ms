import { Router } from 'express';
import { AppRouter } from '../my-router';
import { CatalogService } from '../service/catalog.service';
import { CatalogRepository } from '../repository/catalog.repository';
import { z } from 'zod';
import { ProductSchema, ProductUpdateSchema } from '../models/product.model';
import { HttpLogger } from '../logger';

const router = Router()
const catalogRepository = new CatalogRepository()
const catalogService = new CatalogService(catalogRepository)
const appRouter = new AppRouter(router)

appRouter.post('/product', async ({ body, req }) => {
    const logger = new HttpLogger(req)
    const result = await catalogService.createProduct(body, logger)
    logger.flush()
    return result

}, {
    body: ProductSchema
})

appRouter.patch('/product/:id', async ({ body, params, req }) => {
    const logger = new HttpLogger(req)
    const result = await catalogService.update({ ...body, id: params.id }, logger)
    logger.flush()
    return result

}, {
    body: ProductUpdateSchema
})

appRouter.get('/product', async ({ query: { limit = 10, offset = 0 }, req }) => {
    const logger = new HttpLogger(req)
    logger.info(`client request`)

    const result = await catalogService.findAll({ limit, offset }, logger)
    logger.flush()
    return result
}, {
    query: z.object({
        limit: z.number().int().default(10),
        offset: z.number().int().default(0)
    })
})

appRouter.delete('/product/:id', async ({ params, req }) => {
    const logger = new HttpLogger(req)
    return await catalogService.delete(params.id, logger)
})

appRouter.get('/product/:id', async ({ params, req }) => {
    const logger = new HttpLogger(req)
    return await catalogService.findById(params.id, logger)
}, {
    params: z.object({
        id: z.string()
    })
})





export default appRouter.register()
