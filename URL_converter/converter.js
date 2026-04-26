const LEGACY_STATUS_RE = /^[0-3]+$/;
const GROUPED_STATUS_RE = /^\d+\.[0-3]+(?:-\d+\.[0-3]+)+$/;
const SHORT_HOSTS = new Set([
  "tinyurl.com",
  "www.tinyurl.com",
  "bit.ly",
  "www.bit.ly",
  "t.co",
  "goo.gl",
]);
const CLASSIC_BUCKET_KEYS = ["dex", "own", "offer"];

export function parseUserInput(rawInput, fallbackName = "Shiny Checklist", mode = "auto") {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    throw new Error("Paste an old URL, TinyURL, or legacy status payload.");
  }

  const headerTarget = extractHeaderRedirect(trimmed);
  if (headerTarget) {
    return parseUserInput(headerTarget, fallbackName, "long-url");
  }

  if (mode === "status-string") {
    return parseLegacyStatus(trimmed, fallbackName);
  }

  if (mode === "tiny-url") {
    const shortUrl = extractFirstUrl(trimmed);
    if (!shortUrl) {
      throw new Error("Paste a TinyURL or another short URL.");
    }
    return {
      kind: "short-url",
      displayKind: "Short URL",
      source: shortUrl,
      fallbackName,
    };
  }

  if (mode === "long-url") {
    return parseLongUrlLike(trimmed, fallbackName);
  }

  if (LEGACY_STATUS_RE.test(trimmed)) {
    return parseLegacyStatus(trimmed, fallbackName);
  }

  return parseLongUrlLike(trimmed, fallbackName);
}

function parseLegacyStatus(status, fallbackName) {
  return {
    kind: "legacy-status",
    displayKind: "Legacy flat status",
    status,
    name: fallbackName || "Shiny Checklist",
    source: "status string",
  };
}

function parseLongUrlLike(rawInput, fallbackName) {
  const firstUrl = extractFirstUrl(rawInput);
  const queryCandidate = extractQueryString(rawInput);

  if (firstUrl) {
    let parsed;
    try {
      parsed = new URL(firstUrl);
    } catch {
      parsed = null;
    }

    if (parsed) {
      if (SHORT_HOSTS.has(parsed.hostname)) {
        return {
          kind: "short-url",
          displayKind: "Short URL",
          source: parsed.toString(),
          fallbackName,
        };
      }

      const described = describeFromParams(parsed.searchParams, parsed.toString(), "URL", fallbackName);
      if (described) {
        return described;
      }
    }
  }

  if (queryCandidate) {
    const params = new URLSearchParams(queryCandidate);
    const described = describeFromParams(params, rawInput.trim(), "query string", fallbackName);
    if (described) {
      return described;
    }
  }

  throw new Error(
    "I could not find a usable legacy payload. Paste a full old URL, a query string with `status=...`, or a classic `Pokemon-shiny` URL with `dex=...&own=...&offer=...`."
  );
}

function describeFromParams(params, source, sourceLabel, fallbackName) {
  const status = params.get("status");
  const statusName = params.get("name") || fallbackName || "Shiny Checklist";
  if (status) {
    return describeParsedStatus(status, statusName, source, sourceLabel);
  }

  if (hasClassicBuckets(params)) {
    return describeClassicUrl(params, source, sourceLabel, fallbackName);
  }

  return null;
}

function describeParsedStatus(status, name, source, sourceLabel) {
  if (GROUPED_STATUS_RE.test(status)) {
    return {
      kind: "grouped-status",
      displayKind: "Already grouped",
      status,
      name,
      source,
      sourceLabel,
    };
  }

  if (!LEGACY_STATUS_RE.test(status)) {
    throw new Error("The detected `status` parameter does not look like a legacy flat status string.");
  }

  return {
    kind: "legacy-status",
    displayKind: "Legacy flat status",
    status,
    name,
    source,
    sourceLabel,
  };
}

