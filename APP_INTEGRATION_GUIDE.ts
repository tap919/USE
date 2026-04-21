// ═══════════════════════════════════════════════════════════════════════════
// APP.TSX INTEGRATION GUIDE — Add BioinformaticsHub to your existing App.tsx
// ═══════════════════════════════════════════════════════════════════════════
//
// STEP 1: Add this import near your other component imports in App.tsx
// ─────────────────────────────────────────────────────────────────────────
import { BioinformaticsHub } from './components/BioinformaticsHub';

// ─────────────────────────────────────────────────────────────────────────
// STEP 2: Add this TabsTrigger to your TabsList (after the existing tabs)
// ─────────────────────────────────────────────────────────────────────────
//
// <TabsTrigger
//   value="bioinformatics"
//   className="data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400 text-xs font-mono"
// >
//   BIOINFORMATICS
// </TabsTrigger>
//
// ─────────────────────────────────────────────────────────────────────────
// STEP 3: Add this TabsContent block after your last TabsContent
// ─────────────────────────────────────────────────────────────────────────
//
// <TabsContent value="bioinformatics" className="mt-6">
//   <BioinformaticsHub />
// </TabsContent>
//
// ═══════════════════════════════════════════════════════════════════════════

export {};
