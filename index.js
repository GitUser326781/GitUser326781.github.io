// declare global variables
var layers;
var questions;
var counter;
var current;
var starttime;
var stopTimer;
var timeTotal;
var fr;

// add action listeners
document.getElementById("back").addEventListener("click", function back() {
  getChecked();
  document.getElementById("choices" + current).style.display = "none";
  current--;
  progress();
})
document.getElementById("next").addEventListener("click", function() {
  getChecked();
  document.getElementById("choices" + current).style.display = "none";
  current++;
  progress();
})
document.getElementById("submit").addEventListener("click", function() {
  submit();
})

let output = document.getElementById("result");
let timer = document.getElementById("timer");

class questionData { // declare object class for quiz snippet
  constructor() { // declare and initialise constructor and attributes
    this.question = ''; // question text
    this.answer = -1; // answer index
    this.choices = ['', '', '', '']; // choicse text array
    this.reason = ''; // reason text
    this.chosen = -1; // chosen index
  }
  shuffle() { // shuffle function
    for (let i = 0; i < 3; i++) { // go through the first 3 indexes of questions
      const R = Math.floor(Math.random() * (i + 1)); // generate a random number
      if (i == this.answer) { // change the answer index if the current index equals the answer
        this.answer = R;
      }
      // switch the questions around
      [this.choices[i], this.choices[R]] = [this.choices[R], this.choices[i]];
    }
  }
}

function convert() { // Function to change pdf to the formatted test
  // initialise global variables
  layers = [];
  questions = [];
  counter = 0;
  current = 0;
  starttime = 0;
  stopTimer = false;
  // make sure all test elements are gone
  document.getElementById("back").style.display = "none";
  document.getElementById("next").style.display = "none";
  document.getElementById("submit").style.display = "none";
  timer.style.display = "none";

  // declare and initialise file reader variable
  fr = new FileReader();
  // declare text convertion object variable
  var pdff = new Pdf2TextClass();
  if (fr.readyState > 0) // if the data is being or finished being loaded
    fr = new FileReader(); // overwrite the old FileReader
  // Overwrite onload event
  fr.onload = function () {
    // call function to extract file text
    pdff.pdfToText(fr.result);
  }
  // check the file type
  var file = document.getElementById('pdffile').files[0];
  if (file.type == 'application/pdf')
    fr.readAsDataURL(file)
  else
    output.innerText = 'Wrong File Type!'
}

function Pdf2TextClass() { // Class fuction Object
  var self = this; // Declare variable instance of self
  this.complete = 0; // Declare attribute of pages completes
  this.pdfToText = function (data) { // declare method to get the file content
    // send error to console if the data isn't either an ArrayBuffer or a string
    console.assert(data instanceof ArrayBuffer || typeof data == 'string');
    // promise to get the document data, then execute a function
    pdfjsLib.getDocument(data).promise.then(function (pdf) {
      // save the number of pages
      var total = pdf._pdfInfo.numPages;
      // loop through all of the file's pages
      for (i = 1; i <= total; i++) {
        // promise to get the page then execute a function
        pdf.getPage(i).then(function (page) {
          // save the page number
          var n = page.pageNumber;
          // promise to get the page's text content
          page.getTextContent().then(function (textContent) {
            // declare and initialise an array for current page's content
            var textLines = [];
            if (null != textContent.items) { // update the text variable if the page content is not null
              // declare and initialise a variable for the page's text and the previous string line
              var page_text = "";
              // loop by the amount of lines of strings there are for the page
              for (var k = 0, index = 0; k < textContent.items.length; k++) {
                // declare and initialise a variable for the current string line
                var block = textContent.items[k];
                // get the current line's text
                page_text = block.str;
                // if the text has more than 1 character or contains a letter or number...
                if (page_text.length > 1 || page_text.search(/^[a-zA-Z0-9]$/) > -1) {
                  if (textLines[index] == null) // add the text to the line array
                    textLines[index] = page_text;
                  else // add a space followed by the text to the line array
                    textLines[index] += ' ' + page_text;
                } // otherwise move to the next index or the line array
                else
                  if (textLines[index] != null) // if the current array's index is not null, move to the next index
                    index++;
              }
            }
            // add the page's text lines to the pages' text content array
            layers[n - 1] = textLines;
            // add one to the pages completed
            ++self.complete;
            if (self.complete == total) { // if the pages completed equals the amount of pages the document has...
              window.setTimeout(setup(), 1000); // after one second, execute the function
            }
          }); // end  of page.getTextContent().then
        }); // end of page.then
      } // of for
    });
  }; // end of pdfToText()
}; // end of class

