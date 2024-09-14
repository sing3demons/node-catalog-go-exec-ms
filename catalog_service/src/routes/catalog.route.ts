import { Request, Response, Router } from 'express';
const router = Router()

router.post('/product', async (req: Request, res: Response) => {
    res.status(201).send('Product created');
})

export default router;