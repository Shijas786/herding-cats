// Stand-ins for @devvit/web/client, for `npm run local` only.
export const context = {};
export const showToast = (t: string | { text: string }): void => {
  const el = document.createElement('div');
  el.textContent = typeof t === 'string' ? t : t.text;
  el.style.cssText =
    'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#222;color:#fff;padding:10px 16px;border-radius:999px;z-index:99;font:600 14px system-ui';
  document.body.append(el);
  setTimeout(() => el.remove(), 2500);
};
export const navigateTo = (url: string): void => {
  const m = /comments\/(?:t3_)?(\w+)/.exec(url);
  location.href = m ? `/game.html?post=t3_${m[1]}` : '/game.html';
};
export const requestExpandedMode = (): void => {
  location.href = `/game.html${location.search}`;
};
