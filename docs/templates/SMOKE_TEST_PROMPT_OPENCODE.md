# Smoke Test Prompt Template (OpenCode + Playwright MCP)

Copy this prompt into OpenCode and replace placeholders.

```txt
Run an end-to-end smoke test for Iteration {{ITERATION_NUMBER}} using the playwright MCP tools against http://localhost:3000.

Execution rules:
- Start by reading `docs/PRD.md` and extracting only the "Done when" criteria for Iteration {{ITERATION_NUMBER}}.
- Test each criterion explicitly in the running app.
- Do not skip criteria.
- For each criterion: navigate, interact, assert expected result, and capture evidence.
- Save at least one screenshot per criterion in `test-results/mcp/iteration-{{ITERATION_NUMBER}}/`.
- At the end, return a concise report with PASS/FAIL per criterion and artifact file paths.

Output format:
1) Preconditions checked (server reachable, route available)
2) Criterion-by-criterion results:
   - Criterion text
   - Steps executed
   - Assertion result (PASS/FAIL)
   - Evidence path(s)
3) Final verdict
4) If any FAIL: smallest fix recommendation for each failure
```
