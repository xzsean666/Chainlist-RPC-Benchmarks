import assert from 'node:assert';

const PRIMARY_URL = process.env.LIVE_URL || 'https://chainlist-rpc-benchmarks.pages.dev';
const BACKUP_URL = 'https://5b981626.chainlist-rpc-benchmarks.pages.dev';

async function resolveWorkingUrl() {
  console.log(`Checking live endpoint availability: ${PRIMARY_URL}`);
  try {
    const res = await fetch(PRIMARY_URL, { method: 'HEAD' });
    if (res.ok) {
      console.log(`✓ Primary URL is online: ${PRIMARY_URL}`);
      return PRIMARY_URL;
    }
  } catch (e) {
    console.log(`Primary URL DNS warming up, testing deployment hash URL: ${BACKUP_URL}`);
  }

  const res = await fetch(BACKUP_URL, { method: 'HEAD' });
  if (res.ok) {
    console.log(`✓ Deployment hash URL is online: ${BACKUP_URL}`);
    return BACKUP_URL;
  }
  throw new Error('Neither primary nor backup Cloudflare Pages URLs are responding');
}

async function runE2eChecks() {
  console.log('========================================================');
  console.log('  STARTING CLOUDFLARE PAGES LIVE ONLINE E2E TESTS');
  console.log('========================================================\n');

  const liveBaseUrl = await resolveWorkingUrl();

  // Test 1: Root HTML & Assets Check
  console.log('\n[E2E Test 1/4] Verifying Live Frontend SPA Root HTML...');
  const rootRes = await fetch(liveBaseUrl);
  assert.strictEqual(rootRes.status, 200, 'Root URL must return HTTP 200');
  const html = await rootRes.text();
  assert.ok(html.includes('<title>'), 'HTML must contain title');
  assert.ok(html.includes('Chainlist RPC Benchmarks'), 'HTML title must mention Chainlist RPC Benchmarks');
  assert.ok(html.includes('/assets/index-'), 'HTML must include built assets');
  console.log('✓ Live Root HTML verified. SPA bundle tags present.');

  // Test 2: Edge Function /api/chain/1868 Check
  console.log('\n[E2E Test 2/4] Verifying Cloudflare Edge Function (/api/chain/1868)...');
  const edgeApiUrl = `${liveBaseUrl}/api/chain/1868`;
  const edgeRes = await fetch(edgeApiUrl);
  assert.strictEqual(edgeRes.status, 200, 'Edge API /api/chain/1868 must return HTTP 200');

  const corsHeader = edgeRes.headers.get('access-control-allow-origin');
  assert.strictEqual(corsHeader, '*', 'Edge API must return Access-Control-Allow-Origin: *');

  const data = await edgeRes.json();
  assert.ok(data.source, 'Response must indicate data source');
  assert.ok(data.data, 'Response must contain data payload');
  assert.strictEqual(data.data.chainId, 1868, 'Chain ID must be 1868');
  assert.strictEqual(data.data.name, 'Soneium', 'Chain name must be Soneium');
  assert.ok(Array.isArray(data.data.rpc), 'data.rpc must be an array');
  assert.ok(data.data.rpc.length >= 6, `Expected at least 6 RPCs, received ${data.data.rpc.length}`);

  console.log(`✓ Live Edge Function returned valid Soneium data from source: [${data.source}]`);
  console.log(`  RPC endpoints returned: ${data.data.rpc.length}`);
  data.data.rpc.slice(0, 5).forEach((r) => {
    console.log(`  - ${r.url} (tracking: ${r.tracking || 'n/a'})`);
  });

  // Test 3: Edge Function CORS OPTIONS preflight
  console.log('\n[E2E Test 3/4] Verifying CORS OPTIONS Preflight Handshake...');
  const optionsRes = await fetch(edgeApiUrl, { method: 'OPTIONS' });
  assert.strictEqual(optionsRes.status, 204, 'OPTIONS preflight should return 204 No Content');
  assert.strictEqual(optionsRes.headers.get('access-control-allow-origin'), '*');
  assert.ok(optionsRes.headers.get('access-control-allow-methods')?.includes('GET'));
  console.log('✓ CORS OPTIONS preflight passed.');

  // Test 4: Live RPC Execution against endpoints returned by Edge Function
  console.log('\n[E2E Test 4/4] Executing Live RPC Benchmarks on endpoints returned by Cloudflare...');
  const probeUrls = data.data.rpc
    .map((r) => r.url)
    .filter((url) => url.startsWith('http'))
    .slice(0, 4);

  let successCount = 0;
  for (const url of probeUrls) {
    try {
      const start = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
        signal: AbortSignal.timeout(6000),
      });

      const latency = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const block = parseInt(json.result, 16);
          console.log(`  ✓ ${url} -> Block #${block} (${latency}ms)`);
          successCount++;
        } else {
          console.log(`  ⚠️ ${url} -> RPC returned error/null result:`, json);
        }
      } else {
        console.log(`  ⚠️ ${url} -> HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`  ⚠️ ${url} -> ${e.message}`);
    }
  }

  assert.ok(successCount >= 1, 'At least 1 live RPC endpoint must successfully respond with block number');
  console.log(`✓ Real-world live RPC calls succeeded: ${successCount} endpoints active.`);

  console.log('\n========================================================');
  console.log('🎉 ALL CLOUDFLARE PAGES LIVE ONLINE E2E TESTS PASSED!');
  console.log(`🌐 Live Site: ${liveBaseUrl}`);
  console.log(`⚡ Edge API:  ${liveBaseUrl}/api/chain/1868`);
  console.log('========================================================\n');
}

runE2eChecks().catch((err) => {
  console.error('\n❌ Live E2E Verification Failed:', err);
  process.exit(1);
});
