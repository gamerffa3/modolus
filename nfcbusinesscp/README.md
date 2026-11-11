# NFC Business CP — Starter Dashboard

## Features
- Admin password setup on first visit and login
- Add/edit/delete business records
- QR scanner (camera) and manual URL paste fallback
- Extracts the final URL segment as the card's unique ID
- Public page per ID, e.g. `/nfcbusinesscp/20473`
- Editable Google Review, WhatsApp, Instagram, Facebook, YouTube and Location links
- SQLite database; no separate database server needed

## Hosting
1. Upload the contents of this ZIP into your hosting folder `public_html/nfcbusinesscp/`.
2. Make sure PHP 8.0+ and the PDO SQLite extension are enabled.
3. Make sure PHP can write to the `data/` folder. Keep that folder private; the included `.htaccess` blocks directory listing, but ideally configure it outside the public web root.
4. Open `https://your-domain/nfcbusinesscp/`. On first visit, create an admin password.
5. Add a business, enter its details, then scan the QR or paste its full URL. The final URL segment becomes the ID.
6. The public card is available at `https://your-domain/nfcbusinesscp/ID`.

## Important
- This is a starter/test build. It does not connect to or modify your existing NFC panel automatically.
- QR scanning requires HTTPS (or localhost) and camera permission. If scanning is unavailable, paste the QR URL manually.
- The scanner library and Google Fonts load from the internet.
- Back up `data/database.sqlite` regularly.
- Before production use, have your hosting provider review PHP permissions, database protection, backups and HTTPS.
