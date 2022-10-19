const submitButton = document.getElementById("submit");

submitButton.addEventListener("click", parseInput);

function storeGrammarHelper(input) {
  let indexOfFirstDivider = input.indexOf("-");
  let indexOfSecondDivider = input.indexOf(">");
  let grammarInput = input.slice(0, indexOfFirstDivider - 1);
  let grammarOutput = input.slice(indexOfSecondDivider + 2, input.length);

  return {
    input: grammarInput,
    output: grammarOutput,
  };
}

function storeGrammar(input) {
  let storeString = "";
  let grammarArray = [];

  for (let i = 0; i < input.length; i++) {
    if (input[i] === "~") {
      grammarArray.push(storeGrammarHelper(storeString));
      storeString = "";
      i++;
    } else {
      storeString += input[i];
    }
  }

  return grammarArray;
}

const isUpperCase = (string) => /^[A-Z]*$/.test(string);

function canExtraClosureBePerformed(closureArray) {
  let lenOfArray = closureArray.length - 1;
  let lastItem = closureArray[lenOfArray];
  let outputString = lastItem.output;
  let positionOfDot = outputString.indexOf(".");

  if (
    positionOfDot === outputString.length - 1 ||
    !isUpperCase(outputString[positionOfDot + 1])
  ) {
    return false;
  } else {
    return true;
  }
}

function getClosurePushElement(obj, grammarArray) {
  let outputString = obj.output;
  let positionOfDot = outputString.indexOf(".");
  let nextProductionToAdd = outputString[positionOfDot + 1];

  let grammarArrayFind = grammarArray.filter(
    (item) => item.input === nextProductionToAdd
  );

  let closuredArray = grammarArrayFind.map((item) => {
    return {
      input: item.input,
      output: "." + item.output,
    };
  });

  return closuredArray;
}

function performClosure(closureInputArray, grammarArray) {
  let closureReturnOutputArray = [];

  for (let closureElement of closureInputArray) {
    let closureOutputArray = [];
    closureOutputArray.push(closureElement);
    while (canExtraClosureBePerformed(closureOutputArray)) {
      let lenOfArray = closureOutputArray.length - 1;
      let lastItem = closureOutputArray[lenOfArray];
      let closureElementsReceived = getClosurePushElement(
        lastItem,
        grammarArray
      );
      closureOutputArray = closureOutputArray.concat(closureElementsReceived);
    }

    closureReturnOutputArray =
      closureReturnOutputArray.concat(closureOutputArray);
  }

  return closureReturnOutputArray;
}

function findGotoElements(stateElements) {
  let gotoElements = [];

  for (let stateClosuresObj of stateElements) {
    let stateClosureObjOutput = stateClosuresObj.output;
    let positionOfDot = stateClosureObjOutput.indexOf(".");

    if (positionOfDot !== stateClosureObjOutput.length - 1) {
      let goToChar = stateClosureObjOutput[positionOfDot + 1];

      if (!isUpperCase(goToChar)) {
        positionOfDot = positionOfDot + 2;
        while (
          !isUpperCase(stateClosureObjOutput[positionOfDot]) &&
          positionOfDot < stateClosureObjOutput.length
        ) {
          goToChar += stateClosureObjOutput[positionOfDot];
          positionOfDot++;
        }
      }

      if (!gotoElements.includes(goToChar)) {
        gotoElements.push(goToChar);
      }
    }
  }

  return gotoElements;
}

function findStateClosureInput(state, gotoInput) {
  let closureInput = state.stateElements.filter((stateElemObj) => {
    let positionOfDot = stateElemObj.output.indexOf(".");
    let output = stateElemObj.output;
    let goToChar = output[positionOfDot + 1];

    if (!isUpperCase(goToChar)) {
      positionOfDot = positionOfDot + 2;
      while (
        !isUpperCase(output[positionOfDot]) &&
        positionOfDot < output.length
      ) {
        goToChar += output[positionOfDot];
        positionOfDot++;
      }
    }

    return goToChar === gotoInput;
  });

  closureInput = closureInput.map((stateElemObj) => {
    let positionOfDot = stateElemObj.output.indexOf(".");

    return {
      input: stateElemObj.input,
      output:
        stateElemObj.output.slice(0, positionOfDot) +
        stateElemObj.output.slice(
          positionOfDot + 1,
          positionOfDot + 1 + gotoInput.length
        ) +
        "." +
        stateElemObj.output.slice(positionOfDot + gotoInput.length + 1),
    };
  });

  return closureInput;
}

