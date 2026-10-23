import assert from 'node:assert';
import {
  calculatePercentiles,
  calculateRpcScore,
  createInitialRpcStats,
  updateRpcStatsWithResult,
  recalculateLeaderboard,
} from '../src/lib/benchmark/metrics.ts';
import { testRpcEndpoint } from '../src/lib/benchmark/rpcClient.ts';

function testPercentiles() {
  console.log('Testing calculatePercentiles...');
  const empty = calculatePercentiles([]);
  assert.strictEqual(empty.p50, 0);

  const single = calculatePercentiles([120]);
  assert.strictEqual(single.min, 120);
  assert.strictEqual(single.max, 120);
  assert.strictEqual(single.avg, 120);
  assert.strictEqual(single.p50, 120);

  // Distribution: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const stats = calculatePercentiles(latencies);
  assert.strictEqual(stats.min, 10);
  assert.strictEqual(stats.max, 100);
  assert.strictEqual(stats.avg, 55);
  assert.strictEqual(stats.p50, 55); // median of 10 items
  assert.ok(stats.p95 >= 95, 'p95 should be >= 95');
  console.log('calculatePercentiles passed!');
}

function testScoring() {
  console.log('Testing calculateRpcScore...');
  // Perfect node: 100% availability, 50ms latency, 0 block lag
  const perfectScore = calculateRpcScore(100, 50, 0, 10);
  assert.strictEqual(perfectScore, 100, `Expected 100, got ${perfectScore}`);

  // Node with 0 successes
  const zeroSuccess = calculateRpcScore(0, 0, null, 0);
  assert.strictEqual(zeroSuccess, 0);

  // Lagging node: 100% avail, 50ms, 15 blocks lag -> freshness dropped
  const laggingScore = calculateRpcScore(100, 50, 15, 10);
  assert.ok(laggingScore < perfectScore, 'Lagging node should score lower');
  console.log(`Perfect score: ${perfectScore}, Lagging score: ${laggingScore}`);
  console.log('calculateRpcScore passed!');
}

function testLeaderboardRecalculation() {
  console.log('Testing recalculateLeaderboard and block lag calculation...');
  const initialA = createInitialRpcStats('https://rpc-a.org');
  const initialB = createInitialRpcStats('https://rpc-b.org');

  // RPC A is at block 1000, 50ms latency
  const statsA = updateRpcStatsWithResult(
    initialA,
    {
      url: 'https://rpc-a.org',
      timestamp: Date.now(),
      latencyMs: 50,
      success: true,
      blockNumber: 1000,
      chainId: 1868,
      errorCategory: 'NONE',
      mode: 'DIRECT',
    },
    null
  );

  // RPC B is lagging at block 995 (5 blocks behind), 200ms latency
  const statsB = updateRpcStatsWithResult(
    initialB,
    {
      url: 'https://rpc-b.org',
      timestamp: Date.now(),
      latencyMs: 200,
      success: true,
      blockNumber: 995,
      chainId: 1868,
      errorCategory: 'NONE',
      mode: 'DIRECT',
    },
    null
  );

  const leaderboard = recalculateLeaderboard({
    'https://rpc-a.org': statsA,
    'https://rpc-b.org': statsB,
  });

  assert.strictEqual(leaderboard.maxBlockNumber, 1000, 'Max block should be 1000');
  assert.strictEqual(leaderboard.updatedStats['https://rpc-a.org'].blockLag, 0, 'RPC A lag should be 0');
  assert.strictEqual(leaderboard.updatedStats['https://rpc-b.org'].blockLag, 5, 'RPC B lag should be 5');
  assert.strictEqual(leaderboard.updatedStats['https://rpc-a.org'].isHighestBlock, true);
  assert.strictEqual(leaderboard.updatedStats['https://rpc-b.org'].isHighestBlock, false);
  assert.strictEqual(leaderboard.rankedUrls[0], 'https://rpc-a.org', 'RPC A should rank #1');
  assert.strictEqual(leaderboard.rankedUrls[1], 'https://rpc-b.org', 'RPC B should rank #2');
  console.log('Leaderboard calculation passed!');
}

async function testLiveRpcCall() {
  console.log('Testing live RPC probe against https://rpc.soneium.org...');
  const res = await testRpcEndpoint({
    url: 'https://rpc.soneium.org',
    timeoutMs: 8000,
  });

  console.log('Live RPC probe result:', res);
  assert.strictEqual(res.success, true, 'Live call to https://rpc.soneium.org should succeed');
  assert.ok(typeof res.blockNumber === 'number', 'Block number should be a valid integer');
  assert.ok(res.blockNumber > 0, `Block number should be > 0, got ${res.blockNumber}`);
  assert.ok(res.latencyMs > 0, `Latency should be > 0, got ${res.latencyMs}ms`);
  console.log(`Live Soneium block number: ${res.blockNumber}, latency: ${res.latencyMs}ms`);
}

async function main() {
  try {
    testPercentiles();
    testScoring();
    testLeaderboardRecalculation();
    await testLiveRpcCall();
    console.log('ALL BENCHMARK ENGINE TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

main();
