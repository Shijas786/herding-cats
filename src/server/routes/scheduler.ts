import { Hono } from 'hono';
import { ensureDailyPost } from '../core/post';

export const scheduler = new Hono();

scheduler.post('/daily-post', async (c) => {
  try {
    const { postId, created } = await ensureDailyPost();
    return c.json({ status: 'success', postId, created }, 200);
  } catch (error) {
    console.error(`Daily post failed: ${error}`);
    return c.json({ status: 'error' }, 500);
  }
});