function isStateAlreadyPresent(closureOutput, stateArray) {
  for (let state of stateArray) {
    if (state.stateElements.length === closureOutput.length) {
      let stateEqualCount = 0;
      for (let i = 0; i < closureOutput.length; i++) {
        let stateArrayObj = state.stateElements[i];
        let closureOutputObj = closureOutput[i];

        if (
          stateArrayObj.input === closureOutputObj.input &&
          stateArrayObj.output === closureOutputObj.output
        ) {
          stateEqualCount++;
        }
      }

      if (stateEqualCount === closureOutput.length) {
        return state.stateNo;
      }
    }
  }
  return -1;
}

function isAcceptingState(closureOutput, grammarArray) {
  let acceptingInput = grammarArray[0].input;
  let acceptingOutput = grammarArray[0].output + ".";

  for (let closureObj of closureOutput) {
    if (
      closureObj.input === acceptingInput &&
      closureObj.output === acceptingOutput
    ) {
      return true;
    }
  }

  return false;
}

function isReducingState(closureOutput, grammarArray) {
  let reduceStateArray = closureOutput.filter((state) => {
    return (
      state.output[state.output.length - 1] === "." &&
      state.input !== grammarArray[0].input
    );
  });

  return reduceStateArray.length > 0 ? true : false;
}

function performStateTransition(stateArray, grammarArray) {
  let newStateArray = [];
  newStateArray = newStateArray.concat(stateArray);

  while (newStateArray.length !== 0) {
    let noOfNewStates = 0;
    let newStateFormed = [];

    for (let state of newStateArray) {
      let goToInputs = findGotoElements(state.stateElements);

      for (let goToSymbol of goToInputs) {
        let newState = {
          stateType: "Normal State",
          stateNo: 0,
          stateTransitions: {},
          stateElements: [],
          closureInput: [],
        };

        let closureInputForState = findStateClosureInput(state, goToSymbol);
        let closureOutputAfterGoto = performClosure(
          closureInputForState,
          grammarArray
        );

        newState.closureInput = closureInputForState;
        newState.stateElements = closureOutputAfterGoto;

        let isNewState = isStateAlreadyPresent(
          closureOutputAfterGoto,
          stateArray
        );

        if (isNewState === -1) {
          noOfNewStates++;

          newState.stateNo = stateArray.length - 1 + noOfNewStates;

          state.stateTransitions[goToSymbol] = newState.stateNo;

          // checking whether the state is accepting state or not
          if (isAcceptingState(closureOutputAfterGoto, grammarArray)) {
            newState.stateType = "Accepting State";
          }

          // checking whether the state is reducing state or not
          if (isReducingState(closureOutputAfterGoto, grammarArray)) {
            newState.stateType = "Reducing State";
          }
          newStateFormed.push(newState);
        } else {
          // then add to state transtion of already present state
          state.stateTransitions[goToSymbol] = isNewState;
        }
      }
    }

    newStateArray = newStateFormed;
    stateArray = stateArray.concat(newStateFormed);
  }

  return stateArray;
}

function constructStateArray(grammarArray) {
  let stateArray = [];

  let initialInputArray = [
    {
      input: grammarArray[0].input,
      output: "." + grammarArray[0].output,
    },
  ];

  let initialState = {
    stateType: "Starting State",
    stateNo: 0,
    stateTransitions: {},
    stateElements: performClosure(initialInputArray, grammarArray),
    closureInput: initialInputArray,
  };

  stateArray.push(initialState);
  stateArray = performStateTransition(stateArray, grammarArray);
  return stateArray;
}

function computeFollowForGrammar(grammarArray, terNonTermObj) {
  let followObj = {};

  followObj[grammarArray[0].input] = ["$"];

  for (let toFindFollowTerminal of terNonTermObj.terminals) {
    let followOfTerminal = [];

    let stateContainingTerminal = grammarArray.filter((grammarState) => {
      return grammarState.output.includes(toFindFollowTerminal);
    });

    for (states of stateContainingTerminal) {
      let indexOfTerminal = states.output.indexOf(toFindFollowTerminal);
      if (indexOfTerminal === states.output.length - 1) {
        let followOfInput = followObj[states.input];
        for (let inputChar of followOfInput) {
          if (!followOfTerminal.includes(inputChar)) {
            followOfTerminal.push(inputChar);
          }
        }
      } else {
        // if for follow the input production does not lie in the end of output

        // then it can either be a prouction  or lower case char

        // in case of production we need to find First
        let nonTerminalString = states.output[++indexOfTerminal];
        if (!followOfTerminal.includes(nonTerminalString)) {
          followOfTerminal.push(nonTerminalString);
        }
      }
    }

    followObj[toFindFollowTerminal] = followOfTerminal;
  }

  return followObj;
}