function setup() { // function to take document data and convert it to be usable
  // declare a constant to convert the letter tot a corresponded index number
  const map = new Map()
  map.set('A', 0);
  map.set('B', 1);
  map.set('C', 2);
  map.set('D', 3);
  // declare and initialise a variable to count the page
  var page = 0;
  // get question data (question and choices)
  while (page < layers.length) { // go through all of the document's pages
    for (let i = 0; i < layers[page].length; i++) { // go through all of the page's lines
      if (layers[page][i] != null && layers[page][i] == (questions.length + 1) + '.') { // if the text line is not null and the characters is the 'nth' question plus a period (i.e '1.'), then add the question
        questions[questions.length] = new questionData(); // initialise question data
        questions[questions.length - 1].question = layers[page][i + 1]; // add question
        // add choises
        questions[questions.length - 1].choices[map.get(layers[page][i + 2].charAt(0))] = layers[page][i + 3];
        questions[questions.length - 1].choices[map.get(layers[page][i + 4].charAt(0))] = layers[page][i + 5];
        questions[questions.length - 1].choices[map.get(layers[page][i + 6].charAt(0))] = layers[page][i + 7];
        questions[questions.length - 1].choices[map.get(layers[page][i + 8].charAt(0))] = layers[page][i + 9];
        i += 8; // add 8 to 'i'
      }
    }
    page++; // move to the next page
    if (questions.length == 100) // leave loop if there are 100 questions
      break;
  }
  // get document data (answer and reason)
  // declare and initialise variable for the question being worked on
  var n = 1;
  while (page < layers.length) { // go through all of the document's pages
    for (let i = 0; i < layers[page].length; i++) { // go through all of the page's lines
      if (layers[page][i] != null && layers[page][i] == n + '.') { // if the text line is not null and the characters is the 'nth' question plus a period (i.e '1.'), then add the question data
        questions[n - 1].answer = map.get(layers[page][i + 1].charAt(0)) // add the answer
        questions[n - 1].reason += layers[page][i + 1].substring(2); // add the reason
        n++; // add 1 to n
        i++; // add 1 to 'i'
      }
      else if (i > 2 && n > 1) { // if it's passed the third line on the page and it's passed the first question...
        questions[n - 2].reason += '\n' + layers[page][i]; // add a newline and the text content to the previous question's reason
      }
    }
    page++; // move to the next page
  }

  // Shuffle questions' data
  for (let i = 0; i < questions.length; i++) {
    questions[i].shuffle;
  }

  // Shuffle questions
  for (let i = 0; i < questions.length; i++) { // go through the questions
    const R = Math.floor(Math.random() * (i + 1)); // generate a random number
    // switch the questions around
    [questions[i], questions[R]] = [questions[R], questions[i]];
  }  // start the quiz menu
  startMenu();
}

function startMenu() {
  if (questions.length == 100 && questions.reason != "") {
    output.innerHTML = '<p>You will have 90 minutes to complete the quiz. If you take longer than the timeframe, you\'ll be given the amount of time you took regardless.</p><br><button id="start" onclick="start()">Start</button>';
    timer.innerText = '01:30:00';
    timer.style.display = "flex"
  }
  else {
    output.innerHTML = '<p>An Error Occured!</p>';
  }
}

function start() { // function to start the test
  starttime = Date.now(); // save the started time
  let lastTime = starttime; // set the previous time as the started time
  setTimeout(updateTimer(starttime, lastTime), 100); // update the timer every tenth of a second
  output.innerHTML = "";
  document.getElementById("next").style.display = "unset";
  progress();
}

