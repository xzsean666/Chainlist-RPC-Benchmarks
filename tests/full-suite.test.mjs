import assert from 'node:assert';
import {
  calculatePercentiles,
  calculateRpcScore,
  createInitialRpcStats,
  updateRpcStatsWithResult,
  recalculateLeaderboard,
  generateNodeAdvisory,
} from '../src/lib/benchmark/metrics.ts';
import { testRpcEndpoint } from '../src/lib/benchmark/rpcClient.ts';
import { sanitizeRpcEndpoints, FALLBACK_SONEIUM } from '../src/lib/chainlist.ts';

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name} failed:`, err);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name} failed:`, err);
    throw err;
  }
}

async function main() {
  console.log('\n========================================');
  console.log(' RUNNING FULL AUTOMATED TEST SUITE');
  console.log('========================================\n');

  // --- Suite 1: Sanitizer & Data Normalization ---
  console.log('1. Sanitizer & Endpoint Normalizer:');
  runTest('Deduplicates identical URLs ignoring case and trailing slashes', () => {
    const input = [
      { url: 'https://rpc.soneium.org/' },
      { url: 'https://rpc.soneium.org' },
      { url: 'HTTPS://RPC.SONEIUM.ORG/' },
      { url: 'https://soneium.drpc.org/' },
    ];
    const result = sanitizeRpcEndpoints(input);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].url, 'https://rpc.soneium.org');
    assert.strictEqual(result[1].url, 'https://soneium.drpc.org');
  });

  runTest('Filters out WebSocket (ws://, wss://) and API key templates', () => {
    const input = [
      { url: 'wss://soneium.drpc.org' },
      { url: 'ws://node.internal' },
      { url: 'https://rpc.infura.io/v3/${API_KEY}' },
      { url: 'https://valid.rpc.com' },
    ];
    const result = sanitizeRpcEndpoints(input);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].url, 'https://valid.rpc.com');
  });

  runTest('Fallback Soneium dataset has valid structure and RPC endpoints', () => {
    assert.strictEqual(FALLBACK_SONEIUM.chainId, 1868);
    assert.strictEqual(FALLBACK_SONEIUM.name, 'Soneium');
    assert.ok(FALLBACK_SONEIUM.rpc.length >= 7);
    const sanitized = sanitizeRpcEndpoints(FALLBACK_SONEIUM.rpc);
    assert.ok(sanitized.length >= 6);
  });

  // --- Suite 2: Statistical & Latency Percentiles ---
  console.log('\n2. Statistical & Percentile Calculations:');
  runTest('Empty latencies array returns zeros', () => {
    const res = calculatePercentiles([]);
    assert.deepStrictEqual(res, { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 });
  });

  runTest('Single latency sample matches all percentiles', () => {
    const res = calculatePercentiles([250]);
    assert.strictEqual(res.min, 250);
    assert.strictEqual(res.max, 250);
    assert.strictEqual(res.avg, 250);
    assert.strictEqual(res.p50, 250);
    assert.strictEqual(res.p95, 250);
    assert.strictEqual(res.p99, 250);
  });

  runTest('Accurately computes P50, P95, P99 on even distribution', () => {
    // 100 samples from 1 to 100
    const samples = Array.from({ length: 100 }, (_, i) => i + 1);
    const res = calculatePercentiles(samples);
    assert.strictEqual(res.min, 1);
    assert.strictEqual(res.max, 100);
    assert.strictEqual(res.avg, 51); // (1+100)*100 / 200 = 50.5 -> 51
    assert.strictEqual(res.p50, 51);
    assert.ok(res.p95 >= 95 && res.p95 <= 96);
    assert.ok(res.p99 >= 99);
  });

  // --- Suite 3: Multi-factor Scoring Algorithm ---
  console.log('\n3. Multi-Factor Scoring Formula:');
  runTest('Zero success calls yields score 0', () => {
    const score = calculateRpcScore(0, 0, null, 0);
    assert.strictEqual(score, 0);
  });

  runTest('Optimal node (100% avail, 40ms latency, 0 block lag) scores 100', () => {
    const score = calculateRpcScore(100, 40, 0, 10);
    assert.strictEqual(score, 100);
  });

  runTest('Deducts points appropriately for high latency', () => {
    const lowLatency = calculateRpcScore(100, 50, 0, 10);
    const midLatency = calculateRpcScore(100, 300, 0, 10);
    const highLatency = calculateRpcScore(100, 1500, 0, 10);
    assert.ok(lowLatency > midLatency, 'Low latency should score higher than mid');
    assert.ok(midLatency > highLatency, 'Mid latency should score higher than high');
  });

  runTest('Deducts points appropriately for block height lag', () => {
    const headNode = calculateRpcScore(100, 80, 0, 10);
    const lagging1Block = calculateRpcScore(100, 80, 1, 10);
    const lagging5Blocks = calculateRpcScore(100, 80, 5, 10);
    const lagging20Blocks = calculateRpcScore(100, 80, 20, 10);

    assert.ok(headNode > lagging1Block, 'Head node should beat 1-block lag');
    assert.ok(lagging1Block > lagging5Blocks, '1-block lag should beat 5-block lag');
    assert.ok(lagging5Blocks > lagging20Blocks, '5-block lag should beat 20-block lag');
  });

  // --- Suite 4: Leaderboard Recalculation & Relative Block Lag ---
  console.log('\n4. Leaderboard Recalculation & Head Block Lag:');
  runTest('Correctly identifies maximum block and calculates relative lag across endpoints', () => {
    const statFast = createInitialRpcStats('https://rpc-fast.io');
    const statSlow = createInitialRpcStats('https://rpc-slow.io');
    const statDead = createInitialRpcStats('https://rpc-dead.io');

    const updatedFast = updateRpcStatsWithResult(
      statFast,
      {
        url: 'https://rpc-fast.io',
        timestamp: Date.now(),
        latencyMs: 60,
        success: true,
        blockNumber: 5000000,
        chainId: 1868,
        errorCategory: 'NONE',
        mode: 'DIRECT',
      },
      null
    );

    const updatedSlow = updateRpcStatsWithResult(
      statSlow,
      {
        url: 'https://rpc-slow.io',
        timestamp: Date.now(),
        latencyMs: 120,
        success: true,
        blockNumber: 4999992, // 8 blocks behind
        chainId: 1868,
        errorCategory: 'NONE',
        mode: 'DIRECT',
      },
      null
    );

    const updatedDead = updateRpcStatsWithResult(
      statDead,
      {
        url: 'https://rpc-dead.io',
        timestamp: Date.now(),
        latencyMs: 5000,
        success: false,
        blockNumber: null,
        chainId: null,
        error: 'Timeout',
        errorCategory: 'TIMEOUT',
        mode: 'DIRECT',
      },
      null
    );

    const board = recalculateLeaderboard({
      'https://rpc-fast.io': updatedFast,
      'https://rpc-slow.io': updatedSlow,
      'https://rpc-dead.io': updatedDead,
    });

    assert.strictEqual(board.maxBlockNumber, 5000000);
    assert.strictEqual(board.updatedStats['https://rpc-fast.io'].blockLag, 0);
    assert.strictEqual(board.updatedStats['https://rpc-fast.io'].avgBlockLag, 0);
    assert.strictEqual(board.updatedStats['https://rpc-fast.io'].isHighestBlock, true);

    assert.strictEqual(board.updatedStats['https://rpc-slow.io'].blockLag, 8);
    assert.strictEqual(board.updatedStats['https://rpc-slow.io'].avgBlockLag, 8);
    assert.strictEqual(board.updatedStats['https://rpc-slow.io'].isHighestBlock, false);

    assert.strictEqual(board.updatedStats['https://rpc-dead.io'].blockLag, null);
    assert.strictEqual(board.updatedStats['https://rpc-dead.io'].avgBlockLag, null);
    assert.strictEqual(board.updatedStats['https://rpc-dead.io'].score, 0);

    // Ranks: fast = #1, slow = #2, dead = #3
    assert.strictEqual(board.rankedUrls[0], 'https://rpc-fast.io');
    assert.strictEqual(board.rankedUrls[1], 'https://rpc-slow.io');
    assert.strictEqual(board.rankedUrls[2], 'https://rpc-dead.io');

    assert.strictEqual(board.updatedStats['https://rpc-fast.io'].rank, 1);
    assert.strictEqual(board.updatedStats['https://rpc-slow.io'].rank, 2);
    assert.strictEqual(board.updatedStats['https://rpc-dead.io'].rank, 3);
  });

  runTest('Average block lag does NOT falsely accumulate over time as blockchain advances', () => {
    let statSync = createInitialRpcStats('https://rpc-sync.org');
    let statLagging = createInitialRpcStats('https://rpc-lag.org');

    // Simulate 5 consecutive waves with new blocks minted each wave
    for (let wave = 1; wave <= 5; wave++) {
      const headBlock = 1000 + wave; // 1001, 1002, 1003, 1004, 1005

      // Node Sync is always at head (waveLag = 0)
      statSync = updateRpcStatsWithResult(
        statSync,
        {
          url: 'https://rpc-sync.org',
          timestamp: Date.now() + wave * 1000,
          latencyMs: 50,
          success: true,
          blockNumber: headBlock,
          chainId: 1868,
          errorCategory: 'NONE',
          mode: 'DIRECT',
          waveLag: 0,
        },
        headBlock
      );

      // Node Lagging is at head in waves 1, 2, 4, 5, but was 1 block behind in wave 3 (1002 instead of 1003)
      const lagBlock = wave === 3 ? headBlock - 1 : headBlock;
      statLagging = updateRpcStatsWithResult(
        statLagging,
        {
          url: 'https://rpc-lag.org',
          timestamp: Date.now() + wave * 1000,
          latencyMs: 80,
          success: true,
          blockNumber: lagBlock,
          chainId: 1868,
          errorCategory: 'NONE',
          mode: 'DIRECT',
          waveLag: headBlock - lagBlock,
        },
        headBlock
      );
    }

    const board = recalculateLeaderboard({
      'https://rpc-sync.org': statSync,
      'https://rpc-lag.org': statLagging,
    });

    // Node Sync MUST be exactly 0.00 average lag (NOT 10+ blocks!)
    assert.strictEqual(board.updatedStats['https://rpc-sync.org'].avgBlockLag, 0);
    assert.strictEqual(board.updatedStats['https://rpc-sync.org'].blockLag, 0);

    // Node Lagging has 1 lag out of 5 waves -> 1/5 = 0.20 blocks average lag!
    assert.strictEqual(board.updatedStats['https://rpc-lag.org'].avgBlockLag, 0.2);
    assert.strictEqual(board.updatedStats['https://rpc-lag.org'].blockLag, 0);
  });

  // --- Suite 5: Live Integration Probe ---
  console.log('\n5. Live Integration Network Probes:');
  await runAsyncTest('Live JSON-RPC eth_blockNumber against https://rpc.soneium.org', async () => {
    const res = await testRpcEndpoint({
      url: 'https://rpc.soneium.org',
      timeoutMs: 8000,
    });
    assert.strictEqual(res.success, true, 'Official Soneium RPC should return success');
    assert.ok(typeof res.blockNumber === 'number');
    assert.ok(res.blockNumber > 25000000, `Block number should be recent, got ${res.blockNumber}`);
    assert.ok(res.latencyMs > 0);
    console.log(`     (Live Soneium block #${res.blockNumber}, latency ${res.latencyMs}ms)`);
  });

  await runAsyncTest('Gracefully handles timeout abort on non-responsive host', async () => {
    // 192.0.2.1 is TEST-NET-1 (non-routable blackhole IP)
    const res = await testRpcEndpoint({
      url: 'http://192.0.2.1:8545',
      timeoutMs: 800,
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCategory, 'TIMEOUT');
    assert.ok(res.error?.includes('timed out'));
  });

  // --- Suite 6: Deep Capabilities & Advisory Diagnostics ---
  console.log('\n6. Deep Capabilities & Advisory Diagnostics:');
  runTest('generateNodeAdvisory assigns proper roles based on node traits', () => {
    // 1. Pruned node advisory
    const prunedAdv = generateNodeAdvisory({
      totalCalls: 10,
      availabilityRate: 100,
      latency: { min: 40, max: 80, avg: 50, p50: 50, p95: 70, p99: 80 },
      avgBlockLag: 0,
      blockLag: 0,
      capabilities: {
        archiveStatus: 'unsupported',
        corsDirect: true,
        chainIdMatch: true,
        methodsChecked: true,
      },
    });
    assert.strictEqual(prunedAdv.role, 'fast_lightweight');
    assert.ok(prunedAdv.badgeText.includes('极速轻量'));
    assert.ok(prunedAdv.developerAdvice.includes('历史交易回执'));

    // 2. Fresh block lag / -32001 node advisory
    const lagAdv = generateNodeAdvisory({
      totalCalls: 20,
      availabilityRate: 95,
      latency: { min: 100, max: 400, avg: 200, p50: 180, p95: 350, p99: 400 },
      avgBlockLag: 1.2,
      blockLag: 1,
      freshBlock: {
        checks: 10,
        success: 5,
        rate: 50,
        blockNotFoundCount: 5,
      },
    });
    assert.strictEqual(lagAdv.role, 'backup_retry');
    assert.ok(lagAdv.badgeText.includes('新块滞后'));
    assert.ok(lagAdv.developerAdvice.includes('退避重试'));

    // 3. Optimal primary node advisory
    const primaryAdv = generateNodeAdvisory({
      totalCalls: 30,
      availabilityRate: 100,
      latency: { min: 60, max: 180, avg: 120, p50: 110, p95: 160, p99: 180 },
      avgBlockLag: 0,
      blockLag: 0,
      capabilities: {
        archiveStatus: 'supported',
        corsDirect: true,
        chainIdMatch: true,
        methodsChecked: true,
      },
      freshBlock: {
        checks: 15,
        success: 15,
        rate: 100,
        blockNotFoundCount: 0,
      },
    });
    assert.strictEqual(primaryAdv.role, 'primary');
    assert.ok(primaryAdv.badgeText.includes('首选主读'));
  });

  runTest('updateRpcStatsWithResult correctly tracks fresh block -32001 errors & flapping', () => {
    let stat = createInitialRpcStats('https://test-node.io');

    // 1. Success call with fresh block -32001 error
    stat = updateRpcStatsWithResult(
      stat,
      {
        url: 'https://test-node.io',
        timestamp: 1000,
        latencyMs: 150,
        success: true,
        blockNumber: 100,
        chainId: 1868,
        errorCategory: 'NONE',
        mode: 'DIRECT',
        waveLag: 0,
        freshBlockReadable: false,
        freshBlockCode: -32001,
        freshBlockError: 'block not found',
      },
      100
    );

    assert.strictEqual(stat.freshBlock.checks, 1);
    assert.strictEqual(stat.freshBlock.success, 0);
    assert.strictEqual(stat.freshBlock.blockNotFoundCount, 1);
    assert.strictEqual(stat.freshBlock.rate, 0);

    // 2. Success call with readable fresh block
    stat = updateRpcStatsWithResult(
      stat,
      {
        url: 'https://test-node.io',
        timestamp: 2000,
        latencyMs: 140,
        success: true,
        blockNumber: 101,
        chainId: 1868,
        errorCategory: 'NONE',
        mode: 'DIRECT',
        waveLag: 0,
        freshBlockReadable: true,
      },
      101
    );

    assert.strictEqual(stat.freshBlock.checks, 2);
    assert.strictEqual(stat.freshBlock.success, 1);
    assert.strictEqual(stat.freshBlock.rate, 50);

    // 3. Cluster flapping (block number reversal 101 -> 99)
    stat = updateRpcStatsWithResult(
      stat,
      {
        url: 'https://test-node.io',
        timestamp: 3000,
        latencyMs: 140,
        success: true,
        blockNumber: 99,
        chainId: 1868,
        errorCategory: 'NONE',
        mode: 'DIRECT',
        waveLag: 2,
      },
      101
    );

    assert.strictEqual(stat.flapping.flappingCount, 1);
    assert.strictEqual(stat.flapping.lastReversalFrom, 101);
    assert.strictEqual(stat.flapping.lastReversalTo, 99);
  });

  console.log('\n========================================');
  console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('========================================\n');
}

main().catch((e) => {
  console.error('\nTest suite execution failed:', e);
  process.exit(1);
});
