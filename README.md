# Daily Oath Web

Static one-page promotional site for the Daily Oath mobile app.

## Local Commands

```bash
npm test
npx serve .
```

The landing page is implemented with plain HTML, CSS, and a small progressive reveal script so it can be hosted as static files on GitHub Pages.

## Notification List

The notification form posts directly to Buttondown using the public static embed endpoint for the `alexandruv` account. Buttondown stores subscribers and handles unsubscribe/list management for launch email delivery.
