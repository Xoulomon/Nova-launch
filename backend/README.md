# Metadata API

API endpoints for uploading and retrieving token metadata to/from IPFS.

## Setup

```bash
cd backend
npm install
```

### Environment Variables

Create `.env.local`:

```env
PINATA_API_KEY=your_api_key
PINATA_API_SECRET=your_api_secret
```

## API Endpoints

### POST /api/metadata/upload

Upload metadata and image to IPFS.

**Body (FormData):**
- `name` (string, required): Token name
- `symbol` (string, required): Token symbol
- `decimals` (number, required): Token decimals
- `description` (string, optional): Token description
- `image` (File, optional): Token image (max 5MB, JPEG/PNG/GIF/WebP)
- `properties` (JSON string, optional): Additional metadata

**Response:**
```json
{
  "success": true,
  "cid": "QmXyZ..."
}
```

### GET /api/metadata/[cid]

Retrieve metadata from IPFS.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Token Name",
    "symbol": "TKN",
    "description": "...",
    "image": "ipfs://...",
    "decimals": 18,
    "properties": {}
  }
}
```

## Development

```bash
npm run dev   # Start dev server on port 3001
npm test      # Run tests
```

## Features

- ✅ File size validation (max 5MB)
- ✅ Image type validation (JPEG, PNG, GIF, WebP)
- ✅ Metadata format validation
- ✅ IPFS upload via Pinata
- ✅ Response caching (1 hour)
- ✅ Error handling
