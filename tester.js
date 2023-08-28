import { promisify } from 'util'
import { exec } from 'child_process'
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname, relative } from 'path';
import { program } from 'commander';
import { stripIndents } from 'common-tags'
import chalk from 'chalk';

const version = '1.0.0'
const ex = promisify(exec)

program
    .name('pdtester')
    .description('A CLI to test solutions for a programming challenge')
    .version(version)

// ---------------------------------------------------------------------
//#region Commands

program.command('stats')
    .description('Show stats for a file such as the amount of characters it has')
    .argument('<file>', 'A path to the file')
    .option('-s --spaces <amount>', 'The amount of spaces')
    .action(async (file, options) => {
        const __filename = await fileURLToPath(import.meta.url);
        const __dirname = await dirname(__filename);
        const data = await readFileSync(resolve(__dirname, `./${file}`), { encoding: 'utf8', flag: 'r' });
        
        let filteredData = data;

        if (options.spaces) {
            filteredData = await filteredData.replaceAll('\r\n', '\n')
            
            if (options.spaces == '4') {
                filteredData = await filteredData.replaceAll('    ', '  ');
            }
            else if (options.spaces == 't') {
                filteredData = await filteredData.replaceAll('\t', '  ');
            }
        }

        console.log(filteredData)
        
        printHeader(file);

        console.log(chalk.bgRgb(20, 20, 20).gray('----------------------------'));
        console.log(chalk.bgRgb(30, 30, 30)(`/// Stats \\\\\\`));
        console.log(`Characters: ${chalk.cyan(filteredData.length)}`);
        console.log(chalk.bgRgb(20, 20, 20).gray('----------------------------'));
    });

program.command('run')
    .description('Run a solution with tests to check accuracy and performance')
    .argument('<command>', 'The command to run to test the solution')
    .option('-t --tests <testfile>', 'The name of the file that contains the tests', 'tests.txt')
    .option('-i --iterations <iterations>', 'The amount of iterations of running the test cases to do', '1')
    .option('-b --base <basefile>', 'The command to execute for testing a base file (minimum of what can be run for that language)', undefined)
    .option('-br --base-runs <amount>', 'The amount of times to run the base file for getting the base time', '30')  
    .action(async (command, options) => {
        printHeader(command, options);
        printStart();

        const tests = readTests(options['tests']);
        const baseTime = await getBaseTime(options['base'], options['baseRuns']);
        console.log(`Base Time: ${`${chalk.cyan(baseTime)} seconds`}`);
        console.log(chalk.bgRgb(20, 20, 20).gray('----------------------------'));
    
        const runTimes = [];
        const iterationsNum = parseInt(options['iterations']);

        for (let i = 0; i < iterationsNum; ++i) {
            console.log(chalk.bgRgb(30, 30, 30)(`/// Running Tests (${i+1}) \\\\\\`));
            runTimes.push(await runTests(command, tests, baseTime));
            console.log(chalk.bgRgb(20, 20, 20).gray('--------------'));
        }
    
        if (iterationsNum > 1) {
            console.log(`Median time taken: ${chalk.cyan(`${getMedian(runTimes)} seconds`)}`)
            console.log(chalk.bgRgb(20, 20, 20).gray('----------------------------'));
        }
    });

program.parse();
//#endregion
// ---------------------------------------------------------------------
//#region Helper Functions

/**
 * Print the application CLI header to show the arguments entered
 * @param {string} command 
 * @param {{ string: string }} options
 */
function printHeader(command, options = {}) {
    console.log(stripIndents`
        ${chalk.gray('----------------------------')}
        ${chalk.green('♛ Programming')} ${chalk.yellow('Challenges')} ${chalk.magenta(`Tester v${version}`)}
        ${chalk.blue(`/-\\ programming.dev /-\\`)}
        ${chalk.gray('command:')} ${chalk.cyan(command)}
        ${chalk.gray(Object.keys(options).map(key => {
            return `${key}: ${chalk.cyan(options[key])}`
        }).join('\n'))}   
    `)
}

/**
 * Print the tester run header
*/
function printStart() {
    console.log(stripIndents`
        ${chalk.bgRgb(20, 20, 20)('----------------------------')}
        ${chalk.bgRgb(20, 20, 20).blue('      Starting Tester       ')}
        ${chalk.bgRgb(20, 20, 20)('----------------------------')}
    `);
}

/**
 * Get the median of an array of numbers
 * @param {[number]} array 
 * @returns {number}
 */