function computeTerminalsAndNonTerminals(grammarArray) {
  let obj = {
    nonTerminals: ["$"],
    terminals: [],
  };

  for (let i = 1; i < grammarArray.length; i++) {
    if (!obj.terminals.includes(grammarArray[i].input)) {
      obj.terminals.push(grammarArray[i].input);
    }

    let nonTerminal = "";
    let output = grammarArray[i].output;
    for (let j = 0; j < output.length; j++) {
      if (!isUpperCase(output[j])) {
        nonTerminal += output[j];

        while (!isUpperCase(output[++j]) && j < output.length) {
          nonTerminal += output[j];
        }
        if (!obj.nonTerminals.includes(nonTerminal)) {
          obj.nonTerminals.push(nonTerminal);
        }
        nonTerminal = "";
      }
    }
  }

  return obj;
}

function computeSlrParsingTable(
  stateArray,
  followObj,
  termNonTerObj,
  grammarArray
) {
  let parsingTableArray = [];

  for (let state of stateArray) {
    let pushActionObj = { actions: {}, gotos: {} };
    for (const actions of termNonTerObj.nonTerminals) {
      pushActionObj.actions[actions] = [];
    }

    for (const gotos of termNonTerObj.terminals) {
      pushActionObj.gotos[gotos] = [];
    }

    for (const [key, value] of Object.entries(state.stateTransitions)) {
      if (isUpperCase(key)) {
        pushActionObj.gotos[key].push(value);
      } else {
        pushActionObj.actions[key].push("s" + value);
      }
    }

    if (state.stateType === "Accepting State") {
      pushActionObj.actions["$"].push("Accept");
    } else if (state.stateType === "Reducing State") {
      let arrayOfReduce = state.stateElements.filter((reduceState) => {
        return reduceState.output[reduceState.output.length - 1] === ".";
      });

      let followToFind = arrayOfReduce[0].input;
      let reduceOpToFind = arrayOfReduce[0].output.slice(
        0,
        arrayOfReduce[0].output.length - 1
      );
      let reduceNo = grammarArray.findIndex((state) => {
        return state.output === reduceOpToFind;
      });
      let followArray = followObj[followToFind];
      for (let followChar of followArray) {
        pushActionObj.actions[followChar].push("r" + reduceNo);
      }
    }

    parsingTableArray.push(pushActionObj);
  }
  return parsingTableArray;
}

function prepareInput(parsingInput, termNonTermObj) {
  console.log("parsing input is: ", parsingInput);
  let toCheckString = "";
  let inputBufferArray = [];
  for (let char of parsingInput) {
    toCheckString += char;

    if (termNonTermObj.nonTerminals.includes(toCheckString)) {
      inputBufferArray.push(toCheckString);
      toCheckString = "";
    }
  }
  return inputBufferArray;
}

function calculateNoOfPop(productionOutput, termNonTermObj) {
  let toCheckString = "";
  let totalNoOfPop = 0;

  for (let i = 0; i < productionOutput.length; i++) {
    if (!isUpperCase(productionOutput[i])) {
      toCheckString = productionOutput[i];

      while (!termNonTermObj.nonTerminals.includes(toCheckString)) {
        toCheckString += productionOutput[++i];
      }
    }
    totalNoOfPop++;
  }

  return totalNoOfPop * 2;
}

function computeParsingTable(
  inputBufferArray,
  slrTable,
  grammarArray,
  termNonTermObj
) {
  let parsingTable = [];
  let stack = ["$", 0];
  let actionOutput = "";
  let parsingTablePush = [];
  while (stack.length !== 0 && actionOutput !== "Accept") {
    let pushActionObj = { actions: {}, gotos: {} };

    parsingTablePush.push(stack.join(""));
    parsingTablePush.push(inputBufferArray.join(""));

    let stackInput = stack[stack.length - 1];
    let inputBufferInput = inputBufferArray[0];
    actionOutput = slrTable[stackInput].actions[inputBufferInput][0];

    parsingTablePush.push(
      `[${stackInput},${inputBufferInput}]=${actionOutput}`
    );

    if (actionOutput[0] === "s") {
      inputBufferArray.shift();
      parsingTablePush.push("");
      parsingTablePush.push("Shift");

      stack.push(inputBufferInput);
      stack.push(parseInt(actionOutput[1]));
    } else if (actionOutput[0] === "r") {
      let reduceNo = parseInt(actionOutput[1]);
      let reducingProduction = grammarArray[reduceNo];
      let noOfPop = calculateNoOfPop(reducingProduction.output, termNonTermObj);
      for (let i = 1; i <= noOfPop; i++) {
        stack.pop();
      }
      let gotoInput = stack[stack.length - 1];
      let gotoOutput = slrTable[gotoInput].gotos[reducingProduction.input][0];
      stack.push(reducingProduction.input);
      stack.push(gotoOutput);

      parsingTablePush.push(
        `[${gotoInput},${reducingProduction.input}]=${gotoOutput}`
      );
      parsingTablePush.push(
        `Reduce by ${reducingProduction.input} -> ${reducingProduction.output}`
      );
    } else {
      parsingTablePush.push("");
      parsingTablePush.push("Accept");
    }

    parsingTable.push(parsingTablePush);
    parsingTablePush = [];
    //console.log(parsingTable);
  }

  return parsingTable;
}

