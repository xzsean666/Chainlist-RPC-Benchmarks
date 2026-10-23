import assert from 'node:assert';
import { sanitizeRpcEndpoints, FALLBACK_SONEIUM } from '../src/lib/chainlist.ts';

async function testChainlistScraping() {
  console.log('Testing live Chainlist.org scraping for Chain 1868...');
  const res = await fetch('https://chainlist.org/chain/1868', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  assert.strictEqual(res.status, 200, 'Chainlist request should return 200');
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, '__NEXT_DATA__ script tag should exist');

  const nextData = JSON.parse(match[1]);
  const chain = nextData?.props?.pageProps?.chain;
  assert.ok(chain, 'Chain object should exist in pageProps');
  assert.strictEqual(chain.chainId, 1868, 'Chain ID should be 1868');
  assert.ok(Array.isArray(chain.rpc), 'chain.rpc should be an array');
  assert.ok(chain.rpc.length >= 7, `Expected at least 7 RPCs, found ${chain.rpc.length}`);

  console.log(`Found ${chain.rpc.length} raw RPCs for Chain 1868:`);
  for (const r of chain.rpc) {
    console.log(`  - ${r.url || r} (tracking: ${r.tracking || 'n/a'})`);
  }

  const sanitized = sanitizeRpcEndpoints(chain.rpc);
  assert.ok(sanitized.length >= 6, 'Sanitized RPCs should contain at least 6 valid HTTP endpoints');
  for (const r of sanitized) {
    assert.ok(r.url.startsWith('http'), `URL ${r.url} should be HTTP/HTTPS`);
    assert.ok(!r.url.endsWith('/'), `URL ${r.url} should not end with /`);
  }
  console.log(`Sanitized HTTP RPCs count: ${sanitized.length}`);
}

async function testSanitizer() {
  console.log('Testing sanitizeRpcEndpoints unit cases...');
  const sample = [
    { url: 'https://rpc.example.com/' },
    { url: 'https://rpc.example.com' }, // duplicate
    { url: 'wss://rpc.example.com/ws' }, // websocket
    { url: 'https://mainnet.infura.io/v3/${API_KEY}' }, // template key
    { url: 'https://rpc2.example.com' }
  ];

  const result = sanitizeRpcEndpoints(sample);
  assert.strictEqual(result.length, 2, 'Should only keep 2 valid unique HTTP RPCs');
  assert.strictEqual(result[0].url, 'https://rpc.example.com');
  assert.strictEqual(result[1].url, 'https://rpc2.example.com');
  console.log('Sanitizer unit test passed!');
}

async function run() {
  try {
    await testSanitizer();
    await testChainlistScraping();
    console.log('ALL CHAINLIST TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
