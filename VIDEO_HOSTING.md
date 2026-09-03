# Basair Video Hosting Architecture

## Production architecture

```text
Firebase Spark
├── Authentication
├── Firestore metadata only
└── No Firebase Storage

External media host / CDN
├── video.mp4
├── poster.webp
└── public HTTPS URLs

Basair website
└── HTML5 <video> / YouTube embed
```

Firestore stores only lightweight metadata. The current admin panel keeps video metadata inside `site_content/public.videos` for backward compatibility with the existing site. A video item may look like:

```json
{
  "title": "فضل تعلم القرآن",
  "category": "quran",
  "videoUrl": "https://cdn.example.com/video.mp4",
  "posterUrl": "https://cdn.example.com/poster.webp",
  "published": true
}
```

## Can the video remain only on my personal computer?

Not for a normal public website. A visitor's browser cannot read a file that exists only on your PC. To make it public, the file needs an HTTPS URL reachable from the Internet.

Technically, a personal PC can be turned into a public server, but then the PC must remain online, reachable from the Internet, correctly secured, and served through HTTPS. That is not recommended for Basair production.

## Recommended workflow

1. Keep the original video on your computer as your master copy.
2. Upload a delivery copy to an external object-storage/CDN or video-hosting provider.
3. Make the file publicly readable (or use a stable CDN URL).
4. Copy the public `https://...` video URL.
5. Upload the poster to the same provider and copy its `https://...` URL.
6. In Basair Admin → Videos, save the title, category, video URL, poster URL, and publication state.
7. Firestore stores only those metadata fields.

## Direct video requirements

For reliable HTML5 playback, the external host should:

- serve the file over HTTPS;
- return a correct media `Content-Type` such as `video/mp4`;
- support HTTP byte/range requests so seeking works well;
- keep the public URL stable;
- allow normal browser playback from the Basair site.

MP4 (H.264/AAC) is the safest direct-delivery format for broad browser support. WebM is also supported by modern browsers.

YouTube links remain supported and open inside the Basair player.

## What must NOT go to Firestore/GitHub

Do not upload large media binaries to Firestore or GitHub. `.gitignore` blocks common video extensions in this project to reduce the chance of accidental commits.
