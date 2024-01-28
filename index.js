const mysql = require('mysql2');
const figlet = require('figlet');
const inquirer = require('inquirer');

figlet('Employee Manager', function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    const lines = data.split('\n');
    const maxLength = lines.reduce((max, line) => Math.max(max, line.length), 0); // Get the maximum line length
    const border = '+' + '-'.repeat(maxLength + 2) + '+'; // Create top and bottom border based on max length

    console.log(border);
    lines.forEach(line => {
        // Right pad each line with spaces to align the borders
        console.log(`| ${line.padEnd(maxLength, ' ')} |`);
    });
    console.log(border);
});



const connection = mysql.createConnection({
    host: 'localhost', // or your database host
    user: 'root', // your database username
    password: 'kmJD613947#1', // your database password
    database: 'employee_tracker' // your database name
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to the employee_tracker database.');
    runApp(); // Function to start the application
});



function runApp() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View All Departments',
                'View All Roles',
                'View All Employees',
                'Add a Department',
                'Add a Role',
                'Add an Employee',
                'Update an Employee Role',
                'Exit'
            ]
        }
    ])
        .then(answer => {
            switch (answer.action) {
                case 'View All Departments':
                    viewDepartments();
                    break;
                case 'View All Roles':
                    viewRoles();
                    break;
                case 'View All Employees':
                    viewEmployees();
                    break;
                case 'Add a Department':
                    addDepartment();
                    break;
                case 'Add a Role':
                    addRole();
                    break;
                case 'Add an Employee':
                    addEmployee();
                    break;
                case 'Update an Employee Role':
                    updateEmployeeRole();
                    break;
                case 'Exit':
                    connection.end();
                    break;
                default:
                    console.log('Invalid action');
                    runApp();
            }
        });
}

function viewDepartments() {
    const query = 'SELECT * FROM department';
    connection.query(query, (err, res) => {
        if (err) throw err;
        if (res.length === 0) {
            console.log('No departments found.');
        } else {
            console.table(res);
        }
        runApp();
    });
}


function viewRoles() {
    const query = `SELECT role.id, role.title, department.name AS department, role.salary 
                   FROM role 
                   INNER JOIN department ON role.department_id = department.id`;
    connection.query(query, (err, res) => {
        if (err) throw err;
        if (res.length === 0) {
            console.log('No roles found.');
        } else {
            console.table(res);
        }
        runApp();
    });
}


function viewEmployees() {
    const query = `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                   FROM employee 
                   LEFT JOIN role ON employee.role_id = role.id 
                   LEFT JOIN department ON role.department_id = department.id 
                   LEFT JOIN employee manager ON employee.manager_id = manager.id`;
    connection.query(query, (err, res) => {
        if (err) throw err;
        if (res.length === 0) {
            console.log('No employees found.');
        } else {
            console.table(res);
        }
        runApp();
    });
}



function addDepartment() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'deptName',
            message: 'What is the name of the department?'
        }
    ])
        .then(answer => {
            const query = 'INSERT INTO department (name) VALUES (?)';
            connection.query(query, [answer.deptName], (err, res) => {
                if (err) throw err;
                console.log(`Department added: ${answer.deptName}`);
                runApp();
            });
        });
}


function addRole() {
    // First, get the list of departments
    connection.query('SELECT * FROM department', (err, departments) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'What is the title of the role?'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'What is the salary for this role?'
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department does this role belong to?',
                choices: departments.map(dept => ({ name: dept.name, value: dept.id }))
            }
        ])
            .then(answer => {
                const query = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
                connection.query(query, [answer.title, answer.salary, answer.departmentId], (err, res) => {
                    if (err) throw err;
                    console.log(`Role added: ${answer.title}`);
                    runApp();
                });
            });
    });
}


function addEmployee() {
    // Get roles and managers for choices in prompts
    const roleQuery = 'SELECT * FROM role';
    const managerQuery = 'SELECT * FROM employee';

    connection.query(roleQuery, (err, roles) => {
        if (err) throw err;

        connection.query(managerQuery, (err, managers) => {
            if (err) throw err;

            inquirer.prompt([
                {
                    type: 'input',
                    name: 'firstName',
                    message: 'What is the first name of the employee?'
                },
                {
                    type: 'input',
                    name: 'lastName',
                    message: 'What is the last name of the employee?'
                },
                {
                    type: 'list',
                    name: 'roleId',
                    message: 'What is the role of the employee?',
                    choices: roles.map(role => ({ name: role.title, value: role.id }))
                },
                {
                    type: 'list',
                    name: 'managerId',
                    message: 'Who is the manager of the employee?',
                    choices: managers.map(manager => ({ name: manager.first_name + ' ' + manager.last_name, value: manager.id })).concat([{ name: 'None', value: null }])
                }
            ])
                .then(answer => {
                    const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';
                    connection.query(query, [answer.firstName, answer.lastName, answer.roleId, answer.managerId], (err, res) => {

                        if (err) throw err;
                        console.log(`Employee added: ${answer.firstName} ${answer.lastName}`);
                        runApp();
                    });
                });
        });
    });
}

function updateEmployeeRole() {
    // Fetch employees and roles for the prompts
    const employeeQuery = 'SELECT * FROM employee';
    const roleQuery = 'SELECT * FROM role';

    connection.query(employeeQuery, (err, employees) => {
        if (err) throw err;

        if (!employees.length) {
            console.log('No employees found.');
            runApp();
            return;
        }

        // Generate employee choices from the query results
        const employeeChoices = employees.map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id
        }));

        connection.query(roleQuery, (err, roles) => {
            if (err) throw err;

            if (!roles.length) {
                console.log('No roles found.');
                runApp();
                return;
            }

            // Generate role choices from the query results
            const roleChoices = roles.map(role => ({
                name: role.title,
                value: role.id
            }));

            inquirer.prompt([
                {
                    type: 'list',
                    name: 'employeeId',
                    message: 'Which employee\'s role do you want to update?',
                    choices: employeeChoices
                },
                {
                    type: 'list',
                    name: 'roleId',
                    message: 'What is the new role of the employee?',
                    choices: roleChoices
                }
            ])
                .then(answer => {
                    const query = 'UPDATE employee SET role_id = ? WHERE id = ?';
                    connection.query(query, [answer.roleId, answer.employeeId], (err, res) => {
                        if (err) throw err;
                        console.log('Employee role updated');
                        runApp();
                    });
                });
        });
    });
}


