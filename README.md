# Daily Oath Web

Static one-page promotional site for the Daily Oath mobile app.

## Local Commands

```bash
npm test
npm start
npx serve .
```

The landing page is implemented with plain HTML, CSS, and a small progressive reveal script so it can be hosted as static files.

## Notification List

`npm start` runs the small Node server in `server.js`. It serves the static site and saves notification form submissions to `.notify-data/notify-list.jsonl`, which is blocked from static file access.

On a VPS, run it behind your reverse proxy with:

```bash
PORT=8080 NOTIFY_DATA_DIR=/var/lib/daily-oath-www npm start
```