function getMedian(array) {
    const mid = Math.floor(array.length / 2);
    const nums = [...array].sort();
    return array.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/**
 * Returns the given text in a color based on the index passed in
 * @param {number} index 
 * @param {string} text 
 * @returns {string}
 */
function printColorIndex(index, text) {
    const colorIndexes = {
        0: 'fc0303',
        1: 'fc6b03',
        2: 'fca903',
        3: 'fcf403',
        4: 'a5fc03',
        5: '20fc03',
        6: '03fca1',
        7: '03bafc',
        8: '031cfc',
        9: 'ba03fc',
    }

    return chalk.hex(colorIndexes[index % Object.keys(colorIndexes).length])(text);
}

//#endregion
// ---------------------------------------------------------------------
//#region Base Functions

/**
 * Get the base time that a file of that language takes to run
 * @returns {number}
 */
async function getBaseTime(baseCommand, baseTimeRuns) {
    console.log(chalk.bgRgb(30, 30, 30)(`/// Getting Base Time \\\\\\`));
    const runTimes = [];

    if (!baseCommand) {
        console.log(chalk.gray('No base file provided, returning 0'));
        return 0;
    }

    for (let i = 0; i < baseTimeRuns; ++i) {
        const runTime = await runBaseTest(baseCommand);
        runTimes.push(runTime);
        console.log(chalk.gray(`#${i+1} ${runTime} ms`));
    }

    return getMedian(runTimes);
}

/**
 * Runs a base test and gives the time it took to run
 * @returns {number}
*/
async function runBaseTest(baseCommand) {
    if (baseCommand[0] == ".") {
        baseCommand = await resolve(baseCommand)
    }

    const startTime = performance.now();
    const output = (await ex(baseCommand)).stdout.trim();
    const endTime = performance.now();

    return endTime - startTime;
}

//#endregion
// ---------------------------------------------------------------------
//#region Test Functions

/**
 * Read test cases from the tests file
 * @returns {[{ input: string; answer: string; }]}
 */
function readTests(testsFile) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const data = readFileSync(resolve(__dirname, `./${testsFile}`), { encoding: 'utf8', flag: 'r' });
    const tests = []

    for (const line of data.split('\r\n')) {
        const split = line.split('=');
        let name;
        let text;

        switch (split.length) {
            case 1:
                text = split[0];
                break;
            case 2:
                name = split[0];
                text = split[1];
                break;
        }
        
        const splitText = text.split('-');

        switch (splitText.length) {
            case 1:
                tests.push({ name: name, input: splitText[0], answer: '' });
                break;
            case 2:
                tests.push({ name: name, input: splitText[0], answer: splitText[1] });
                break;
        }
    }

    return tests;
}

/**
 * Run all of the given tests against the submitted algorithm to see if it can get the correct answers
 * @param {[{ input: string; answer: string; }]} tests 
 */
async function runTests(command, tests, baseTime) {
    let totalTime = 0;
    let casesPassed = 0;

    for (const [i, test] of tests.entries()) {
        const {result, time} = await runTest(command, test.input, test.answer);
        const roundedTime = Math.round((time - baseTime) * 100) / 100

        totalTime += roundedTime;
        casesPassed += result ? 1 : 0;
        console.log(`${result ? chalk.green('✓') : chalk.red('X')} ${printColorIndex(i, `Test ${i+1}:`)} ${result ? chalk.green('Success') : chalk.red('Failure')} ${chalk.rgb(60, 60, 60)(`(${roundedTime.toFixed(3)}ms)`)} ${chalk.rgb(60, 60, 60)(`${test.name ? `(${test.name})` : ''}`)}`)
    }

    console.log(`${chalk.rgb(30, 30, 30)('------------------')}\nCases Passed: ${casesPassed == tests.length ? chalk.green(`${casesPassed}/${tests.length}`) : chalk.red(`${casesPassed}/${tests.length}`)}\nTime Taken: ${chalk.cyan(`${Math.round(totalTime)/1000} seconds`)}`)
    return (Math.round(totalTime)/1000);
}

/**
 * Run a test against the submitted algorithm and see if it can get the correct answer
 * @param {string} input
 * @param {string} answer
 * @returns {{ result: boolean; time: number; }}
 */
async function runTest(command, input, answer) {
    const startTime = performance.now();

    if (command[0] == ".") {
        command = await resolve(command)
    }

    const output = (await ex(`${command} ${input}`)).stdout.trim();
    const endTime = performance.now();

    return { result: output === answer, time: endTime - startTime };
}

//#endregion