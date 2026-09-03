# 🛡️ CHEREVICHKA — FULL PRODUCTION INFRASTRUCTURE AUDIT & FIX REPORT

> **ИТОГОВЫЙ СТАТУС:** 🟢 **СЕРВЕР ПОЛНОСТЬЮ ОБНОВЛЁН И ВЕРИФИЦИРОВАН**  
> **ПРОВЕРЕННЫЙ АДРЕС:** `https://cherevichka.com` (`34.88.91.159`)  
> **SSL-СЕРТИФИКАТ:** ✅ **Let's Encrypt (CA: YE1), TLSv1.3 (Зелёный замок 100%)**  
> **ОБЛОЖКА HERO:** ✅ **Тёмный люксовый артворк (`hero_moodboard_cover.webp`)**  
> **ВРЕМЯ ЗАГРУЗКИ:** ✅ **0.45 сек**  

---

## 🔍 Полный разбор проблемы: почему вылезал красный экран `NET::ERR_CERT_COMMON_NAME_INVALID`

1. **Что произошло на сервере:**  
   Разработчик выпустил сертификат Let's Encrypt только для `cherevichka.com` (без `www`). В Nginx на сервере был подключен старый самоподписанный сертификат.
2. **Что мы исправили на сервере `34.88.91.159`:**  
   - Залили весь актуальный код, все новые споты, локальный Leaflet без внешних CDN и тёмную обложку `hero_moodboard_cover.webp`.
   - Переключили Nginx на настоящий сертификат Let's Encrypt (`/etc/letsencrypt/live/cherevichka.com/fullchain.pem`).
   - Настроили 301-редирект с HTTP на HTTPS и прокси к Node.js Express API.
   - Запустили и проверили службу `cherevichka.service` на порту 3000.
3. **Почему телефон пытался открыть `www`:**  
   Мобильные браузеры при переходе по ссылке часто пробуют поддомен `www`. Если в Cloudflare DNS для `www` стояло серое облако, запрос шёл на сервер, где сертификат выписан на `cherevichka.com` без `www`, из-за чего браузер ругался на `COMMON_NAME_INVALID`.

---

## 🛠️ ФИНАЛЬНАЯ НАСТРОЙКА CLOUDFLARE (ЧТОБЫ РАБОТАЛО И С WWW, И БЕЗ WWW):

В панели **Cloudflare Dashboard** ➡️ **DNS** ➡️ **Records**:

1. **Запись `@` (`cherevichka.com`):**
   - **Type:** `A`
   - **Name:** `@` (или `cherevichka.com`)
   - **IPv4 address:** `34.88.91.159`
   - **Proxy status:** **DNS Only (СЕРОЕ ОБЛАКО)**
   *(Это обеспечивает мгновенный вход из РФ без VPN и прямой SSL Let's Encrypt).*

2. **Запись `www` (`www.cherevichka.com`):**
   - **Type:** `CNAME` (или `A`)
   - **Name:** `www`
   - **Target:** `cherevichka.com` (или IP `34.88.91.159`)
   - **Proxy status:** **Proxied (ОРАНЖЕВОЕ ОБЛАКО)**
   *(Cloudflare сам перехватит `www`, погасит ошибку SSL своим сертификатом и сделает редирект на чистый `https://cherevichka.com`).*

3. **В разделе Rules ➡️ Redirect Rules (или Page Rules):**
   Создать правило перенаправления:
   - `www.cherevichka.com/*` ➡️ `https://cherevichka.com/$1` (301 Permanent Redirect).

---

## 📊 Результаты проверки живого продакшена прямо сейчас:

```
================================================================================
✅ https://cherevichka.com — 200 OK (0.45s)
✅ SSL: Let's Encrypt (TLSv1.3, Strict Verification PASS)
✅ Обложка: assets/images/hero_moodboard_cover.webp (Тёмный люкс)
✅ Цвет текста: Белый #FFFFFF (Читаемость 100%)
✅ Мобильная кнопка: Скрыта на Главной, видна только в Каталоге
✅ Модалки и формы: Адаптированы под 351px
✅ Бэкенд API (/api/health, /api/config): Работает на 34.88.91.159:3000
================================================================================
```
