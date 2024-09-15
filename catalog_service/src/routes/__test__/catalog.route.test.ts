import request from 'supertest';
import { Factory } from 'rosie'
import express from 'express';
import catalogRoute from '../catalog.route';
import { da, de, faker } from '@faker-js/faker';
import { CatalogService } from '../../service/catalog.service';
import { CatalogRepository } from '../../repository/catalog.repository';
import { Product } from '../../models/product.model';

const app = express()

app.use(express.json())
app.use(catalogRoute)
const productFactory = new Factory<Product>()
    .attr('id', faker.string.uuid())
    .attr('name', faker.commerce.productName())
    .attr('description', faker.commerce.productDescription())
    .attr('price', +faker.commerce.price())
    .attr('image', faker.image.url())
    .attr('stock', faker.number.int({ min: 1, max: 100 }))

const mockRequest = () => {
    return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: +faker.commerce.price(),
        image: faker.image.url(),
        stock: faker.number.int({ min: 1, max: 100 }),
    }
}

describe('Catalog Route', () => {
    let catalogService: CatalogService
    beforeEach(() => {
        catalogService = new CatalogService(new CatalogRepository())
    })
    describe('POST /product', () => {
        test('should create product', async () => {
            const requestBody = mockRequest()
            const product = productFactory.build()


            jest.spyOn(catalogService, 'createProduct')
                .mockImplementationOnce(() => Promise.resolve({ err: false, data: product }))

            const response = await request(app)
                .post('/product')
                .send(requestBody)
                .set('Accept', 'application/json')

            expect(response.status).toBe(201)
            expect(response.body).toEqual({
                success: expect.any(Boolean),
                statusCode: expect.any(Number),
                message: expect.any(String),
                data: {
                    id: expect.any(String),
                    name: expect.any(String),
                    description: expect.any(String),
                    price: expect.any(Number),
                    image: expect.any(String),
                    stock: expect.any(Number),
                }
            })
        })

        test('should response with validation error 400', async () => {
            const requestBody = mockRequest()

            const response = await request(app)
                .post('/product')
                .send({
                    ...requestBody,
                    name: null
                })
                .set('Accept', 'application/json')

            expect(response.status).toBe(400)
        })
    })

    describe('PATCH /product/:id', () => {
        // test('should update product', async () => {
        //     const products = await catalogService.findAll({ limit: 1, offset: 0 })
        //     const product = products.data?.find(() => true) as Product

        //     const requestBody = {
        //         id: product.id,
        //         name: product.name,
        //         description: product.description,
        //         price: product.price,
        //         image: product.image,
        //         stock: product.stock,
        //     }
        //     if (!product) {
        //         const data = await catalogService.createProduct(requestBody)
        //         if (data.data instanceof Product) {
        //             requestBody.id = data.data.id
        //         }
        //     }
        //     jest.spyOn(catalogService, 'update')
        //         .mockImplementationOnce(() => Promise.resolve({ data: requestBody }))
        //     const response = await request(app)
        //         .patch(`/product/${requestBody.id}`)
        //         .send(requestBody)
        //         .set('Accept', 'application/json')
        //     console.log(response.body)
        //     expect(response.status).toBe(200)
        // })

        test('should response with validation error 400', async () => {
            const product = productFactory.build()
            const requestBody = {
                description: product.description,
                price: product.price,
                image: product.image,
                stock: product.stock,
            }

            const response = await request(app)
                .patch(`/product/${product.id}`)
                .send(requestBody)
                .set('Accept', 'application/json')

            expect(response.status).toBe(400)
        })
    })

})