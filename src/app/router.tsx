/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'

/**
 * Browser router over the shared route table. The table lives in routes.tsx
 * so the prerender entry (src/entry-server.tsx) can build a static router
 * over the exact same routes.
 */
export const router = createBrowserRouter(routes)
