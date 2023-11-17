const flipbtn = document.getElementById("flip-btn");
const optionContainer = document.querySelector(".option-container");
const gameboardCon = document.getElementById("gamesboard-container");
const startbtn = document.getElementById("start-btn");
const infoDisplay = document.getElementById("info");
const turnDisplay = document.getElementById("turn-display");
//option choosing
let angle = 0;
function flip() {
    const optionShips = Array.from(optionContainer.children);
    angle = angle === 0 ? 90 : 0

    optionShips.forEach(ship => {
        ship.style.transform = `rotate(${angle}deg)`
    });
    if (flipbtn.classList.contains("active")) {
        flipbtn.classList.remove('active');
    } else {
        flipbtn.classList.add("active");
    }
}

flipbtn.addEventListener("click", flip);

//creating boards
const width = 10;
function createBoard(color, user) {
    const gameboardContainer = document.createElement("div");
    gameboardContainer.classList.add("game-board");
    gameboardContainer.style.backgroundColor = `${color}`;
    gameboardContainer.id = user;

    for (let i = 0; i < width * width; i++) {
        const block = document.createElement("div");
        block.classList.add("block");
        block.id = i;
        gameboardContainer.append(block);
    }
    gameboardCon.appendChild(gameboardContainer);
}

createBoard("white", "player");
createBoard("white", "computer");

class Ship {
    constructor(name, length) {
        this.length = length;
        this.number_hits = 0;
        this.name = name;
        this.sunk = false;
    }

    hit() {
        this.number_hits++;
        if (this.number_hits === this.length) {
            this.sunk = true;
        }
    }

    isSunk() {
        return this.sunk;
    }
}

const destroyer = new Ship("destroyer", 2);
const submarine = new Ship("submarine", 3);
const cruiser = new Ship("cruiser", 3);
const battleship = new Ship("battleship", 4);
const carrier = new Ship("carrier", 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
    let validStart = isHorizontal ? startIndex <= width * width - ship.length ? startIndex : width * width - ship.length :
        startIndex <= width * width - width * ship.length ? startIndex :
            startIndex - ship.length * width + width;

    let shipBlocks = [];

    for (let i = 0; i < ship.length; i++) {
        if (isHorizontal) {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i]);
        } else {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i * width])
        }
    }

    let valid;

    if (isHorizontal) {
        shipBlocks.every((_shipBlock, index) =>
            valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1))
        )
    } else {
        shipBlocks.every((_shipBlock, index) =>
            valid = shipBlocks[0].id < 90 + (width * index + 1)
        )
    }

    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains("taken"));

    return { shipBlocks, valid, notTaken }
}

class Gameboard {
    constructor() {
        this.ships = [];
        this.ships = [];
        this.playerHits = [];
        this.playerSunkShips = [];
        this.computerHits = [];
        this.computerSunkShips = [];
        this.gameOver = false;
    }

    placeShip(user, ship, startId) {
        const allBoardBlocks = document.querySelectorAll(`#${user} div`);
        let randomBoolean = Math.random() < 0.5;
        let isHorizontal = user === "player" ? angle === 0 : randomBoolean;
        let randomStartIndex = Math.floor(Math.random() * width * width);

        let startIndex = startId ? startId : randomStartIndex;

        const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

        if (valid && notTaken) {
            shipBlocks.forEach(shipBlock => {
                shipBlock.classList.add(ship.name);
                shipBlock.classList.add("taken");
            });
            this.ships.push({ ship, startId, isHorizontal });
        } else {
            if (user === "computer") this.placeShip(user, ship, startId)
            if (user === "player") notDropped = true
        }
    }

    receiveHit(user, targetBlock) {
        if (targetBlock.classList.contains("taken")) {
            targetBlock.classList.add("boom");
            infoDisplay.textContent = `You hit the ${user === "player" ? "computer" : "player"} ship!`;

            let classes = Array.from(targetBlock.classList);
            classes = classes.filter(className => className !== "block");
            classes = classes.filter(className => className !== "boom");
            classes = classes.filter(className => className !== "taken");

            if (user === "player") {
                this.computerHits.push(...classes);
                this.checkScore("computer", this.computerHits, this.computerSunkShips);
            } else {
                this.playerHits.push(...classes);
                this.checkScore("player", this.playerHits, this.playerSunkShips);
            }
        }

        if (!targetBlock.classList.contains("taken")) {
            infoDisplay.textContent = "Nothing hit this time";
            targetBlock.classList.add("empty");
        }
    }