function describeClassicUrl(params, source, sourceLabel, fallbackName) {
  const legacyEntries = {
    dex: splitBucket(params.get("dex")),
    own: splitBucket(params.get("own")),
    offer: splitBucket(params.get("offer")),
  };
  const allIds = [...legacyEntries.dex, ...legacyEntries.own, ...legacyEntries.offer];

  return {
    kind: "classic-url",
    displayKind: "Classic Pokemon-shiny URL",
    legacyEntries,
    legacyEntryCount: allIds.length,
    uniqueLegacyIdCount: new Set(allIds).size,
    classicBucketSummary: `dex ${legacyEntries.dex.length} · own ${legacyEntries.own.length} · offer ${legacyEntries.offer.length}`,
    name: params.get("nickname") || fallbackName || "Shiny Checklist",
    source,
    sourceLabel,
  };
}

function hasClassicBuckets(params) {
  return CLASSIC_BUCKET_KEYS.some((key) => params.has(key));
}

function splitBucket(value) {
  return (value || "")
    .split("-")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function tryResolveShortUrl(shortUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);

  let response;
  try {
    response = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(
        "Short URL resolution timed out after 5 s. Open the short URL once, copy the final long URL, and paste that here."
      );
    }
    throw new Error(
      "Direct short URL resolution is blocked in many browsers on static sites. Open the short URL once, copy the final long URL, and paste that here."
    );
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Short URL resolution failed with HTTP ${response.status}.`);
  }

  if (!response.url || response.url === shortUrl) {
    throw new Error("The short URL did not redirect to a different destination.");
  }

  return response.url;
}

export function convertLegacyStatus({ status, name, mapping }) {
  if (!mapping?.rows?.length) {
    throw new Error("The mapping snapshot is missing or empty.");
  }

  if (!LEGACY_STATUS_RE.test(status)) {
    throw new Error("Legacy status strings may only contain digits 0-3.");
  }

  const usedCounts = new Map();
  for (const row of mapping.rows) {
    usedCounts.set(row.index, (usedCounts.get(row.index) || 0) + 1);
  }

  const grouped = [];
  let currentFamily = null;
  let familyDigits = [];

  for (const row of mapping.rows) {
    if (row.familyDex !== currentFamily) {
      if (currentFamily !== null) {
        grouped.push(`${currentFamily}.${familyDigits.join("")}`);
      }
      currentFamily = row.familyDex;
      familyDigits = [];
    }

    familyDigits.push(status[row.index] ?? "0");
  }

  if (currentFamily !== null) {
    grouped.push(`${currentFamily}.${familyDigits.join("")}`);
  }

  const groupedStatus = grouped.join("-");
  const newUrl = buildNewUrl(name, groupedStatus);

  const usedIndices = new Set(mapping.rows.map((row) => row.index));
  const droppedNonZero = [];
  for (let index = 0; index < status.length; index += 1) {
    const digit = status[index];
    if (digit !== "0" && !usedIndices.has(index)) {
      droppedNonZero.push({ index, digit });
    }
  }

  const duplicateNonZero = [];
  for (const [index, count] of usedCounts.entries()) {
    const digit = status[index] ?? "0";
    if (count > 1 && digit !== "0") {
      duplicateNonZero.push({
        index,
        digit,
        rows: mapping.rows.filter((row) => row.index === index),
      });
    }
  }

  return {
    conversionKind: "legacy-status",
    name,
    legacyStatus: status,
    groupedStatus,
    newUrl,
    droppedNonZero,
    duplicateNonZero,
    mappedRowCount: mapping.rows.length,
    familyCount: grouped.length,
  };
}

export function convertClassicUrl({ legacyEntries, name, mapping, crosswalk }) {
  if (!mapping?.rows?.length) {
    throw new Error("The mapping snapshot is missing or empty.");
  }

  if (!crosswalk?.resolved) {
    throw new Error("The classic legacy crosswalk is missing or empty.");
  }

  const currentPids = new Set(mapping.rows.map((row) => row.pid));
  const pidStatuses = new Map();
  const pidAssignments = new Map();
  const unmappedLegacyIds = [];
  const missingCurrentRows = [];
  const companionFills = [];
  const seenLegacyBucketKeys = new Set();

  const bucketDigits = [
    { key: "dex", digit: "1" },
    { key: "own", digit: "2" },
    { key: "offer", digit: "3" },
  ];

  let resolvedLegacyIdCount = 0;

  for (const { key, digit } of bucketDigits) {
    for (const legacyId of legacyEntries[key] || []) {
      const resolved = crosswalk.resolved[legacyId];
      if (!resolved) {
        unmappedLegacyIds.push({ legacyId, digit, bucket: key });
        continue;
      }

      if (!currentPids.has(resolved.pid)) {
        missingCurrentRows.push({ legacyId, pid: resolved.pid, digit, bucket: key });
        continue;
      }

      // When the exact same legacy ID appears more than once in the same bucket
      // and resolves to a form variant (pid contains a dot), fill the base pid
      // if it exists and hasn't been assigned yet. This handles cases like 861
      // appearing twice in own to signal both Grimmsnarl and Gigantamax Grimmsnarl,
      // when the crosswalk only maps 861 to the Gigantamax form.
      const legacyBucketKey = `${legacyId}:${key}`;
      if (seenLegacyBucketKeys.has(legacyBucketKey)) {
        const dotIndex = resolved.pid.indexOf(".");
        if (dotIndex !== -1) {
          const basePid = resolved.pid.slice(0, dotIndex);
          if (currentPids.has(basePid) && !pidStatuses.has(basePid)) {
            pidStatuses.set(basePid, digit);
            companionFills.push({ legacyId, resolvedPid: resolved.pid, basePid, digit, bucket: key });
          }
        }
      }
      seenLegacyBucketKeys.add(legacyBucketKey);

      pidStatuses.set(resolved.pid, digit);
      const assignments = pidAssignments.get(resolved.pid) || [];
      assignments.push({ legacyId, digit, bucket: key });
      pidAssignments.set(resolved.pid, assignments);
      resolvedLegacyIdCount += 1;
    }
  }

  const grouped = [];
  let currentFamily = null;
  let familyDigits = [];

  for (const row of mapping.rows) {
    if (row.familyDex !== currentFamily) {
      if (currentFamily !== null) {
        grouped.push(`${currentFamily}.${familyDigits.join("")}`);
      }
      currentFamily = row.familyDex;
      familyDigits = [];
    }

    familyDigits.push(pidStatuses.get(row.pid) ?? "0");
  }

  if (currentFamily !== null) {
    grouped.push(`${currentFamily}.${familyDigits.join("")}`);
  }

  const groupedStatus = grouped.join("-");
  const newUrl = buildNewUrl(name, groupedStatus);

  const repeatedPids = [...pidAssignments.entries()]
    .filter(([, assignments]) => assignments.length > 1)
    .map(([pid, assignments]) => ({ pid, assignments }));
  const conflictingPids = repeatedPids.filter(
    (item) => new Set(item.assignments.map((assignment) => `${assignment.bucket}:${assignment.digit}`)).size > 1
  );

  const allIds = [...legacyEntries.dex, ...legacyEntries.own, ...legacyEntries.offer];

  return {
    conversionKind: "classic-url",
    name,
    groupedStatus,
    newUrl,
    mappedRowCount: mapping.rows.length,
    familyCount: grouped.length,
    legacyEntryCount: allIds.length,
    uniqueLegacyIdCount: new Set(allIds).size,
    resolvedLegacyIdCount,
    mappedPidCount: pidStatuses.size,
    unmappedLegacyIds,
    missingCurrentRows,
    repeatedPids,
    conflictingPids,
    companionFills,
  };
}

export function buildMigrationNotes(result, mapping) {
  const notes = [
    `Converted ${result.mappedRowCount.toLocaleString()} released rows across ${result.familyCount.toLocaleString()} families using the ${mapping.meta.effectiveDate} snapshot.`,
  ];

  if (result.droppedNonZero.length > 0) {
    const preview = result.droppedNonZero.slice(0, 5).map((item) => item.index).join(", ");
    notes.push(
      `${result.droppedNonZero.length} non-zero legacy index position(s) no longer map to a released row in the current dataset. Sample indices: ${preview}.`
    );
  } else {
    notes.push("Every non-zero legacy index from this input mapped to a released row in the current dataset.");
  }

  if (result.duplicateNonZero.length > 0) {
    const summary = result.duplicateNonZero
      .map((item) => `${item.index} -> ${item.rows.map((row) => row.pid).join(", ")}`)
      .join("; ");
    notes.push(`Some current rows reuse the same legacy index and inherited the same digit: ${summary}.`);
  } else {
    notes.push("No non-zero duplicated legacy indices affected this conversion.");
  }

  notes.push(
    "If a TinyURL could not be resolved automatically, paste the final long old URL instead. That works fully client-side on GitHub Pages."
  );

  return notes;
}

export function buildClassicMigrationNotes(result, mapping, crosswalk) {
  const notes = [
    `Converted ${result.resolvedLegacyIdCount.toLocaleString()} legacy bucket entries into ${result.mappedPidCount.toLocaleString()} current rows across ${result.familyCount.toLocaleString()} families using the ${mapping.meta.effectiveDate} snapshot.`,
    `The classic crosswalk currently resolves ${crosswalk.meta.resolvedCount.toLocaleString()} legacy ids from the old Pokemon-shiny app.`,
  ];

  if (result.unmappedLegacyIds.length > 0) {
    const preview = result.unmappedLegacyIds
      .slice(0, 6)
      .map((item) => item.legacyId)
      .join(", ");
    notes.push(
      `${result.unmappedLegacyIds.length} legacy id(s) from this URL are still unknown to the crosswalk. Sample ids: ${preview}.`
    );
  } else {
    notes.push("Every legacy id in this classic URL mapped to a current pid.");
  }

  if (result.missingCurrentRows.length > 0) {
    const preview = result.missingCurrentRows
      .slice(0, 6)
      .map((item) => `${item.legacyId} -> ${item.pid}`)
      .join(", ");
    notes.push(
      `${result.missingCurrentRows.length} mapped legacy id(s) point to pids that are not in the current released snapshot. Sample mappings: ${preview}.`
    );
  } else {
    notes.push("All mapped classic ids land on rows that are still present in the current released snapshot.");
  }

  if (result.conflictingPids.length > 0) {
    const preview = result.conflictingPids
      .slice(0, 4)
      .map((item) => `${item.pid} <- ${item.assignments.map((assignment) => assignment.legacyId).join("/")}`)
      .join("; ");
    notes.push(
      `${result.conflictingPids.length} current pid(s) were targeted with conflicting classic states. Classic semantics still apply: later buckets override earlier ones (` + "`dex` -> `own` -> `offer`" + `). Sample: ${preview}.`
    );
  } else if (result.repeatedPids.length > 0) {
    const preview = result.repeatedPids
      .slice(0, 4)
      .map((item) => `${item.pid} <- ${item.assignments.map((assignment) => assignment.legacyId).join("/")}`)
      .join("; ");
    notes.push(
      `${result.repeatedPids.length} current pid(s) were referenced more than once, but all repeated assignments agreed on the same state. Sample: ${preview}.`
    );
  } else {
    notes.push("No current pid was assigned more than once by this classic URL.");
  }

  if (result.companionFills.length > 0) {
    const preview = result.companionFills
      .slice(0, 4)
      .map((item) => `${item.legacyId} -> ${item.basePid}`)
      .join(", ");
    notes.push(
      `${result.companionFills.length} base form(s) were automatically filled from a duplicated legacy id that resolved to a form variant. This handles cases like Gigantamax forms that share a legacy id with the base. Sample: ${preview}.`
    );
  }

  notes.push(
    "If you want a fresh short link afterward, open the converted URL in the new app and use its Share panel."
  );

  return notes;
}

function buildNewUrl(name, groupedStatus) {
  const url = new URL("https://rplus.github.io/pokemongo-shiny/");
  url.searchParams.set("name", name);
  url.searchParams.set("status", groupedStatus);
  return url.toString();
}

function extractHeaderRedirect(rawInput) {
  const match = rawInput.match(/^(?:x-tinyurl-target|location):\s*(https?:\/\/\S+)/im);
  return match ? stripTrailingPunctuation(match[1]) : null;
}

function extractFirstUrl(rawInput) {
  const match = rawInput.match(/https?:\/\/\S+/i);
  return match ? stripTrailingPunctuation(match[0]) : null;
}

function extractQueryString(rawInput) {
  const trimmed = rawInput.trim();
  if (trimmed.startsWith("?")) {
    return trimmed.slice(1);
  }
  if (/(^|[?&])(status|dex|own|offer)=/.test(trimmed) && !trimmed.includes("://")) {
    return trimmed;
  }
  return null;
}

function stripTrailingPunctuation(value) {
  return value.replace(/[)\],.;]+$/g, "");
}
