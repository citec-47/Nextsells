# Database Connection Troubleshooting Guide

## Issues Fixed

### 1. **Connection Timeout (CRITICAL)**
**Problem**: `Error: Connection terminated due to connection timeout`
- **Cause**: `connectionTimeoutMillis: 2000` (2 seconds) was too short
- **Solution**: Increased to `15000` (15 seconds)

### 2. **PostgreSQL SSL Warning**
**Problem**: 
```
SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' 
are treated as aliases for 'verify-full'
```
- **Cause**: Connection string missing explicit `sslmode` parameter
- **Solution**: Added automatic `sslmode=require` to connection string if not present

### 3. **No Retry Logic**
**Problem**: Single failed connection attempt would cause immediate failure
- **Solution**: Added automatic retry logic with exponential backoff (up to 3 attempts)

### 4. **Suboptimal Pool Configuration**
**Problem**: No minimum pool size, no statement timeout
- **Solution**: Added `min: 2` for persistent connections and `statement_timeout: 30000`

## Updated Configuration

```typescript
// Key improvements in lib/db.ts:
const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 20,                        // Maximum connections
  min: 2,                         // Minimum persistent connections
  idleTimeoutMillis: 30000,       // 30s idle timeout
  connectionTimeoutMillis: 15000, // 15s connection timeout (was 2s)
  statement_timeout: 30000,       // 30s query timeout
  application_name: 'aliexpress-clone',
});

// Auto-retry logic with exponential backoff
export async function query(text: string, params?: unknown[], retries = 3) {
  // Automatically retries up to 3 times on connection errors
  // with exponential backoff (1s, 2s, 5s max)
}
```

## Monitoring & Diagnostics

### Test Database Connection
```bash
# Via health check endpoint
curl http://localhost:3000/api/health
```

Expected response (healthy):
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-24T..."
}
```

## Environment Setup

Ensure your `.env.local` has the correct DATABASE_URL:

```env
# For Neon PostgreSQL:
DATABASE_URL=postgresql://user:password@host:5432/database

# The driver will automatically add ?sslmode=require if missing
```

## Common Causes of Connection Timeouts

1. **Database Server Down**: Check if your PostgreSQL server is running
   ```bash
   psql -U postgres -h your-host -c "SELECT 1;"
   ```

2. **Network Issues**: Firewall blocking connections
   - Check port 5432 is accessible
   - Verify security groups/firewall rules

3. **Connection Pool Exhaustion**: Too many simultaneous connections
   - Check pool settings in `lib/db.ts`
   - Monitor active connections

4. **Database Server Overload**: Check server resources
   - CPU usage
   - Memory usage
   - Number of active connections

5. **Query Too Slow**: Query timeout (30s default)
   - Check slow queries
   - Add indexes to large tables
   - Optimize complex queries

## Performance Tuning

### Increase Timeouts (if needed)
```typescript
// For long-running batch operations
connectionTimeoutMillis: 30000,  // 30 seconds
statement_timeout: 60000,        // 60 seconds
```

### Monitor Connection Pool
```typescript
// Add pool event listeners
pool.on('connect', () => console.log('Connection established'));
pool.on('error', (err) => console.error('Pool error:', err));
```

### Test Query Performance
```typescript
// The query function logs duration automatically:
// "Executed query { text: '...', duration: 145, rows: 1 }"
```

## Recovery Steps

If you continue experiencing issues:

1. **Restart Application**
   ```bash
   npm run dev
   ```

2. **Test Database Connection**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Check Logs** for specific error messages

4. **Verify Credentials** in .env.local

5. **Check Database Server** capacity and status

6. **Review Recent Changes** to queries or schema

## Next Steps

- Monitor the health check endpoint during load testing
- Consider connection pooling service (eg. PgBouncer) for production
- Set up alerts for connection failures
- Review slow query logs regularly
- Profile database performance under expected load
