import { Router } from 'express';
import type { Namespace } from 'socket.io';
import storiesRouterFactory from './stories';
import pagesRouterFactory from './pages';
import proposalsRouterFactory from './proposals';

export const routerFactory = (ns: Namespace) => {
  const router = Router();
  router.use('/stories', storiesRouterFactory(ns));
  router.use('/proposals', proposalsRouterFactory(ns));
  router.use('/stories', pagesRouterFactory(ns)); // provides /stories/:id/pages/...
  return router;
};

export default routerFactory;


