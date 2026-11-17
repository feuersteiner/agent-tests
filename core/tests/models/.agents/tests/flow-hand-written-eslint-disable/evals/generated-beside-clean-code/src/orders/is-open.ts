import type { Order } from '../gen/graphql.ts';

export const isOpen = (order: Order): boolean => order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
