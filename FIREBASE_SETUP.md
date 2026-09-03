# Basair Firebase setup — `basair-academy-4a1d0`

All website/admin Firebase client files and Firebase CLI files in this release target the same project: `basair-academy-4a1d0`.

## 1) Local admin login: fix `localhost:3000` being blocked

If the admin page shows an error containing:

```text
auth/requests-from-referer-http://localhost:3000-are-blocked
```

this is not a wrong-password error. The request is being blocked by the remote Google/Firebase project configuration.

For local development only:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add `localhost`.
2. Google Cloud Console → project `basair-academy-4a1d0` → **APIs & Services** → **Credentials** → open the Web API key used by this web app.
3. Under **Application restrictions / Websites**, allow `http://localhost:3000/*` (and `http://localhost:3000` if the console requires the origin form too).
4. Under **API restrictions**, make sure the Firebase Authentication APIs required by the web app are permitted, especially **Identity Toolkit API** (`identitytoolkit.googleapis.com`) and **Token Service API** (`securetoken.googleapis.com`).
5. Save, wait a few minutes for propagation, then reload `http://localhost:3000/admin.html`.

For production, authorize the actual deployed domain (for example `basaira.github.io`). Remove localhost later if you do not want production credentials usable from local pages.

## 2) Firestore rules deployment: fix HTTP 403

If deployment reports:

```text
Caller does not have required permission to use project basair-academy-4a1d0
```

that is a Google Cloud IAM/account problem. A ZIP file cannot grant itself IAM roles.

Check which Firebase CLI account is active:

```bat
npx firebase-tools@15.28.1 login:list
npx firebase-tools@15.28.1 projects:list
```

If it is not the Google account that owns `basair-academy-4a1d0`, re-authenticate:

```bat
npx firebase-tools@15.28.1 logout
npx firebase-tools@15.28.1 login
```

Then run:

```bat
deploy-firestore-rules.bat
```

If 403 remains with the intended account, grant that account sufficient IAM permissions on the Google Cloud project. The error specifically requires `serviceusage.services.use`, which is included in **Service Usage Consumer**. The account must also be allowed to deploy Firebase/Firestore rules. Using the project Owner account for the deployment is the simplest diagnostic test.

## 3) Enable administrator sign-in

Firebase Console → Authentication → Sign-in method:

- Enable **Email/Password** for email/password login.
- Enable **Google** for Google login.

## 4) Grant the administrator role

The site does not auto-promote authenticated users to admins.

1. Create/sign in the administrator account in Firebase Authentication.
2. Copy its UID.
3. In Firestore create `admin_roles/<UID>` with:

```text
active: true
```

Authentication proves identity; `admin_roles/<UID>` grants the admin authorization used by the rules.

## 5) Assessment requests

New forms write to `assessment_requests`. A compatibility fallback writes to `enrollment_requests` only if old production rules still reject `assessment_requests`. The admin page reads both collections.

After rules are deployed, submit one real assessment form and verify it appears in Admin → Requests.

## 6) Verify the build

```bat
npm ci
npm run lint
npm run build
npm run dev
```

Then test:

```text
http://localhost:3000/
http://localhost:3000/admin.html
```


## Video storage

Basair does **not** use Firebase Storage for videos. Firebase is limited to Authentication and Firestore metadata. Video files and poster images must be hosted by an external media host/CDN and entered in the Admin panel as public HTTPS URLs. See `VIDEO_HOSTING.md`.

## Security changes in the 2026-08-24 secure release

This release intentionally closes the previous public fallback surfaces:

- Public creation in `enrollment_requests` is disabled. Existing legacy documents remain available to active admins.
- `settings` is no longer public-readable/public-writable.
- Public assessment writes are accepted only through the validated `assessment_requests` schema.
- Attribution maps are allow-listed and length-limited.
- Server timestamps are validated against the Firestore request time.

After deploying this release, redeploy the included rules:

```bat
deploy-firestore-rules.bat
```

For higher-volume public traffic, enable Firebase App Check and add backend rate limiting / Turnstile if abuse appears. Client-side cooldowns and honeypots are only supplementary controls.

## لوحة الإدارة في إصدار 2026-08-25
بعد تسجيل الدخول بحساب مدير فعّال في `admin_roles/{UID}` تستطيع اللوحة إدارة:
- النصوص العامة في الموقع الرئيسي وصفحات EN/RU/UZ من فهرس محتوى ثابت وآمن؛ Firestore يحفظ التعديلات فقط.
- روابط التواصل العامة (WhatsApp وTelegram) من موضع واحد، مع إبقاء نص رسالة كل مسار.
- بيانات الفيديو الخارجية (`title`, `category`, `videoUrl`, `posterUrl`, `published`) من دون Firebase Storage.
- حالات طلبات التقييم/الالتحاق.
- سجل تغييرات إداري غير قابل للتعديل أو الحذف من الواجهة.

لا تسمح اللوحة بتحرير HTML/CSS/JavaScript أو قواعد Firestore من قاعدة البيانات. هذا قيد أمني مقصود، لأن الكود التنفيذي يجب أن يبقى تحت مراجعة المستودع لا تحت حقل محتوى في Firestore.

بعد ترقية هذه النسخة أعد نشر القواعد:
```bat
deploy-firestore-rules.bat
```
