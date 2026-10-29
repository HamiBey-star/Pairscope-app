# PairScope on-chain forensics: what is and is not wired up

## Available in this package
- Market-data risk flags from DexScreener pair metrics.
- Partial Solana top-holder concentration estimate from public Solana JSON-RPC.
- Browser-local paper trades with configurable assumed fees and slippage.

## Required before calling bundle / developer-wallet tracking production-ready
1. Choose a transaction-indexing source for each supported chain (for example, a Solana enhanced-transactions provider and EVM log/indexing provider). Keep API keys in Cloudflare Worker secrets; do not put keys in browser JavaScript or Git.
2. Add a Worker endpoint that accepts chain + mint/contract address, normalizes transfers/swaps, and returns timestamp, transaction signature/hash, trader wallet, token amount, quote amount, and pool/route metadata.
3. Establish the creator/developer wallet from a trustworthy launch/mint event or launchpad-specific record. Do not infer the developer from the largest holder alone.
4. Define bundle heuristics transparently: same launch block/slot or tight time window, shared funding wallet, synchronized first buys, and related transaction routes. Exclude known pool, burn, exchange, and program accounts where possible. Return evidence and confidence, not a binary accusation.
5. Track creator-linked sells and transfers against acquisition history; distinguish transfers from actual sells and report the evidence transaction links.
6. Persist timestamped snapshots/events in a database or Durable Object. Browser local storage is not a shared or durable backend and cannot power reliable alerts across devices.
7. Test on known legitimate launches and documented rug pulls; measure false positives and missing data. Display provider coverage, last indexed time, and explicit unknown states.

## Paper trading limitations
Paper-trade fills use the displayed pair price plus a configurable slippage assumption and fee deduction. They do not simulate order-book/pool depth, route selection, failed transactions, priority fees, MEV, latency, or actual price impact. Use a dedicated historical swap/quote data set before presenting performance as a validated strategy result.
