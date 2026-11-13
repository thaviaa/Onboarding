/**
 * CURRENT (legacy) script step — "Software List Collector Convert to Support Group Array"
 * Flow: Software flow(Employee Onboarding), step 5
 * Inputs: list_collector_input (u_request_software_access), currentRITM
 *
 * Kept as the baseline for the refactor. Copied as-is; only the line wrapping
 * introduced by the PDF export was repaired. Don't deploy this file.
 */
(function execute(inputs, outputs) {

    //take inputs and split it into array. loop through array and GR the meck software table to build an array of objects of support groups and apps chosen from cat item

    var obj = {};
    var appsGr = new GlideRecord('u_mecklenburg_software_list');
    appsGr.addEncodedQuery('sys_idIN' + inputs.list_collector_input);
    appsGr.query();
    while (appsGr.next()) {
        var appName = appsGr.getValue('u_name');
        var groupName = appsGr.getDisplayValue('u_support_group');
        if (!obj[groupName]) {
            //gs.info('add ' + groupName + ' to obj');
            obj[groupName] = {
                'app': [appName],
                'group_sys_id': appsGr.getValue('u_support_group')
            }
        } else {
            //gs.info('push ' + appName + ' and group sysid ' + appsGr.getValue('u_support_group') + ' to ' + groupName);
            obj[groupName].app.push(appName);
            obj[groupName].group_sys_id = appsGr.getValue('u_support_group');
        }
    }

    //take object groupName and loop through to create the catalog task and dynamic checklist
    var ag = '';
    for (var x in obj) {
        ag = obj[x].group_sys_id;
        var vars = 'user_type,requested_for,employee_id,domain_user_name,mecklenburg_county_email_address,first_name,last_name,middle_initial,physical_office_location,' +
            'ob_floor,ob_suite,ob_office_cubicle_number,title,department,start_date,equipment_needed_by,supervisor_name,email_address,telephone_number,' +
            'does_the_new_user_require_department_specific_application_or_file_share_access,u_request_software_access,security_comparable_to,file_share_path';
        var scTask = this.createRecord(ag, inputs.currentRITM);
        this.addVariables(inputs.currentRITM, scTask, vars);
        this.createChecklist(obj[x].app, scTask);
    }

})(inputs, outputs);

function addVariables(current, taskID, vars) {
    //current, pass the current RITM record
    //taskID pass the ID of the catalog task, created via createRecord function
    //vars, comma seperated string with the names of the variables you want to add to a task

    //Query for the variables to add
    //if variable set is Team Member Information, Supervisor Information, File Share, Team Member Information (Transfer)
    var getVar = new GlideRecord('item_option_new');
    var queryStr = 'nameIN' + vars + '^variable_set=8dcd67969714a510500675611153afa8^ORvariable_set=751c557d97379150500675611153afed^ORvariable_set=260937d897a46d10500675611153af8d^ORvariable_set=54dd62429761a55008747da71153af43^ORnameSTARTSWITHsecurity_comparable_to^ORnameSTARTSWITHdoes_the_new_user_require_department_specific_application_or_file_share_access^ORnameSTARTSWITHu_request_software_access';
    getVar.addEncodedQuery(queryStr);
    getVar.query();

    //For each variable, create an associated record in sc_item_variables_task
    while (getVar.next()) {
        var setVar = new GlideRecord('sc_item_variables_task');
        setVar.initialize();
        setVar.task = taskID;
        setVar.variable = getVar.getValue('sys_id');
        setVar.update();
    }
}

function createChecklist(arr, scTask) {
    var checklist = new GlideRecord('checklist');
    checklist.initialize();
    checklist.name = 'Software Requested';
    checklist.table = 'sc_task';
    checklist.document = scTask;
    var cl = checklist.insert();
    for (var i = 0; i < arr.length; i++) {
        var app_name = arr[i];
        var clItem = new GlideRecord('checklist_item');
        clItem.initialize();
        clItem.checklist = cl;
        clItem.name = app_name;
        clItem.insert();
    }
}

function createRecord(group, currRitm) {
    var taskGr = new GlideRecord('sc_task');
    taskGr.initialize();
    taskGr.request_item = currRitm;
    taskGr.assignment_group = group;
    taskGr.short_description = 'Add/Modify User - Software Provisioning';
    return taskGr.insert();
}
