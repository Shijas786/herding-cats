import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { ensureDailyPost } from '../core/post';

export const menu = new Hono();

menu.post('/post-daily', async (c) => {
  try {
    const { postId, created } = await ensureDailyPost();
    return c.json<UiResponse>({
      showToast: created
        ? "Today's room is up"
        : "Today's room was already posted",
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${postId}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      { showToast: "Failed to post today's room" },
      400
    );
  }
});
