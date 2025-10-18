I was in the middle of reviewing a freshly merged branch when it dawned on me that our little burst of velocity had nothing to do with lucky keystrokes. It was the discipline we baked in before the first commit. That upfront analysis—painstaking, almost obsessive—made it possible to let two Codex sessions run in parallel later without descending into chaos. No agent trickery compensates for a messy foundation. We earned the privilege to multitask by writing the map first.

### starting disciplined so we can parallelize later

Industry research has been nudging us in this direction for years. When Nicole Forsgren and her coauthors published *Accelerate* they showed that elite teams share a pattern of deliberate, observable feedback loops. Gartner’s 2024 note on platform teams doubles down on the same theme: shared contracts matter more than heroics. I had read both, nodded along, and kept working the old way—until this week. We sat down with the backlog, untangled dependencies, and wrote GitHub issues that sounded less like wishful thinking and more like agreements an AI could follow. Each ticket referenced repo paths, acceptance checks, and the assumptions we needed the agents to respect. We annotated edge cases that might confuse a language model. None of this felt glamorous. All of it proved essential.

### what the initial analysis unlocked

That clarity gave us clean seams. One issue targeted the empty CSV export bug (the fix lives in pull request sixteen if you want to peek). Another shaped the import guide overlay and sample files (pull request seventeen). Dependencies that were already merged stayed in their own chapter. Because the issues were exhaustive, I could create a separate git worktree for each thread. Suddenly I had two directories side by side, each tied to its own branch, each pointing to explicit acceptance notes. Context switching stopped feeling like juggling knives and started feeling like walking between rooms I had already cleaned.

### running twin codex sessions

Once the branches were ready, I fired up two Codex instances. One lived inside the export guard branch, guiding a change that now alerts when there is nothing to download. The other lived inside the import overlay branch, wiring the dialog and those public sample CSV files. If you try that without clear issues, you end up in ticket hell. With clean briefs, I could type something like “update the handler to alert on empty datasets” and Codex already knew which file and which test mattered. Meanwhile, the dialog work stayed aligned with the acceptance notes because the issue spelled out the sampling logic and UX constraints. I used to believe multitasking was a human failing; actually, let me clarify that, it is an architectural choice. Crisp architecture lets the automation run while we keep a human grip on nuance.

### lessons for multicultural teams

Different readers look for different signals. Some want proof that the workflow is sound, so we kept recording artifacts: lint results attached to each PR, build output archived in the notes, manual verification steps described in the PR body. Others listen for the relational story. For them, the narrative is that coordination became a team sport. We aligned on the backlog narrative, referenced specific PRs, and made sure every manual test note invited review instead of declaring victory. Respect sat at the center. Every person, human or agent, knew the boundaries because the issues acted as contracts, not suggestions.

### where we go next

I do not have data on this specifically, but I suspect the same template will carry us into the heavier items like issue eight and the Google OAuth epic in issue fifteen. Around 2018 or 2019, I noticed cross functional teams stall when they assumed an AI assistant would tidy up vague requests. We are not making that mistake again. The dual Codex experiment worked because the groundwork was meticulous. That is the institution we are building: clarity that multiplies effort rather than diluting it. The backlog still has teeth, yet disciplined analysis means we can invite more agents, more branches, and still keep ownership.

What I have observed is simple. Parallel engineering is not about bravado. It is about respecting the work enough to plan it carefully, then trusting your tools to stay inside the lanes you drew. Two Codex instances, two branches, one nervous engineer watching the tests go green—that only happened because the issues were the map and the compass. Now we know the route, and the next leg will be faster.***
