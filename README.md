# Stock Monitor Chrome Extension

A Chrome extension that helps you monitor product stock and get notified when items are back in stock with your selected options (size, color, etc.).

## Features

- Monitor products on supported e-commerce sites (currently Nike and Amazon)
- Track specific product variants (size, color)
- Get desktop notifications when products are back in stock
- Configure check interval
- Optional email notifications
- Easy-to-use interface

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Visit a product page on a supported website (e.g., Nike or Amazon)
2. Select your desired product options (size, color, etc.)
3. Click the extension icon in your Chrome toolbar
4. Click "Monitor Current Product" to start monitoring
5. Configure your notification preferences in the Settings section

## Supported Websites

- Nike.com
- Amazon.com

## Development

To add support for more websites:

1. Add the website's selectors in `content.js` under the `selectors` object
2. Add the website's stock checking logic in `background.js` under the `checkProductAvailability` function

## Notes

- The email notification feature requires additional setup with an email service
- The extension checks stock at the interval specified in settings
- All monitored products are stored in Chrome's sync storage

## Contributing

Feel free to submit issues and enhancement requests!