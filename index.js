var out = [];
var qna = [];
var choices = [];
var userChoices = [];
var counter = 0;
var starttime = 0;
var stopTimer = false;
var timeTotal;

let output = document.getElementById("result");
let timer = document.getElementById("timer");

function convert() {
    var fr = new FileReader();
    var pdff = new Pdf2TextClass();
    fr.onload = function () {
        pdff.pdfToText(fr.result, null, (text) => { document.getElementById('result').innerText += text; });
    }
    fr.readAsDataURL(document.getElementById('pdffile').files[0])

}

class Pdf2TextClass {
    constructor() {
        var self = this;
        this.complete = 0;

        this.pdfToText = function (data, callbackPageDone, callbackAllDone) {
            console.assert(data instanceof ArrayBuffer || typeof data == 'string');
            var loadingTask = pdfjsLib.getDocument(data);
            loadingTask.promise.then(function (pdf) {


                var total = pdf._pdfInfo.numPages;
                //callbackPageDone( 0, total );        
                for (let i = 1; i <= total; i++) {
                    pdf.getPage(i).then(function (page) {
                        var n = page.pageNumber;
                        page.getTextContent().then(function (textContent) {

                            //console.log(textContent.items[0]);0
                            if (textContent.items != null) {
                                var page_text = "";
                                var last_block = null;
                                var temp = [];
                                var count = 0;
                                for (var k = 0; k < textContent.items.length; k++) {
                                    if (!(textContent.items[k].str.match(/^ *$/) !== null)) {
                                        var block = textContent.items[k];
                                        temp[count] = block;
                                        count++;
                                        if (last_block != null && last_block.str[last_block.str.length - 1] != ' ') {
                                            if (block.x < last_block.x)
                                                page_text += "\r\n";
                                            else if (last_block.y != block.y && (last_block.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null))
                                                page_text += ' ';
                                        }
                                        page_text += block.str + "\n";
                                        last_block = block;
                                    }
                                }
                                out[n - 1] = temp;
                            }
                            ++self.complete;
                            //callbackPageDone( self.complete, total );
                            if (self.complete == total) {
                                //console.log(out);
                                setup();
                            }
                        }); // end  of page.getTextContent().then
                    }); // end of page.then
                } // of for
            });
        }; // end of pdfToText()
    }
}; // end of class

function setup() {
    var temp = []
    var indexQ = [];
    var indexC = [];
    var indexA = [];
    var count = 0;
    for (let i = 1; i < out.length; i++) {
        for (let u = 3; u < out[i].length; u++) {
            temp[count] = out[i][u].str;
            count++;
        }
    }
    count = 1;
    for (let i = 0; indexC.length < 100; i++) {
        if (temp[i] == count + ".") {
            indexQ[count - 1] = i;
            count++;
        }
        else if (temp[i] == "A.") {
            indexC[count - 2] = i;

        }
    }
    count = 1;
    for (let i = indexC.length; count <= 100; i++) {
        if (temp[i] == count + ".") {
            indexA[count - 1] = i;
            count++;
        }
    }

    for (let i = 0; i < 100; i++) {
        let temp0 = [];
        let temp1 = [];
        temp0[0] = allText(indexQ[i] + 1, indexC[i], temp);
        temp1[0] = temp[indexC[i] + 1];
        if (temp[indexC[i] + 2] == "C.") {
            temp1[2] = temp[indexC[i] + 3];
            temp1[1] = temp[indexC[i] + 5];
        }
        else {
            temp1[1] = temp[indexC[i] + 3];
            temp1[2] = temp[indexC[i] + 5];
        }
        temp1[3] = temp[indexC[i] + 7];
        temp0[1] = toAnswer(temp[indexA[i] + 1]);
        if (i < 99) {
            temp0[2] = allText((indexA[i] + 2), indexA[i + 1], temp);
        }
        else {
            temp0[2] = allText((indexA[i] + 2), temp.length - 1, temp);
        }
        qna[i] = temp0;
        choices[i] = temp1;
    }

    shuffle();
    startMenu();
}

startMenu = () => {
    output.innerHTML = '<p>You will have 90 minutes to complete the quiz. If you take longer than the timeframe, you\'ll be given the amount of time you took regardless.</p><br><button id="start" onclick="start()">Start</button>';
    timer.innerText = '01:30:00';
}

