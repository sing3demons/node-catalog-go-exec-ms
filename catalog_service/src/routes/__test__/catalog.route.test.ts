import request from 'supertest';
import { Factory } from 'rosie'
import express from 'express';
import catalogRoute from '../catalog.route';
import { de, faker } from '@faker-js/faker';
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

})