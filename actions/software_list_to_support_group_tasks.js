/**
 * Flow Designer Action (refactor): "Software List to Support Group Tasks"
 * Drop-in replacement for step 5 of Software flow(Employee Onboarding).
 * Scope: Global
 *
 * Inputs:
 *   list_collector_input   String  comma-separated u_mecklenburg_software_list sys_ids
 *                                  (the u_request_software_access list collector)
 *   currentRITM            Reference sc_req_item, or its sys_id as a String
 *
 * Outputs:
 *   task_count             Integer
 *   task_sys_ids           String  comma-separated sc_task sys_ids created
 *
 * Routing is already data-driven: each software row's Support Group decides
 * which team gets the task. This refactor fixes the bugs and moves the
 * variable list out of code into system properties.
 *
 * Fixes vs legacy:
 *   - Empty list collector: legacy ran addEncodedQuery('sys_idIN') which can
 *     return the WHOLE software table. Now exits early.
 *   - Groups by support group sys_id, not display name (two groups with the
 *     same name were merged into one task).
 *   - Software rows with no Support Group are logged instead of creating an
 *     unassigned task.
 *   - insert() instead of update() for sc_item_variables_task; no duplicates.
 *   - Standalone variables are matched to the RITM's own catalog item instead
 *     of nameSTARTSWITH across every item in the instance.
 *   - Checklist items get an order (alphabetical by app name).
 *   - Variable names / sets come from system properties, with the legacy
 *     values as fallback.
 */
(function execute(inputs, outputs) {
    outputs.task_count = 0;
    outputs.task_sys_ids = '';

    var SHORT_DESCRIPTION = 'Add/Modify User - Software Provisioning';
    var CHECKLIST_NAME = 'Software Requested';

    var VARIABLES = gs.getProperty('meck.onboarding.software_task_variables',
        'user_type,requested_for,employee_id,domain_user_name,mecklenburg_county_email_address,first_name,last_name,middle_initial,' +
        'physical_office_location,ob_floor,ob_suite,ob_office_cubicle_number,title,department,start_date,equipment_needed_by,' +
        'supervisor_name,email_address,telephone_number,' +
        'does_the_new_user_require_department_specific_application_or_file_share_access,u_request_software_access,' +
        'security_comparable_to,file_share_path');

    // Team Member Information, Supervisor Information, File Share, Team Member Information (Transfer)
    var VARIABLE_SETS = gs.getProperty('meck.onboarding.software_task_variable_sets',
        '8dcd67969714a510500675611153afa8,751c557d97379150500675611153afed,' +
        '260937d897a46d10500675611153af8d,54dd62429761a55008747da71153af43');

    var ritmId = toSysId(inputs.currentRITM);
    var selected = ((inputs.list_collector_input || '') + '').trim();

    if (!ritmId) {
        gs.error('[Onboarding Software Tasks] No RITM passed in.');
        return;
    }
    if (!selected) {
        gs.info('[Onboarding Software Tasks] No software selected on ' + ritmId + '; no tasks created.');
        return;
    }

    // 1. Group selected apps by support group sys_id
    var byGroup = {};
    var groupOrder = [];
    var apps = new GlideRecord('u_mecklenburg_software_list');
    apps.addQuery('sys_id', 'IN', selected);
    apps.orderBy('u_name');
    apps.query();
    while (apps.next()) {
        var groupId = apps.getValue('u_support_group');
        var appName = apps.getValue('u_name');
        if (!groupId) {
            gs.warn('[Onboarding Software Tasks] "' + appName + '" (' + apps.getUniqueValue() +
                ') has no Support Group; skipped on ' + ritmId);
            continue;
        }
        if (!byGroup[groupId]) {
            byGroup[groupId] = [];
            groupOrder.push(groupId);
        }
        byGroup[groupId].push(appName);
    }

    // 2. One task per group, with variables and a checklist of its apps
    var created = [];
    for (var g = 0; g < groupOrder.length; g++) {
        var taskId = createTask(groupOrder[g], ritmId);
        if (!taskId) continue;
        copyVariables(taskId, ritmId, VARIABLES, VARIABLE_SETS);
        createChecklist(taskId, byGroup[groupOrder[g]]);
        created.push(taskId);
    }

    outputs.task_count = created.length;
    outputs.task_sys_ids = created.join(',');

    // ---- helpers ----------------------------------------------------------

    function toSysId(v) {
        if (!v) return '';
        if (typeof v.getUniqueValue === 'function') return v.getUniqueValue();
        if (v.sys_id) return v.sys_id + '';
        return v + '';
    }

    function createTask(groupId, ritm) {
        var t = new GlideRecord('sc_task');
        t.initialize();
        t.setValue('request_item', ritm);
        t.setValue('assignment_group', groupId);
        t.setValue('short_description', SHORT_DESCRIPTION);
        return t.insert();
    }

    function copyVariables(taskId, ritm, names, sets) {
        var catItem = '';
        var r = new GlideRecord('sc_req_item');
        if (r.get(ritm)) catItem = r.getValue('cat_item');

        var scope = [];
        if (sets) scope.push('variable_setIN' + sets);
        if (catItem) scope.push('cat_item=' + catItem);
        if (!scope.length) return;

        var v = new GlideRecord('item_option_new');
        v.addEncodedQuery('nameIN' + names + '^' + scope.join('^OR'));
        v.query();
        while (v.next()) {
            var link = new GlideRecord('sc_item_variables_task');
            link.initialize();
            link.setValue('task', taskId);
            link.setValue('variable', v.getUniqueValue());
            link.insert();
        }
    }

    function createChecklist(taskId, names) {
        var list = new GlideRecord('checklist');
        list.initialize();
        list.setValue('name', CHECKLIST_NAME);
        list.setValue('table', 'sc_task');
        list.setValue('document', taskId);
        var listId = list.insert();
        if (!listId) return;
        for (var i = 0; i < names.length; i++) {
            var item = new GlideRecord('checklist_item');
            item.initialize();
            item.setValue('checklist', listId);
            item.setValue('name', names[i]);
            item.setValue('order', i);
            item.setValue('complete', false);
            item.insert();
        }
    }
})(inputs, outputs);