    checkScore(user, userHits, userSunkShips) {
        function checkShip(shipName, shipLength) {
            if (userHits.filter(storedShipName => storedShipName === shipName).length === shipLength) {
                if (user === 'player') {
                    infoDisplay.textContent = `you sunk the computers's ${shipName}`
                    playerHits = userHits.filter(storedShipName => storedShipName !== shipName)
                }
                if (user === 'computer') {
                    infoDisplay.textContent = `computer sunk the your ${shipName}`
                    computerHits = userHits.filter(storedShipName => storedShipName !== shipName)
                }
                userSunkShips.push(shipName);
            }
        }

        checkShip("destroyer", 2)
        checkShip("submarine", 3)
        checkShip("cruiser", 3)
        checkShip("battleship", 4)
        checkShip("carrier", 4)

        console.log("Player hits ", playerHits)
        console.log("Player Sunk Ships", playerSunkShips)

        if (playerSunkShips.length === 5) {
            infoDisplay.textContent = 'you sunk all the computers ships. You Won!';
            gameOver = true;
        }
        if (computerSunkShips.length === 5) {
            infoDisplay.textContent = "The computer has sunk all your ships. You lost!";
            gameOver = true;
        }
    }
}

const gameboard = new Gameboard();
ships.forEach(ship => gameboard.placeShip("computer", ship));

//Drag player ships
let draggedShip;
const optionShips = Array.from(optionContainer.children);
optionShips.forEach(optionShip => optionShip.addEventListener("dragstart", dragStart));

const allPlayerBlocks = document.querySelectorAll("#player div");
allPlayerBlocks.forEach(playerBlock => {
    playerBlock.addEventListener("dragover", dragOver);
    playerBlock.addEventListener("drop", dropShip);
});

function dragStart(e) {
    notDropped = false;
    draggedShip = e.target;
}

function dragOver(e) {
    e.preventDefault();
    const ship = ships[draggedShip.id];
    highlightArea(e.target.id, ship);
}

function dropShip(e) {
    const startId = e.target.id;
    const ship = ships[draggedShip.id];
    gameboard.placeShip("player", ship, startId);
    if (!notDropped) {
        draggedShip.remove();
    }
}

// Add Hightlight
function highlightArea(startIndex, ship) {
    const allBoardBlocks = document.querySelectorAll("#player div");
    let isHorizontal = angle === 0;

    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add("hover");
            setTimeout(() => shipBlock.classList.remove('hover'), 500);
        })
    }
}

//Game functionality
let gameOver = false;
let playerTurn;

function startGame() {
    if (playerTurn === undefined) {
        if (optionContainer.children.length != 0) {
            infoDisplay.textContent = "Please place all your pieces first"
        } else {
            const allBoardBlocks = document.querySelectorAll("#computer div");
            allBoardBlocks.forEach(block => block.addEventListener("click", handleClick));
            playerTurn = true;
            turnDisplay.textContent = "You go";
            infoDisplay.textContent = "The game has started";
        }
    }
}

startbtn.addEventListener("click", startGame);

function handleClick(e) {
    if (!gameOver) {
        gameboard.receiveHit("player", e.target);
        playerTurn = false;
        const allBoardBlocks = document.querySelectorAll("#computer div");
        allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)));
        setTimeout(computerGo, 3000);
    }
}

function computerGo() {
    if (!gameOver) {
        turnDisplay.textContent = "Computer go";
        infoDisplay.textContent = "The computer is thinking...";

        setTimeout(() => {
            let randomGo = Math.floor(Math.random() * width * width)
            const allBoardBlocks = document.querySelectorAll("#player div");

            gameboard.receiveHit("computer", allBoardBlocks[randomGo]);
        }, 3000)

        setTimeout(() => {
            playerTurn = true
            turnDisplay.textContent = "You Go!"
            infoDisplay.textContent = "Please take your go."
            const allBoardBlocks = document.querySelectorAll("#computer div");
            allBoardBlocks.forEach(block => block.addEventListener('click', handleClick))
        }, 6000);
    }
}

