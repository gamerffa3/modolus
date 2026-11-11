# Modulos NFC Business CP — GitHub Pages + Firebase

## Is ZIP mein kya hai
- HTML/CSS/JavaScript only; koi SQL, PHP ya Node backend nahi.
- Firebase Email/Password Authentication login.
- Forgot Password option.
- Admin email allowlist: `geeky1934@gmail.com`.
- Email verification check.
- Firebase Realtime Database mein JSON-style business records.
- Add, edit, delete, search business.
- QR camera scanner + manual QR URL paste fallback.
- QR URL ka last path segment Unique Card ID banta hai.
- Har card ka public page: `https://modulos.in/nfcbusinesscp/20473`
- Public page par Google Review sabse upar.

## Bahut zaroori: password
Admin password ko code, ZIP, GitHub ya database rules mein kabhi hardcode nahi kiya gaya hai. Aapne jo password chat mein share kiya tha, security ke liye Firebase Authentication mein us password ko abhi change/reset karein. Password kisi ko forward na karein.

## Firebase setup
1. Firebase Console mein project `modulos-3d5de` kholein.
2. Authentication > Sign-in method > Email/Password enable karein.
3. Authentication > Users mein `geeky1934@gmail.com` user create karein. Password Firebase Console mein khud set karein.
4. Realtime Database ko enable karein (region Asia Southeast).
5. Realtime Database > Rules mein is ZIP ki `database.rules.json` file ka poora content paste karke Publish karein.
6. Login ke baad Firebase verification email bhejega. Email verify karne ke baad dobara login karein.
7. Authentication > Settings > Authorized domains mein `modulos.in` add karein. GitHub Pages ka domain use kar rahe hon to `YOUR-USERNAME.github.io` bhi add karein.

## GitHub Pages / custom domain deployment
1. ZIP extract karein.
2. Saari files/folders repository ke root mein upload karein (ya repository ke us folder mein jahan GitHub Pages publish source point karta hai).
3. GitHub repo > Settings > Pages mein publishing source set karein.
4. Custom domain `modulos.in` ko GitHub Pages settings mein configure karein; DNS records GitHub ke instructions ke mutabiq set karein.
5. Custom domain ke document root par app ko `/nfcbusinesscp/` path se serve hona chahiye. Agar repository root hi `/nfcbusinesscp/` URL par publish ho rahi hai to base path automatic hai.
6. `index.html`, `404.html`, `assets/` aur `database.rules.json` ek saath rakhein.
7. GitHub Pages par HTTPS enable karein. QR camera scanning ke liye HTTPS zaroori hai.

## Routing ka important note
GitHub Pages dynamic PHP-style routes nahi banata. Is build mein `404.html` fallback unknown path ko app mein load karta hai, aur JavaScript path ke last segment se ID lekar Realtime Database se public card read karta hai. Isliye `.../nfcbusinesscp/20473` URL chalane ke liye `404.html` bhi deploy hona zaroori hai. Deployment ke baad ek real QR ID se test karein.

## Security
- Database public card data ko read-only public read deta hai, kyunki customer QR visitors ko card details dekhni hoti hain.
- Database writes sirf verified Firebase user `geeky1934@gmail.com` ko allow hain.
- Firebase Auth password reset Firebase ke email flow se hota hai.
- Firebase web config ki API key public client config hoti hai; asli security Database Rules aur Auth se aati hai.
- Kabhi Service Account JSON, Admin SDK private key, private key ya user password GitHub par upload na karein.
- Admin account par strong unique password aur 2-step verification (Google account security) enable karein.
- Publicly visible business links/description ko hi database mein rakhein; private customer data store na karein.

## Known limitation / test notes
- GitHub Pages aur Firebase ka setup user ke Firebase/GitHub account mein manually enable karna hota hai; ZIP upload akela backend create nahi karta.
- QR scanner camera permission aur HTTPS mangta hai. Agar scan fail ho to full QR URL manually paste karein.
- Public page link ko deployment ke baad test karein. GitHub Pages fallback behavior custom domain/path configuration par depend kar sakta hai.
- Analytics intentionally initialize nahi kiya gaya, kyunki dashboard ke core features ke liye zaroori nahi.
