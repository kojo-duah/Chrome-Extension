// This is a sample JavaScript code
console.log('Hello, World!');

let name1 = 'Chronium Project';
console.log(name1);

// let firstName = "Antonio; "
// lastName = "Estrada";

//const interestRate = 0.3;
//interestRate = 1;
//console.log(interestRate);

//let name = 'Antonio'; // string literal
//let age = 28; // number literal
let person = {     // object literal, dont need variables above with this 
    name: 'Antonio',
    age: 28
};
// dot notation
person.name = 'John';

// breacket notation
//let selection = 'name';
//person[selection] = 'Mary'; // bracket notation
//console.log(person.name);
//let colors = ['red', 'blue', 'green']; // array literal 
//let isApproved = false; // boolean literal
//let firstName = undefined; // undefined literal
//let selectedColor = null; // null literal, clear value of variable

//let selectedColors = ['red', 'blue'];
//console.log(selectedColors.length);

// perform a task
function greet(name, lastName) {
    console.log('Hello ' + name + ' ' + lastName);
}
//calculate a value
function square(number) {
    return number * number;
}
greet('Antonio', 'Estrada');
greet('Mary');

let number = square(2);
console.log(number);
