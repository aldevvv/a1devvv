# Supabase Storage Setup Guide

This guide explains how to set up Supabase Storage for handling source code file uploads and downloads in the backend.

## Prerequisites

1. A Supabase project already created
2. Access to your Supabase Dashboard
3. Service Role Key from your Supabase project

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **New bucket**
4. Create a bucket with the following settings:
   - **Name**: `source-codes`
   - **Public bucket**: `OFF` (Keep it private)
   - **File size limit**: `100MB` (or adjust as needed)
   - **Allowed MIME types**: Leave empty to allow all types

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
# Supabase Storage Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key-here"
API_BASE_URL="http://localhost:3001"  # Your backend URL
```

### Getting Your Credentials:

1. **SUPABASE_URL**: Found in Settings > API in your Supabase Dashboard
2. **SUPABASE_SERVICE_KEY**: Found in Settings > API > Service role key (secret)
   - ⚠️ **IMPORTANT**: Never expose this key to the client/frontend
   - This key bypasses Row Level Security (RLS) and has full access

## Step 3: Storage Structure

The storage system organizes files in the following structure:

```
source-codes/
├── 2024/
│   ├── 01/
│   │   ├── unique-file-1.zip
│   │   └── unique-file-2.rar
│   └── 02/
│       └── unique-file-3.zip
└── 2025/
    └── 01/
        └── unique-file-4.tar.gz
```

Files are organized by year and month for better management.

## Step 4: How It Works

### File Upload Process

1. Admin uploads a source code file via the API
2. File is validated (size, extension)
3. A secure filename is generated using UUID
4. File is uploaded to Supabase Storage with year/month folder structure
5. The storage path is encrypted and saved in the database

### File Download Process

1. When a customer purchases a product with source code
2. Backend generates a signed URL using Supabase Storage
3. Signed URL is valid for 24 hours (configurable)
4. Customer receives the signed URL to download directly from Supabase
5. No streaming through backend needed - direct download from Supabase CDN

## Step 5: Security Features

### Encryption
- Storage paths are encrypted in the database using AES-256-GCM
- Only the backend can decrypt the actual storage path

### Access Control
- Bucket is private (not publicly accessible)
- Service Role Key is used for backend operations
- Signed URLs provide temporary, secure access to files

### File Validation
- Maximum file size: 100MB
- Allowed extensions: `.zip`, `.rar`, `.7z`, `.tar`, `.gz`
- Files are renamed with secure UUIDs to prevent guessing

## Step 6: API Endpoints

### Upload Source File
```typescript
POST /api/admin/products/:id/upload-source
Content-Type: multipart/form-data

Body: 
- file: [binary file data]
```

### Generate Download Link (Internal)
The system automatically generates signed URLs when delivering products to customers.

## Step 7: Testing

1. Upload a test file:
```bash
curl -X POST \
  http://localhost:3001/api/admin/products/{product-id}/upload-source \
  -H "Authorization: Bearer {admin-token}" \
  -F "file=@test-source.zip"
```

2. The response will include the encrypted storage path
3. When a customer purchases, they'll receive a signed URL valid for 24 hours

## Step 8: Monitoring & Maintenance

### Storage Usage
- Monitor storage usage in Supabase Dashboard > Storage
- Set up alerts for storage limits

### Cleanup Old Files
- Implement a cleanup job for orphaned files
- Delete files when products are removed

### Backup Strategy
- Supabase automatically backs up your storage
- Consider additional backups for critical source code files

## Troubleshooting

### Common Issues

1. **"Failed to upload file"**
   - Check SUPABASE_SERVICE_KEY is correct
   - Verify bucket exists and name matches
   - Check file size and extension

2. **"Failed to generate download link"**
   - Ensure file exists in storage
   - Check if service key has proper permissions
   - Verify SUPABASE_URL is correct

3. **Download links expire too quickly**
   - Adjust `downloadLinkExpiry` in FileStorageService
   - Default is 24 hours (86400 seconds)

## Best Practices

1. **Never expose Service Role Key** to the client
2. **Use signed URLs** for temporary access
3. **Implement rate limiting** for download endpoints
4. **Monitor storage usage** regularly
5. **Log all file operations** for audit trails
6. **Validate files** before upload
7. **Use encryption** for sensitive paths

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security)
- [Signed URLs Guide](https://supabase.com/docs/guides/storage/uploads#signed-urls)
