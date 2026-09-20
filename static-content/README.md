# Static Content Origin

Serves public static assets, images, media uploads, fonts, and client build bundles.

## Setup
In production, this represents an S3-compatible Object Storage Bucket (AWS S3, Google Cloud Storage, or MinIO) with a CDN distribution placed in front.

## Storage Structure
```
static-content/
├── assets/
│   ├── images/
│   └── fonts/
├── media/
│   └── uploads/
├── nginx.conf
└── Dockerfile
```
