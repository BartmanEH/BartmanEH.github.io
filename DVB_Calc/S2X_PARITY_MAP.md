# DVB-S2X Parity Map

Comparison target: S2X entries from the online calculator dropdown you provided (`FEC_BROEK` list).

Scope: `DVB_Calc/main_form.js` `DVBS2XLookup` table.

Date checked: 2026-02-25

## Summary

- Selection parity: `missing=0`, `extra=0`
- Numeric parity (`efficiencyPilotsOff`, `efficiencyPilotsOn`, `idealEsNo`): exact match for all entries
- Total S2X MODCOD entries: `64`

## Coverage Matrix

| Frame | Modulation | Reference count | Implemented count | Status |
|---|---|---:|---:|---|
| Normal | BPSK | 3 | 3 | OK |
| Normal | QPSK | 3 | 3 | OK |
| Normal | 8PSK | 3 | 3 | OK |
| Normal | 8APSK | 2 | 2 | OK |
| Normal | 16APSK | 13 | 13 | OK |
| Normal | 32APSK | 4 | 4 | OK |
| Normal | 64APSK | 5 | 5 | OK |
| Normal | 128APSK | 2 | 2 | OK |
| Normal | 256APSK | 6 | 6 | OK |
| Short | BPSK | 3 | 3 | OK |
| ShortS | BPSK | 2 | 2 | OK |
| Short | QPSK | 6 | 6 | OK |
| ShortS | QPSK | 1 | 1 | OK |
| Short | 8PSK | 4 | 4 | OK |
| Short | 16APSK | 5 | 5 | OK |
| Short | 32APSK | 2 | 2 | OK |

## Notes

- BPSK `Normal` UI label is shown as `Medium` for S2X context.
- UI now exposes a third frame button (`ShortS` value) with dynamic label:
  - `Short-S` for BPSK-S entries (`1/5-S`, `11/45-S`)
  - `Medium` for QPSK `2/9` (`61560`)
