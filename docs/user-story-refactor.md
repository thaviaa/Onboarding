# Enhancement - ITS - Onboarding - Harden Software Provisioning catalog task creation

| Field | Value |
|---|---|
| Area | ITS - ServiceNow\ITPMO - ITS ServiceNow Operational FY27 |
| Iteration | _TBD_ |
| Story Points | 5 |
| Priority | 2 |
| Value area | Business |

## Description

As a support group fulfiller, I want Add/Modify User - Software Provisioning catalog tasks to be created only for the software requested on a Team Member Onboarding request, assigned to the correct support group, so that my team receives accurate, complete tasks and no stray or unassigned tasks are created.

## Acceptance Criteria

**AC1.** When a new Team Member Onboarding request is submitted with software selected, one Add/Modify User - Software Provisioning catalog task is created for each support group of the selected software and assigned to that group.

**AC2.** Each Software Provisioning catalog task has a Software Requested checklist that lists only that support group's selected software, in alphabetical order.

**AC3.** When a new Team Member Onboarding request is submitted with no software selected, no Software Provisioning catalog tasks are created.

**AC4.** When selected software has no support group, no unassigned catalog task is created for it, a warning is logged, and catalog tasks for the other selected software are still created.

**AC5.** When two support groups have the same display name, each group receives its own Software Provisioning catalog task.

**AC6.** The Software Provisioning catalog task Variable Editor shows the same team member, supervisor, file share and software variables as today, and no variables from other catalog items.

**AC7.** Existing Team Member Onboarding requests and Software Provisioning catalog tasks are unaffected.

## DEV/QA Note

- Script: `actions/software_list_to_support_group_tasks.js`. It replaces the script step of **Software List Collector Convert to Support Group Array**; the inputs are unchanged.
- Details and test cases: `docs/refactor-notes.md`.
- AC6: compare a task's Variable Editor side by side with a task created by the current action before sign-off.
- Optional system properties: `meck.onboarding.software_task_variables` and `meck.onboarding.software_task_variable_sets`. If they aren't present, the script falls back to the current values.
- Which team handles an app stays controlled by the Support Group on `u_mecklenburg_software_list`.
