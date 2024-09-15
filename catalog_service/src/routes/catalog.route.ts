import { type Request, type Response, Router } from 'express';
import { AppRouter } from '../my-router';
import { CatalogService } from '../service/catalog.service';
import { CatalogRepository } from '../repository/catalog.repository';
import { z } from 'zod';
import { ProductSchema, ProductUpdateSchema } from '../models/product.model';
const router = Router()

const catalogRepository = new CatalogRepository()
const catalogService = new CatalogService(catalogRepository)
const appRouter = new AppRouter(router)

appRouter.post('/product', async ({ body }) => {
    const result = await catalogService.createProduct(body)
    return result

}, {
    body: ProductSchema
})

appRouter.patch('/product/:id', async ({ body, params }) => {
    const result = await catalogService.update({ ...body, id: params.id })
    return result

}, {
    body: ProductUpdateSchema
})

appRouter.get('/product', async ({ query: { limit = 10, offset = 0 } }) => {
    const result = await catalogService.findAll({ limit, offset })
    return result
}, {
    query: z.object({
        limit: z.number().int().default(10),
        offset: z.number().int().default(0)
    })
})

appRouter.delete('/product/:id', async ({ params }) => {
    return await catalogService.delete(params.id)
}, {
    params: z.object({
        id: z.string()
    })
})

appRouter.get('/product/:id', async ({ params }) => {
    return await catalogService.findById(params.id)
}, {
    params: z.object({
        id: z.string()
    })
})





export default appRouter.register()
