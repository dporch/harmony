import { test as base, expect } from '@playwright/test';

const FIREFOX_UNSUPPORTED = new Set([
  'microphone', 'clipboard-read', 'clipboard-write',
]);

export { expect };

export const test = base.extend({
  browser: async ({ browser, browserName }, use) => {
    if (browserName === 'firefox') {
      const orig = browser.newContext.bind(browser);
      browser.newContext = (options = {}) => {
        const { permissions, ...rest } = options;
        return orig(rest);
      };
    }
    await use(browser);
  },

  context: async ({ context, browserName }, use) => {
    if (browserName === 'firefox') {
      const orig = context.grantPermissions.bind(context);
      context.grantPermissions = async (perms) => {
        const supported = perms.filter(p => !FIREFOX_UNSUPPORTED.has(p));
        if (supported.length > 0) return orig(supported);
      };
    }
    await use(context);
  },
});
