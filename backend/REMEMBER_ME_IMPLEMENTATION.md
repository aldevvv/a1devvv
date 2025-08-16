# Remember Me Implementation Documentation

## 📋 Overview

This document describes the implementation of "Remember Me" functionality in the authentication system. The Remember Me feature allows users to stay logged in for an extended period (30 days) instead of the default 7 days.

## 🔧 Implementation Details

### 1. Database Changes

#### Added `rememberMe` field to Session model:
```prisma
model Session {
  id          String   @id @default(uuid())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  refreshHash String
  userAgent   String?
  ipHash      String?
  rememberMe  Boolean  @default(false)  // NEW FIELD
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime @default(now())

  @@index([userId])
}
```

### 2. Backend Changes

#### LoginDto Update:
```typescript
export class LoginDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() username?: string;
  @MinLength(8) password: string;
  @IsOptional() @IsBoolean() rememberMe?: boolean; // NEW FIELD
}
```

#### TokenService Update:
```typescript
// Updated signRefresh to support rememberMe
signRefresh(payload: object, rememberMe = false) {
  const expiresIn = rememberMe 
    ? process.env.JWT_REFRESH_EXPIRES_REMEMBER ?? '30d'
    : process.env.JWT_REFRESH_EXPIRES ?? '7d';
  
  return this.jwt.signAsync(payload, {
    secret: process.env.JWT_REFRESH_SECRET!,
    expiresIn,
  });
}

// Updated cookieOptionsRefresh to support rememberMe
cookieOptionsRefresh(rememberMe = false) {
  const maxAge = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
    : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
  
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
```

#### AuthService Update:
```typescript
async login(identifier: { email?: string; username?: string }, password: string, rememberMe = false, ua?: string, ip?: string) {
  // ... existing validation ...
  
  // Issue tokens with remember me support
  const accessToken = await this.tokens.signAccess({ sub: user.id });
  const refreshToken = await this.tokens.signRefresh({ sub: user.id, ver: genRandomToken(8) }, rememberMe);

  // Store refresh (hash) with dynamic expiration based on rememberMe
  const refreshHash = sha256(refreshToken);
  const expirationTime = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
    : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
  const expiresAt = new Date(Date.now() + expirationTime);

  await this.prisma.session.create({
    data: {
      userId: user.id,
      refreshHash,
      userAgent: ua,
      ipHash: ip ? sha256(ip) : null,
      rememberMe,  // Store rememberMe setting
      expiresAt,
    },
  });

  return { accessToken, refreshToken, user };
}

async refresh(oldRefreshToken: string, ua?: string, ip?: string) {
  // ... existing validation ...
  
  // Preserve rememberMe setting from original session
  const rememberMe = session.rememberMe;
  
  // Rotate with same rememberMe setting
  const accessToken = await this.tokens.signAccess({ sub: session.userId });
  const newRefresh = await this.tokens.signRefresh({ sub: session.userId, ver: genRandomToken(8) }, rememberMe);
  const newHash = sha256(newRefresh);
  
  // Calculate expiration based on rememberMe setting
  const expirationTime = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
    : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
  const expiresAt = new Date(Date.now() + expirationTime);

  // ... create new session with preserved rememberMe setting ...
}
```

#### AuthController Update:
```typescript
@Post('login')
async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const id = dto.email ? { email: dto.email } : { username: dto.username! };
  const rememberMe = dto.rememberMe || false;
  
  const { accessToken, refreshToken, user } = await this.auth.login(id, dto.password, rememberMe, req.headers['user-agent'], req.ip);
  
  // Set cookies with appropriate expiration based on rememberMe
  res.cookie('access_token', accessToken, this.tokens.cookieOptionsAccess());
  res.cookie('refresh_token', refreshToken, this.tokens.cookieOptionsRefresh(rememberMe));
  
  return { user: { id: user.id, fullName: user.fullName, email: user.email, username: user.username } };
}
```

### 3. Environment Variables

Add these to your `.env` file:

```bash
JWT_ACCESS_EXPIRES="10m"  # Access token expiration
JWT_REFRESH_EXPIRES="7d"  # Regular refresh token expiration
JWT_REFRESH_EXPIRES_REMEMBER="30d"  # Remember me refresh token expiration
```

### 4. Frontend Integration

The frontend login form already includes the Remember Me checkbox:

```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  rememberMe: false,  // This is already present
});

// Login API call (already implemented correctly)
const response = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: formData.email.includes('@') ? formData.email : undefined,
    username: !formData.email.includes('@') ? formData.email : undefined,
    password: formData.password,
    rememberMe: formData.rememberMe,  // This will now work
  }),
});
```

## 🔒 Security Features

### Token Expiration Strategy:
- **Access Token**: Always 10 minutes (short-lived for security)
- **Refresh Token (Regular)**: 7 days
- **Refresh Token (Remember Me)**: 30 days

### Session Tracking:
- `rememberMe` flag is stored in database for proper tracking
- Session expiration is preserved during token refresh
- All sessions are properly invalidated on password reset

### Cookie Security:
- `httpOnly`: Prevents XSS attacks
- `secure`: HTTPS only in production
- `sameSite: 'lax'`: CSRF protection
- Dynamic `maxAge`: Matches token expiration

## 🧪 Testing

### Manual Testing:

1. **Start the backend server**:
   ```bash
   npm run start:dev
   ```

2. **Run the PowerShell test**:
   ```powershell
   ./test-remember-me.ps1
   ```

3. **Or run the Node.js test**:
   ```bash
   node test-remember-me.js
   ```

### Expected Results:

- **Regular Login**: Refresh token expires in 7 days
- **Remember Me Login**: Refresh token expires in 30 days
- **Token Refresh**: Preserves original rememberMe setting

## 📊 Database Migration

The migration was automatically created and applied:

```sql
-- CreateTable: Add rememberMe column to Session table
ALTER TABLE "Session" ADD COLUMN "rememberMe" BOOLEAN NOT NULL DEFAULT false;
```

## 🔄 Compatibility

- **Existing Sessions**: Will work normally with `rememberMe = false` by default
- **Frontend**: No breaking changes, checkbox was already present
- **API**: Backward compatible, `rememberMe` field is optional

## 📝 Usage Examples

### Frontend Login with Remember Me:
```javascript
const loginData = {
  email: "user@example.com",
  password: "userpassword",
  rememberMe: true  // 30-day session
};
```

### Backend Session Check:
```typescript
// Check if current session has remember me enabled
const session = await prisma.session.findFirst({
  where: { refreshHash: hashedToken },
  select: { rememberMe: true, expiresAt: true }
});

console.log(`Remember Me: ${session.rememberMe}`);
console.log(`Expires: ${session.expiresAt}`);
```

## 🔧 Troubleshooting

### Common Issues:

1. **Tokens still expire in 7 days**: Check if `rememberMe` field is properly passed from frontend
2. **Database error**: Run migration: `npx prisma migrate dev`
3. **Environment variables**: Ensure JWT expiration variables are set
4. **Cookie issues**: Check browser developer tools for cookie max-age

### Verification:

1. Check database sessions table for `rememberMe` field
2. Inspect browser cookies for correct `Max-Age` values
3. Test with both `rememberMe: true` and `rememberMe: false`

## ✅ Implementation Status

- [x] Database schema updated
- [x] Backend authentication service updated
- [x] Token service updated
- [x] Controller updated
- [x] Frontend integration verified
- [x] Migration applied
- [x] Tests created
- [x] Documentation complete

The Remember Me functionality is now fully implemented and ready for production use!
