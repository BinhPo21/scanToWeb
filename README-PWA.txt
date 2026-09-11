SCAN TOWEB V57 - PWA CHO GITHUB PAGES

Cac file PWA da duoc them:
- manifest.json
- sw.js
- icon-192.png
- icon-512.png

Da cap nhat:
- index.html

Cach su dung:
1. Upload toan bo noi dung nay len GitHub repository.
2. Bat GitHub Pages cho repository.
3. Mo website bang HTTPS.
4. Mo bang Chrome tren Android.
5. Neu Chrome chua hien "Cai dat ung dung" ngay:
   - Tai lai trang 1-2 lan.
   - Dong Chrome va mo lai.
   - Xoa shortcut cu neu truoc do da tao.
   - Vao menu Chrome va kiem tra muc Cai dat ung dung.

Luu y:
- Dung duong dan tuong doi ./ va ten file, phu hop GitHub Pages.
- Service Worker co cache cac file cua app.
- Google Form, API ngoai va CDN khong bi ep cache.


V57-PWA-2 - FIX BAN PHIM ANDROID:
- Them interactive-widget=resizes-content vao viewport.
- Bo khoa chieu cao scanner bang 100vh/100dvh.
- Khi ban phim mo, Chrome Android co the resize layout viewport de tranh khoang trong lon phia duoi.
- Logic script.js khong thay doi.


V58: QR 5/6 ma mo Google Form ngay bang du lieu QR, sau do kiem tra Google Sheet nen. Neu khac, bam OK de tai lai Form bang du lieu moi nhat. QR 1 ma giu nguyen logic cu.
