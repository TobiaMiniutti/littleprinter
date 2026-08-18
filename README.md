# Little Printers web client

Static GitHub Pages client for the Nord Projects/Sirius Print Key API.

## Publish

Upload every file and the `assets` directory to the root of your GitHub repository. In **Settings → Pages**, select **Deploy from a branch**, branch `main`, directory `/ (root)`.

## Real printing flow

1. The **Connect** button sends a `GET` request with `Accept: application/json` to the Print Key URL and displays the printer name and online status.
2. The send button performs a `POST` to the same Print Key URL with the entered name encoded in `?from=SenderName`, `Content-Type: text/plain;charset=UTF-8`, and the message as the request body.
3. A successful Sirius server response must contain `{ "status": "sent" }`.

The Print Key must be an HTTPS URL when this page is served over HTTPS. The standard Nord Projects Sirius server enables CORS for `/printkey/*`.

## Original assets

Interface assets and the `Bebas Neue Whatever` font come from the Apache-2.0-licensed [nordprojects/littleprinters-ios-app](https://github.com/nordprojects/littleprinters-ios-app). The corresponding license is included as `assets/LICENSE-NORD`.
