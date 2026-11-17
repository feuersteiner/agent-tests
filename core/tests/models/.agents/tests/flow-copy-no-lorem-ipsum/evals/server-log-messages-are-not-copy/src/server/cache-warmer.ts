import { logger } from './logger.ts';
import { redis } from './redis.ts';
import { listPopularProducts } from './products.ts';

export const warmProductCache = async (): Promise<void> => {
	const started = Date.now();
	logger.info('Warming the product cache');
	const products = await listPopularProducts(500);
	for (const product of products) {
		await redis.set(`product:${product.id}`, JSON.stringify(product), 'EX', 3600);
	}
	logger.info(`Cached ${products.length} products in ${Date.now() - started} ms`);
};
