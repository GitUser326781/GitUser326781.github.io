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
document.getElementById("next").addEventListener("click", function () {
  getChecked();
  document.getElementById("choices" + current).style.display = "none";
  current++;
  progress();
})
document.getElementById("submit").addEventListener("click", function () {
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
              var page_text = "", last_block;
              // loop by the amount of lines of strings there are for the page
              for (var k = 0, index = 0; k < textContent.items.length; k++) {
                // declare and initialise a variable for the current string line
                var block = textContent.items[k];
                // get the current line's text
                page_text = block.str;
                // if the text has more than 1 character or contains a letter or number...
                if (page_text.length > 0) {
                  if (page_text == /^\w-/) {
                    if (textLines[index] == null) {
                      index++;
                    }
                  }
                  else {
                    if (textLines[index] == null) {
                      textLines[index] = page_text;
                    }
                    else if (last_block != null) {
                      if ((last_block.transform[5] - 1) >= block.transform[5]) { // if the current block is lower than the last by a margin of 1, move to the next index
                        index++;
                        textLines[index] = page_text;
                      }
                      else if ((last_block.width + last_block.transform[4] + 2) >= block.transform[4] || textLines[index].charAt(textLines[index].length - 1) == /\s/) { // if the current block comes before the previous block horizonatally by a margin of 2, add without a space
                        textLines[index] += page_text;
                      }
                      else { // 
                        index++;
                        textLines[index] = page_text;
                      }
                    }
                  }
                } // otherwise move to the next index or the line array
                else // move to the next index
                  index++;
                last_block = block;
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
  var page;
  // >>>> get question data (question and choices) >>>>
  // declare and initialise variable for the question number being worked on
  var n = 0;
  for (page = 0; questions.length < 100 && page < layers.length; page++) { // go through all of the document's pages
    for (var i = 0; i < layers[page].length; i++) { // go through all of the page's lines
      if (layers[page][i] != null && layers[page][i].startsWith((n + 1) + '.')) { // if the text line is not null and the characters is the 'nth' question plus a period (i.e '1.'), then add the question
        questions[n] = new questionData(); // initialise question data
        if (/\w+/.test(layers[page][i].replace((n + 1) + ". ", ""))) { // add question if there is other next character when the question number is removed
          questions[n].question = layers[page][i].replace((n + 1) + ". ", "");
        }
        else { // otherwise, move to the next line and add the question
          i++;
          questions[n].question = layers[page][i]; // add question
        }
        // >>>> adding choises >>>>
        i++;
        // declare and initialise variable for question choice being focused on
        var focus = -1;
        // loop until the page has no more text
        while (i < layers[page].length) {
          // skip the line if it's null or doesn't contain any alphanumeric characters
          if (layers[page][i] == null && !/\w+/.test(layers[page][i])) {
            continue;
          }
          else if (layers[page][i].startsWith((n + 2) + '.')) { // if the line is the next question, move to the next question, backtrack a line, and leave the loop
            n++;
            i--;
            break;
          }
          else if (/^[A-Da-d]\./.test(layers[page][i])) { // if the first characters contain a letter from a to d followed by a period (i.e "B."), initialise focus variable and add text starting from the third character to the choice
            switch (layers[page][i].substring(0, 1)) {
              case 'a', 'A': {
                focus = 0;
                break;
              }
              case 'b', 'B': {
                focus = 1;
                break;
              }
              case 'c', 'C': {
                focus = 2;
                break;
              }
              case 'd', 'D': {
                focus = 3;
                break;
              }
            }
            questions[n].choices[focus] = layers[page][i].substring(3);
          }
          else { // otherwise, depending on the focus, modify question data
            if (focus > -1) { // if the focus is greater than -1, modify the choices
              if (/\w+/.test(questions[n].choices[focus])) // if the question choice of focus contains text, add to it
                questions[n].choices[focus] += " " + layers[page][i];
              else // otherwise, initialise focused choice text
                questions[n].choices[focus] = layers[page][i];
            } // otherwise, modify the question
            else // otherwise, modify question
              questions[n].question += " " + layers[page][i];
          }
          // move to next line
          i++;
          // if the line index is equal to the quantity of lines, move to the next question number
          if (i >= layers[page].length) {
            n++;
          }
        }
      }
    }
  }
  // get document data (answer and reason)
  n = 0; // initialise question number variable to 0
  while (page < layers.length) { // go through the rest of the document's pages
    for (var i = 0; i < layers[page].length; i++) { // go through all of the page's lines
      if (layers[page][i] != null && layers[page][i].startsWith((n + 1) + '.')) { // if the text line is not null and the characters is the 'nth' question plus a period (i.e '1.'), then add the answer
        var answer = ""; // initialise and declare answer variable
        if (/\w+/.test(layers[page][i].replace((n + 1) + ". ", ""))) { // if there are characters when the question number is removed, add the answer character
          answer = layers[page][i].replace((n + 1) + ". ", "").charAt(0);
        }
        else { // otherwise, move to the next line and add the answer character
          i++;
          answer = layers[page][i].charAt(0);
        }
        // >>>> convert to index >>>>
        // move to the next line
        i++;
        // declare and initialise index variable
        var index = -1;
        switch (answer) { // initialise index dependent on the answer character
          case 'a', 'A': {
            index = 0;
            break;
          }
          case 'b', 'B': {
            index = 1;
            break;
          }
          case 'c', 'C': {
            index = 2;
            break;
          }
          case 'd', 'D': {
            index = 3;
            break;
          }
        }
        // set the question answer to the index varaible
        questions[n].answer = index;
        // loop for the remaining lines on the page
        while (i < layers[page].length) {
          // skip line if the line is null or doesn't contain alphanumeric characters
          if (layers[page][i] == null && !/\w+/.test(layers[page][i])) {
            continue;
          }
          else if (layers[page][i].startsWith((n + 2) + '.')) { // otherwise, move to the next question, backtrack a line if the line, and leave the loop is the next question's data
            n++;
            i--;
            break;
          }
          else if (questions[n].reason == null || !/\w/.test(questions[n].reason)) { // otherwise, initialise the reason attribute for the current question if it is null or doesn't contain any alphanumeric characters
            questions[n].reason = layers[page][i];
          }
          else if (layers[page][i].startsWith("SOURCE: ")) { // otherwise, and a new-line character followed by the text if the line starts with the string "SOURCE: "
            questions[n].reason += "\n" + layers[page][i];
          }
          else { // otherwise, add the line to the reason attribute
            questions[n].reason += " " + layers[page][i];
          }
          // move to the next line
          i++;
          // move to the next question if the page's line index equals the quantity of the page's lines
          if (i >= layers[page].length) {
            n++;
          }
        }
      }
    }
    page++; // move to the next page
  }
  // Shuffle questions' data
  for (let i = 0; i < questions.length; i++) {
    for (let u = 0; u < 3; u++) { // go through the first 3 indexes of questions
      const R = Math.floor(Math.random() * 4); // generate a random number
      if (u != R) { // if the random number isn't equal to the current index
        if (u == questions[i].answer) { // change the answer index if the current index equals the answer
          questions[i].answer = R;
        }
        else if (R == questions[i].answer) { // change the answer if the random number equals the number
          questions[i].answer = u
        }
        // switch the questions around
        [questions[i].choices[u], questions[i].choices[R]] = [questions[i].choices[R], questions[i].choices[u]];
      }
    }
  }
  // Shuffle question order
  for (let i = 0; i < questions.length - 1; i++) { // go through the questions
    const R = Math.floor(Math.random() * questions.length); // generate a random number
    if (i != R) { // if the random number isn't equal to the current index
      // switch the questions around
      [questions[i], questions[R]] = [questions[R], questions[i]];
    }
  }  // start the quiz menu
  startMenu();
}

function startMenu() {
  console.log(questions)
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