function parseInput() {
  const grammarInput = document.getElementById("grammar-input").value;
  let parsingInput = document.getElementById("parsing-input").value;
  parsingInput = parsingInput + "$";
  let grammarArray = storeGrammar(grammarInput);
  console.log("grammar array is: ", grammarArray);
  let stateArray = constructStateArray(grammarArray);
  console.log("state array is: ", stateArray);
  drawStates(stateArray);
  let terminalNonTerminalObj = computeTerminalsAndNonTerminals(grammarArray);
  console.log("terminal and non-terminal obj: ", terminalNonTerminalObj);
  let followObj = computeFollowForGrammar(grammarArray, terminalNonTerminalObj);
  console.log("follow object is: ", followObj);
  let slrParsingTable = computeSlrParsingTable(
    stateArray,
    followObj,
    terminalNonTerminalObj,
    grammarArray
  );

  for (let i = 0; i < slrParsingTable.length; i++) {
    console.log("----state is: ", i);
    console.log("actions is: ");
    for (const [key, value] of Object.entries(slrParsingTable[i].actions)) {
      console.log("action input is: ", key, " action output is: ", value);
    }

    console.log("gotos is: ");
    for (const [key, value] of Object.entries(slrParsingTable[i].gotos)) {
      console.log("goto input is: ", key, " goto output is: ", value);
    }
  }

  console.log("slr parsing table : ", slrParsingTable);

  let inputBuffer = prepareInput(parsingInput, terminalNonTerminalObj);
  console.log("input buffer : ", inputBuffer);

  let parsingTableOutput = computeParsingTable(
    inputBuffer,
    slrParsingTable,
    grammarArray,
    terminalNonTerminalObj
  );

  console.log("parsing table output: ", parsingTableOutput);
}

class CreateCircle {
  constructor(stateObj, x, y) {
    this.stateObj = stateObj;
    this.h = x;
    this.k = y;
    this.textX = 0;
    this.textY = 0;
    this.r = 0;
  }

  draw(stateArray) {
    console.log("drawing the state: ",this.stateObj.stateNo);
    let noOfElements = this.stateObj.stateElements.length;
    this.r = 45 + (noOfElements - 1) * 6;

    if(this.stateObj.stateNo !== 0) {
      this.h = this.h + this.r;
    }
    console.log('h',this.h,'k', this.k, 'r',this.r);
    c.beginPath();
    c.arc(this.h, this.k, this.r, 0, Math.PI * 2, false);
    c.stroke();

    this.textX = this.h - (8 / 10) * this.r + noOfElements * 4;
    this.textY =
      this.k -
      ((noOfElements - 1) / noOfElements) * this.r +
      noOfElements * 4.5;
    let stateElements = this.stateObj.stateElements;
    for (let stateObj of stateElements) {
      c.fillText(
        `${stateObj.input} -> ${stateObj.output}`,
        this.textX,
        this.textY
      );
      this.textY += 17;
    }

    let stateTransArr = Object.entries(this.stateObj.stateTransitions);

    let linePointsToDraw = this.getPointsForLines(
      this.h,
      this.k,
      this.r,
      stateTransArr.length
    );
    return this.drawLines(linePointsToDraw, stateTransArr,stateArray);
  }

  getYCorForCircle(xCor) {
    return this.k - Math.sqrt(Math.pow(this.r, 2) - Math.pow(xCor - this.h, 2));
  }

