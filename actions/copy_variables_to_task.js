/**
 * Flow Designer Action: "Copy Variables to Task"
 * Scope: Global   Category: Catalog Tasks
 * Shared by onboarding and offboarding (same file lives in thaviaa/onboarding).
 *
 * Adds catalog variables to an sc_task's Variable Editor by creating
 * sc_item_variables_task rows.
 *
 * Inputs (String):
 *   task_sys_id            sc_task sys_id (required)
 *   requested_item_sys_id  sc_req_item sys_id (required)
 *   variable_names         comma-separated variable names. If blank, read from
 *                          system property meck.offboarding.task_variables
 *   variable_set_ids       comma-separated item_option_new.variable_set sys_ids.
 *                          If blank, read from meck.offboarding.task_variable_sets
 *
 * Outputs:
 *   added_count            Integer
 *
 * A variable is copied when its name is in variable_names AND it belongs to
 * one of the variable sets OR directly to the RITM's catalog item.
 *
 * Fixes vs legacy:
 *   - insert() instead of update() on a new record.
 *   - Skips variables already on the task (safe to re-run).
 *   - Standalone variables are matched to the RITM's own catalog item instead
 *     of "nameSTARTSWITH" across every catalog item in the instance.
 */
(function execute(inputs, outputs) {
    outputs.added_count = 0;

    var taskId = (inputs.task_sys_id || '') + '';
    var ritmId = (inputs.requested_item_sys_id || '') + '';
    var names = clean((inputs.variable_names || '') + '' || gs.getProperty('meck.offboarding.task_variables', ''));
    var sets = clean((inputs.variable_set_ids || '') + '' || gs.getProperty('meck.offboarding.task_variable_sets', ''));

    if (!taskId || !names) {
        gs.warn('[Copy Variables to Task] Missing task or variable names. task=' + taskId);
        return;
    }

    var catItem = '';
    var ritm = new GlideRecord('sc_req_item');
    if (ritmId && ritm.get(ritmId)) {
        catItem = ritm.getValue('cat_item');
    }

    var scope = [];
    if (sets) scope.push('variable_setIN' + sets);
    if (catItem) scope.push('cat_item=' + catItem);
    if (!scope.length) {
        gs.warn('[Copy Variables to Task] No variable sets or catalog item to scope by. task=' + taskId);
        return;
    }

    var existing = {};
    var ex = new GlideRecord('sc_item_variables_task');
    ex.addQuery('task', taskId);
    ex.query();
    while (ex.next()) existing[ex.getValue('variable')] = true;

    var v = new GlideRecord('item_option_new');
    v.addEncodedQuery('nameIN' + names + '^' + scope.join('^OR'));
    v.query();
    while (v.next()) {
        var id = v.getUniqueValue();
        if (existing[id]) continue;
        var link = new GlideRecord('sc_item_variables_task');
        link.initialize();
        link.setValue('task', taskId);
        link.setValue('variable', id);
        if (link.insert()) {
            existing[id] = true;
            outputs.added_count++;
        }
    }

    function clean(csv) {
        return csv.split(',').map(function (s) { return s.trim(); })
            .filter(function (s) { return s; }).join(',');
    }
})(inputs, outputs);
