# Onboarding — ServiceNow (Mecklenburg County ITS)

Work on **Software flow(Employee Onboarding)**: the *Add/Modify User - Software Provisioning* catalog tasks it creates for each support group, based on the software the requester picks.

## Layout

| Path | What |
|---|---|
| `current/` | Legacy "Software List Collector Convert to Support Group Array" action script. Baseline only — don't deploy. |
| `actions/software_list_to_support_group_tasks.js` | Refactored drop-in replacement for that action |
| `actions/copy_variables_to_task.js` | Shared action, same file as in `thaviaa/offboarding` |
| `docs/refactor-notes.md` | What changed, properties, test plan |

## How onboarding software tasks are created

1. **Get Catalog Variables** from the Application Access item.
2. If the user doesn't need access → update the RITM and end.
3. **Step 5** reads the software the requester picked (`u_request_software_access`, a list collector on `u_mecklenburg_software_list`) and groups it by each row's **Support Group**. It creates one `sc_task` per group, with the onboarding variables and a "Software Requested" checklist of that group's apps.
4. File share and additional-access branches create their own tasks.

Routing is already **data-driven**: to change which team handles an app, edit its row in `u_mecklenburg_software_list`. No code change needed.

Related: offboarding uses a different pattern (fixed checklist templates per team) — see `thaviaa/offboarding`.
