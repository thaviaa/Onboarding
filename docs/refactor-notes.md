# Refactor notes — Software List to Support Group Tasks

## Bugs fixed

| # | Legacy behaviour | Risk | Fix |
|---|---|---|---|
| 1 | `addEncodedQuery('sys_idIN' + input)` with an empty input | Can match the **whole** software table → a task for every support group. Step 2 of the flow usually prevents this, but not always. | Exit early when nothing is selected |
| 2 | Groups by support group **display name** | Two groups with the same name merge into one task | Group by sys_id |
| 3 | Software row with no Support Group | Creates an unassigned task | Skip it and log a warning |
| 4 | `setVar.update()` on a new record | Works, but by accident | `insert()` |
| 5 | `^ORnameSTARTSWITH…` in the variable query | Matches same-named variables on **every** catalog item, which adds stray rows to the task's Variable Editor | Match standalone variables on the RITM's own catalog item |
| 6 | Checklist items have no order | Random display order | Alphabetical, `order` = index |

## Configuration moved out of code

| Property | Default (legacy value) |
|---|---|
| `meck.onboarding.software_task_variables` | the 23 variable names from the legacy script |
| `meck.onboarding.software_task_variable_sets` | `8dcd6796…afa8, 751c557d…afed, 260937d8…af8d, 54dd6242…af43` |

The properties are optional. If they don't exist, the script falls back to the legacy values.

## Deploy

1. New update set.
2. Open the existing action **Software List Collector Convert to Support Group Array**. Copy it first if you want to keep the original untouched.
3. Replace its script step with `actions/software_list_to_support_group_tasks.js`. Inputs stay the same (`list_collector_input`, `currentRITM`); add the outputs `task_count` and `task_sys_ids`.
4. Publish the action, then re-publish the flow.

## Test

| Case | Expect |
|---|---|
| 3 apps across 2 groups | 2 tasks; each checklist lists only that group's apps, alphabetically |
| No software selected (but "requires access" = yes) | No software tasks; info line in the log |
| App with no Support Group | That app is skipped, with a warning in the log; others are fine |
| Variable Editor on a task | Same variables as a task created by the legacy action. **Compare side by side** — this confirms fix #5 didn't drop a variable the old query caught on another item |
