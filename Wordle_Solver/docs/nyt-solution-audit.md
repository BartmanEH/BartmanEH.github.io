# NYT Solution Audit

Use this when checking whether `aryAllAnswersOrdered` still matches the unofficial NYT Wordle API.

Run the full built-in list:

```sh
npm run check:wordle-solutions
```

Run a smaller date range:

```sh
npm run check:wordle-solutions -- --from 2025-01-01 --to 2025-12-31
```

Run by array index:

```sh
npm run check:wordle-solutions -- --from 1500 --to 1530 --show-ok
```

The checker reads `aryAllAnswersOrdered` from `Wordle_Solver/Wordle_Solver.js`. Index `0` maps to `2021-06-19`, and each later answer maps to one calendar day after that. It fetches `https://www.nytimes.com/svc/wordle/v2/YYYY-MM-DD.json`, compares the API `solution` to the built-in answer, and reports only non-matching rows by default.

Statuses:

- `ok`: built-in answer and NYT API solution match.
- `mismatch`: NYT returned a different solution. Update the built-in array for that date.
- `missing-api-solution`: NYT responded, but without a `solution` field.
- `api-error`: the request failed or NYT returned a non-2xx response.

The script limits concurrent requests with `--concurrency` so a full-list check is much faster than a serial shell loop without blasting every date at once. The default is `10`.

If future maintenance is needed, start with:

```sh
node Wordle_Solver/scripts/check-nyt-solutions.mjs --help
```