start = () => {
    starttime = Date.now();
    let lastTime = starttime;
    setTimeout(updateTimer(starttime, lastTime), 100);
    output.innerHTML = displayQuestion(0) + '<button id="back" &emsp&emsp;<button id="next" onclick="proceed(0)">next&gt&gt</button></label>';

}

updateTimer = () => {
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

proceed = (i) => {
    getChecked(i);
    if (i == counter) {
        counter++;
    }
    if (i < 99) {
        output.innerHTML = displayQuestion(i + 1) + '<button id="back" onclick="goBack(' + (i + 1) + ')">&lt&ltback</button>&emsp;<button id="next" onclick="proceed(' + (i + 1) + ')">next&gt&gt</button></label>';
    }
    else {
        prevSubmit();
    }
}
goBack = (i) => {
    getChecked(i);
    if (i > 1) {
        //document.getElementById(userChoices[i-1]).checked = true;
        output.innerHTML = displayQuestion(i - 1) + '<button id="back" onclick="goBack(' + (i - 1) + ')">&lt&ltback</button>&emsp;<button id="next" onclick="proceed(' + (i - 1) + ')">next&gt&gt</button></label>';
    }
    else if (i > 0) {
        output.innerHTML = displayQuestion(0) + '<button id="back" &emsp&emsp;<button id="next" onclick="proceed(0)">next&gt&gt</button></label>';
    }
}

getChecked = (i) => {
    if (document.getElementById(i + '0') != null) {
        if (document.getElementById(i + '0').checked) {
            userChoices[i] = 0;
        }
        else if (document.getElementById(i + '1').checked) {
            userChoices[i] = 1;
        }
        else if (document.getElementById(i + '2').checked) {
            userChoices[i] = 2;
        }
        else if (document.getElementById(i + '3').checked) {
            userChoices[i] = 3;
        }
    }
}

displayQuestion = (i) => {
    var display = [];
    // if (counter > i && userChoices[i] != null) {
    //     display.push(
    //         '<label>'
    //         + '<h3>' + qna[i][0] + '</h3>'
    //         + '<input type="radio" name="choice' + i + '" id="0">'
    //         + '<label for="0">' + choices[i][0] + '</label><br>'
    //         + '<input type="radio" name="choice' + i + '" id="1">'
    //         + '<label for="1">' + choices[i][1] + '</label><br>'
    //         + '<input type="radio" name="choice' + i + '" id="2">'
    //         + '<label for="2">' + choices[i][2] + '</label><br>'
    //         + '<input type="radio" name="choice' + i + '" id="3">'
    //         + '<label for="3">' + choices[i][3] + '</label><br>'
    //         + '<button id="back" onclick="goBack(' + i + ')">&lt&ltback</button>&emsp;<button id="next" onclick="proceed(' + i + ')">next&gt&gt</button>'
    //         + '</label>'
    //     )
    // }
    if (counter > i && userChoices[i] == 0) {
        display.push(
            '<label>' + qna[i][0] + '<br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '0" checked>'
            + '<label for="' + i + '0">' + "A. " + choices[i][0] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '1">'
            + '<label for="' + i + '1">' + "B. " + choices[i][1] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '2">'
            + '<label for="' + i + '2">' + "C. " + choices[i][2] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '3">'
            + '<label for="' + i + '3">' + "D. " + choices[i][3] + '</label><br></label>'
        )
    }
    else if (counter > i && userChoices[i] == 1) {
        display.push(
            '<label>' + qna[i][0] + '<br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '0">'
            + '<label for="' + i + '0">' + choices[i][0] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '1" checked>'
            + '<label for="' + i + '1">' + choices[i][1] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '2">'
            + '<label for="' + i + '2">' + choices[i][2] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '3">'
            + '<label for="' + i + '3">' + choices[i][3] + '</label><br></label>'
        )
    }
    else if (counter > i && userChoices[i] == 2) {
        display.push(
            '<label>' + qna[i][0] + '<br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '0">'
            + '<label for="' + i + '0">' + choices[i][0] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '1">'
            + '<label for="' + i + '1">' + choices[i][1] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '2" checked>'
            + '<label for="' + i + '2">' + choices[i][2] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '3">'
            + '<label for="' + i + '3">' + choices[i][3] + '</label><br></label>'
        )
    }
    else if (counter > i && userChoices[i] == 3) {
        display.push(
            '<label>' + qna[i][0] + '<br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '0">'
            + '<label for="' + i + '0">' + choices[i][0] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '1">'
            + '<label for="' + i + '1">' + choices[i][1] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '2">'
            + '<label for="' + i + '2">' + choices[i][2] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '3" checked>'
            + '<label for="' + i + '3">' + choices[i][3] + '</label><br></label>'
        )
    }
    else {
        display.push(
            '<label>' + qna[i][0] + '<br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '0">'
            + '<label for="' + i + '0">' + "A. " + choices[i][0] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '1">'
            + '<label for="' + i + '1">' + "B. " + choices[i][1] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '2">'
            + '<label for="' + i + '2">' + "C. " + choices[i][2] + '</label><br>'
            + '<input type="radio" name="choice' + i + '" id="' + i + '3">'
            + '<label for="' + i + '3">' + "D. " + choices[i][3] + '</label><br></label>'
        )
    }
    return display;

}

prevSubmit = () => {
    let temp = '';
    for (let i = 0; i < 100; i++) {
        temp += displayQuestion(i);
    }
    output.innerHTML = '<button id="submit" onclick="submit()">Submit</button><br>' + temp + '<button id="submit" onclick="submit()">Submit</button>';
}

submit = () => {
    stopTimer = true;
    timeTotal = Date.now() - starttime;
    const hour = Math.floor(timeTotal / 3600000);
    const minu = Math.floor((timeTotal - hour * 3600000) / 60000);
    const seco = Math.floor((timeTotal - hour * 3600000 - minu * 60000) / 1000);
    let score = 0;
    let temp = '';
    for (let i = 0; i < 100; i++) {
        temp += displayAnswer(i);
        if (userChoices[i] == qna[i][1]) {
            score++;
        }
    }
    output.innerHTML = '<p>' + score + '/100</p><p>It took ' + String(hour).padStart(hour.length + 1, '0') + ':' + String(minu).padStart(2, '0') + ':' + String(seco).padStart(2, '0') + '</p>' + temp;

}

displayAnswer = (i) => {
    var display = [];
    display.push(
        '<p>' + qna[i][0] + '<br>'
        + 'A. ' + choices[i][0] + '<br>'
        + 'B. ' + choices[i][1] + '<br>'
        + 'C. ' + choices[i][2] + '<br>'
        + 'D. ' + choices[i][3] + '<br><br>'
        + toLetter(qna[i][1]) + '&emsp;You chose ' + toLetter(userChoices[i]) + '<br>'
        + qna[i][2] + '</p><br>'
    )
    return display;
}

toLetter = (i) => {
    switch (i) {
        case 0: {
            return 'A. ';
            break;
        }
        case 1: {
            return 'B. ';
            break;
        }
        case 2: {
            return 'C. ';
            break;
        }
        case 3: {
            return 'D. ';
            break;
        }
        default: {
            return '';
        }
    }
}

allText = (i1, i2, temp) => {
    let k = "";
    for (let u = 0; u < i2 - i1; u++) {
        k += temp[i1 + u] + " "
    }
    return k;
}

toAnswer = (str) => {
    switch (str) {
        case "A": {
            return 0;
            break;
        }
        case "B": {
            return 1;
            break;
        }
        case "C": {
            return 2;
            break;
        }
        case "D": {
            return 3;
            break;
        }
        default: {
            return -1;
        }
    }
}

shuffle = () => {
    for (let u = 0; u < 100; u++) {
        for (let i = 3; i >= 0; i--) {
            const R = Math.floor(Math.random() * (i + 1));
            [choices[u][i], choices[u][R]] = [choices[u][R], choices[u][i]];
            if (i == qna[u][1]) {
                qna[u][1] = R;
            }
            else if (R == qna[u][1]) {
                qna[u][1] = i;
            }
        }
    }

    for (let i = 0; i < 100; i++) {
        const R = Math.floor(Math.random() * (i + 1));
        [qna[i], qna[R], choices[i], choices[R]] = [qna[R], qna[i], choices[R], choices[i]];
    }
    for(let i = 0; i < 100; i++){
        qna[i][0] = (i + 1) + '. ' + qna[i][0];
    }
}
