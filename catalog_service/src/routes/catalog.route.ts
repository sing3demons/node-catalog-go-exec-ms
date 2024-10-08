import { Router } from 'express';
import { AppRouter } from '../my-router';
import { CatalogService } from '../service/catalog.service';
import { CatalogRepository } from '../repository/catalog.repository';
import { ProductSchema, ProductUpdateSchema, QuerySchema } from '../models/product.model';
import { HttpLogger } from '../logger';

const router = Router()
const catalogRepository = new CatalogRepository()
const catalogService = new CatalogService(catalogRepository)
const appRouter = new AppRouter(router)

appRouter.post('/product',
    async ({ body, req }) => {
        const username = req?.user?.username || 'anonymous'
        const logger = new HttpLogger(req)
        const result = await catalogService.createProduct({ ...body, username }, logger)
        logger.flush()
        return result
    }, {
    body: ProductSchema
})

appRouter.patch('/product/:id',
    async ({ body, params, req }) => {
        const username = req?.user?.username || 'anonymous'
        const logger = new HttpLogger(req)
        const result = await catalogService.update({ ...body, id: params.id, username }, logger)
        logger.flush()
        return result

    }, {
    body: ProductUpdateSchema
})

appRouter.get('/product', async ({ query: { limit = "10", offset = "0", name }, req }) => {
    const logger = new HttpLogger(req)
    logger.info({ query: { limit, offset, name } }, `client request`)

    const result = await catalogService.findAll({ limit, offset, name }, logger)
    logger.flush()
    return result
}, {
    query: QuerySchema
})

appRouter.delete('/product/:id', async ({ params, req }) => {
    const logger = new HttpLogger(req)
    const result = await catalogService.delete(params.id, logger)
    logger.flush()
    return result

})

appRouter.get('/product/:id', async ({ params, req }) => {
    const logger = new HttpLogger(req)
    logger.info(`client request`)
    const result = await catalogService.findById(params.id, logger)
    logger.flush()
    return result
})

export default appRouter.register()