  drawLines(lineInitialPointArray, stateTransArr, stateArray) {
    if (stateTransArr.length === 0) {
      return [];
    }
    let nextStatesPointsToDraw = [];
    let dx = 20 + (stateTransArr.length / 10) * 25;
    let dy = -50 - (stateTransArr.length / 10) * 300;
    let dyDec = (-dy / stateTransArr.length) * 2;
    for (let i = 0; i < stateTransArr.length; i++) {
      let startX = lineInitialPointArray[i][0];
      let startY = lineInitialPointArray[i][1];
      let endX = startX + dx + (this.h + this.r - startX);
      let endY = startY + dy;

      if( i>1 ) {
        let prevStateNo = stateTransArr[i-1][1];
        let prevStaNoOfElem = stateArray[ prevStateNo].stateElements.length;
        let prevStateRadius = 50 + (prevStaNoOfElem - 1) * 6 ;
        let currtStateNo = stateTransArr[i][1];
        let currStateNoOfElem = stateArray[ currtStateNo].stateElements.length;
        let currentStateRadius = 50 + (currStateNoOfElem - 1) * 6 ;
        endY= nextStatesPointsToDraw[i-1][1] + prevStateRadius + currentStateRadius + 5;
      } 
      
      c.beginPath();
      c.moveTo(startX, startY);
      c.lineTo(endX, endY);
      c.stroke();
      c.beginPath();
      let midX = (startX + endX) / 2;
      let midY = (startY + endY) / 2;
      c.fillText(stateTransArr[i][0], midX - 5, midY - 5);
      dy += dyDec;
      nextStatesPointsToDraw.push([endX, endY]);
    }
    return nextStatesPointsToDraw;
  }

  getPointsForLines(x, y, r, noOfElements) {
    if (noOfElements === 0) {
      return;
    }
    let initialLineX = x + (3 / 10) * r;
    let initialLineY = this.getYCorForCircle(initialLineX);
    let lineStartingPointArray = [];

    lineStartingPointArray.push([initialLineX, initialLineY]);
    let incrPer = (12 - noOfElements) / 10;
    for (let i = 1; i <= parseInt((noOfElements - 1) / 2); i++) {
      initialLineX = initialLineX + incrPer * (x + r - initialLineX);
      initialLineY = this.getYCorForCircle(initialLineX);
      lineStartingPointArray.push([initialLineX, initialLineY]);
      incrPer += 0.2;
    }

    let j = lineStartingPointArray.length;
    if ((noOfElements - j) % 2 === 0 && noOfElements % 2 === 1) {
      j--;
    }
    while (lineStartingPointArray.length !== noOfElements) {
      j--;
      let xToPush = lineStartingPointArray[j][0];
      let yToPush = lineStartingPointArray[j][1];
      yToPush = yToPush + (y - yToPush) * 2;
      lineStartingPointArray.push([xToPush, yToPush]);
    }
    return lineStartingPointArray;
  }
}

function drawStates(stateArray) {
  let arcArray = [];

  let statesToDrawObj = {
    states: [0],
    statesPoints: [[150, canvas.height / 2]],
  };

  let alreadyDrawnStates = [];

  while (statesToDrawObj.states.length !== 0) {
    let newStatesToReplace = [];
    let newPointsToReplace= [];
    for (let i = 0; i < statesToDrawObj.states.length; i++) {
      let stateNo = statesToDrawObj.states[i];
      let x = statesToDrawObj.statesPoints[i][0];
      let y = statesToDrawObj.statesPoints[i][1];

      if (!alreadyDrawnStates.includes(stateNo)) {
        console.log("going to draw the state no from if: ",stateNo);
        let circleObj = new CreateCircle(stateArray[stateNo], x, y);
        let returnedPoints = circleObj.draw(stateArray);
        console.log("returned points is: ",returnedPoints);
        alreadyDrawnStates.push(stateNo);
        for (const [key,value] of Object.entries(
          stateArray[stateNo].stateTransitions
        )) {
          newStatesToReplace.push(value);
        }

        for(let pointsArray of returnedPoints) {
          newPointsToReplace.push(pointsArray);
        }
      } else {
        c.fillText(`State No: ${stateNo}`,x + 5,y)
      }
    }
    statesToDrawObj.states = newStatesToReplace;
    statesToDrawObj.statesPoints = newPointsToReplace;
    console.log("states to draw obj array is: ",statesToDrawObj);
  }
}

// canvas code

let canvas = document.querySelector("canvas");

canvas.width = window.innerWidth - 70;
canvas.height = window.innerHeight * 4;

let c = canvas.getContext("2d");
c.font = "17px Tahoma";
c.strokeStyle = "rgba(1,1,1,1)";