function updateTimer() {
  setTimeout(function () {
    const TIME = Date.now();
    let timePassed = TIME - starttime;
    let timeLeft = 5401000 - timePassed;
    if (timeLeft > 0 && !stopTimer) {
      const hour = String(Math.floor(timeLeft / 3600000)).padStart(2, '0');
      const minu = String(Math.floor((timeLeft - hour * 3600000) / 60000)).padStart(2, '0');
      const seco = String(Math.floor((timeLeft - hour * 3600000 - minu * 60000) / 1000)).padStart(2, '0');
      document.getElementById("timer").innerText = hour + ':' + minu + ':' + seco;
      updateTimer()
    }
  }, 100);
}

function progress() {
  if (current < 100) {
    var d
    if (current >= counter) {
      d = document.createElement("div");
      d.id = "choices" + current;
      d.className = "question-style";
      d.innerHTML = displayQuestion(); // display question
      output.append(d);
      counter++;
    }
    else {
      d = document.getElementById("choices" + current);
      d.style.display = "unset";
    }
    // add progression buttons depending on question number
    switch (current) {
      case 0: {
        document.getElementById("back").style.display = "none";
        break;
      }
      default: {
        document.getElementById("back").style.display = "unset";
      }
    }
  }
  else {
    for (let i = 0; i < 100; i++) {
      document.getElementById("choices" + i).style.display = "unset";
    }
    document.getElementById("next").style.display = "none";
    document.getElementById("submit").style.display = "unset";
  }
}

getChecked = () => {
  var choicebtn = document.getElementsByName("choice" + current)
  for (let i = 0; i < choicebtn.length; i++) {
    if (choicebtn[i].checked) {
      questions[current].chosen = i;
      // console.log(questions[i]);
      break;
    }
  }
}

function displayQuestion() {
  return '<p>' + (current + 1) + '. ' + questions[current].question + '</p>'
    + '<input type="radio" name="choice' + current + '" id="' + current + '0">'
    + '<label for="' + current + '0">' + "A. " + questions[current].choices[0] + '</label><br>'
    + '<input type="radio" name="choice' + current + '" id="' + current + '1">'
    + '<label for="' + current + '1">' + "B. " + questions[current].choices[1] + '</label><br>'
    + '<input type="radio" name="choice' + current + '" id="' + current + '2">'
    + '<label for="' + current + '2">' + "C. " + questions[current].choices[2] + '</label><br>'
    + '<input type="radio" name="choice' + current + '" id="' + current + '3">'
    + '<label for="' + current + '3">' + "D. " + questions[current].choices[3] + '</label><br>'
}

submit = () => {
  document.getElementById("back").style.display = "none";
  document.getElementById("next").style.display = "none";
  document.getElementById("submit").style.display = "none";
  stopTimer = true;
  timeTotal = Date.now() - starttime;
  const hour = Math.floor(timeTotal / 3600000);
  const minu = Math.floor((timeTotal - hour * 3600000) / 60000);
  const seco = Math.floor((timeTotal - hour * 3600000 - minu * 60000) / 1000);
  let score = 0;
  let temp = '';
  for (let i = 0; i < 100; i++) {
    temp += displayAnswer(i);
    if (questions[i].chosen == questions[i].answer) {
      score++;
    }
  }
  output.innerHTML = '<p>' + score + '/100</p><p>It took ' + String(hour).padStart(hour.length + 1, '0') + ':' + String(minu).padStart(2, '0') + ':' + String(seco).padStart(2, '0') + '</p>' + temp;
  document.documentElement.scrollTop = 0;
}

displayAnswer = (i) => {
  const map = new Map();
  map.set(0, 'A.');
  map.set(1, 'B.');
  map.set(2, 'C.');
  map.set(3, 'D.');
  var display = [];
  display.push(
    '<p>' + questions[i].question + '<br>'
    + 'A. ' + questions[i].choices[0] + '<br>'
    + 'B. ' + questions[i].choices[1] + '<br>'
    + 'C. ' + questions[i].choices[2] + '<br>'
    + 'D. ' + questions[i].choices[3] + '<br><br>'
    + 'The answer was ' + map.get(questions[i].answer) + '<br><br>'
    + 'You chose ' + map.get(questions[i].chosen) + '<br>'
    + questions[i].reason + '</p><br>'
  )
  return display;
}
