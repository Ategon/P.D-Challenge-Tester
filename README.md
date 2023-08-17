# P.D-Challenge-Tester
A CLI to test solutions for the https://programming.dev programming challenges community

## How to Add Test Cases
1. Create or open the tests.txt file. Each file in the file is a new test case
2. Add the input text for what the input should be for a case on some line
3. (optional) Put a - to the right of the input text and then put the output that should be printed when the solution is ran to the right of that
4. (optional) Put a = to the left of the input texty and then put the name of the test case to the left of that
5. Repeat 2-4 for all test cases with each one on a different line

## How to Test Solutions
1. Install node.js if you haven't already
2. Open the folder in a terminal and run `npm install` to install dependencies
3. Add test cases to the tests.txt file (see section above)
4. Use the command `node tester.js run <command>` with `<command>` replaced with the command that would be used to run the file (this will then be used to run it for each test case)
   - `node tester.js run "node solution.js"` (javascript)
   - `node tester.js run "python solution.py"` (python)
   - `node tester.js run "./solution"` (rust)
   - etc for other languages
5. The app will now run the solution through all the provided test cases

There are some options you can provide to change how it tests. 
  - `-i <number of iterations>` will make it iterate a certain amount of time through the tests and then give you the median time (useful to counter differences in runtimes of running the same thing)
  - `-b <basefile>` will run a command you put as basefile for running a basic file. This is the minimum file that can be ran for that language (empty file in js, file with just an ampty main function in rust) to exclude the time it takes to start running a file for that language in the final results
  - `-br <amount>` will set the amount of times it tries to run the base file and then set the base time to the median between all of them
  - `-t <testfile>` with testfile replaced with a file name (+extension) will read tests from that file instead of the default tests.txt

The current settings I use are `node tester.js run -b "node bases/basejs.js" -i 50 -br 250 "node main.js"` (with fields populated with js there)

## How to Count Characters
1. Install node.js if you haven't already
2. Open the folder in a terminal and run `npm install` to install dependencies
3. Use the command `node tester.js stats <file>` with `<file>` replaced to the path to some file you want to count the characters of
