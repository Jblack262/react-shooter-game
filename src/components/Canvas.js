import React, { useState } from 'react';
import Sketch from 'react-p5';


let canvasWidth;
let canvasHeight;

let isGameStarted = false;

let x
let y;

let playerSize = 70;

let { collisionRight, collisionLeft, collisionTop, collisionBottom } = false;

let { moveUp, moveDown, moveLeft, moveRight } = false;

let projectiles = [];
let projectileReady = true;
let fullAuto;

//upgrades initial costs
let speedCost = 30;
let fireRateCost = 10;
let fullAutoCost = 250;
let projectileSpeedCost = 10;
let projectileSizeCost = 50;
let accuracyCost = 10;
let penetrationCost = 70;

let enemies = [];
let enemySpeed = 4;
let enemySize = 50;
let enemySpawnRate = 1000;
let maxEnemies = 15;

let disableEnemySpawning = false;
function Canvas() {

    const setup = (p5, canvasParentRef) => {
        canvasWidth = window.innerWidth - 300;
        canvasHeight = window.innerHeight;

        x = canvasWidth / 2;
        y = canvasHeight / 2;
        // use parent to render the canvas in this ref
        // (without that p5 will render the canvas outside of your component)
        p5.createCanvas(canvasWidth, canvasHeight).parent(canvasParentRef);
    };

    const draw = (p5) => {
        p5.background(0);

        //  STARTGAME
        function startGame() {
            if (!isGameStarted) {
                startEnemySpawns();
                isGameStarted = true;
            }

            if (!isAlive) {
                isGameStarted = false;
                enemies = [];
                projectiles = [];
                x = canvasWidth / 2;
                y = canvasHeight / 2;
                updateIsAlive(true);
            }
        }

        console.log(isAlive)
        //  MOVEMENT
        p5.keyPressed = (e) => {
            startGame();


            if (e.key === 'w' || e.key === 'ArrowUp') moveUp = true;
            if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = true;
            if (e.key === 's' || e.key === 'ArrowDown') moveDown = true;
            if (e.key === 'd' || e.key === 'ArrowRight') moveRight = true;
        }
        p5.keyReleased = (e) => {
            if (e.key === 'w' || e.key === 'ArrowUp') moveUp = false;
            if (e.key === 'a' || e.key === 'ArrowLeft') moveLeft = false;
            if (e.key === 's' || e.key === 'ArrowDown') moveDown = false;
            if (e.key === 'd' || e.key === 'ArrowRight') moveRight = false;
        }

        if (moveUp && !collisionTop && isAlive) y -= playerSpeed;
        if (moveDown && !collisionBottom && isAlive) y += playerSpeed;
        if (moveRight && !collisionRight && isAlive) x += playerSpeed;
        if (moveLeft && !collisionLeft && isAlive) x -= playerSpeed;


        //  WALL COLLISION DETECTION
        let itemRight = x + (playerSize / 2);
        let itemLeft = x - (playerSize / 2);
        let itemTop = y - (playerSize / 2);
        let itemBottom = y + (playerSize / 2);

        if (itemRight >= canvasWidth) { collisionRight = true } else { collisionRight = false };
        if (itemLeft <= 0) { collisionLeft = true } else { collisionLeft = false }
        if (itemTop <= 0) { collisionTop = true } else { collisionTop = false }
        if (itemBottom >= canvasHeight) { collisionBottom = true } else { collisionBottom = false }


        //  ENEMIES
        p5.fill(255, 0, 0);
        p5.stroke(255, 0, 0);

        for (let i = 0; i < enemies.length; i++) {
            let enemyPosX = enemies[i][0];
            let enemyPosY = enemies[i][1];

            let enemyXDiff = x - enemyPosX;
            let enemyYDiff = y - enemyPosY;
            let enemyVector = p5.createVector(enemyXDiff, enemyYDiff);
            enemyVector.normalize();
            if (isGameStarted && !disableEnemySpawning) {
                enemies[i][0] += enemyVector.x * enemySpeed;
                enemies[i][1] += enemyVector.y * enemySpeed;
            }
            p5.circle(enemyPosX, enemyPosY, enemySize, enemySize);

            // ENEMY PLAYER COLLISION
            let d = p5.dist(x, y, enemyPosX, enemyPosY);

            if (d < (playerSize / 2) + (enemySize / 2)) {
                enemies.splice(i, 1);
                gameReset();
            }
        }
        //  ENEMY SPAWNS
        function startEnemySpawns() {
            setInterval(() => {
                let xSpawnPos = getRandomNumber(canvasWidth + (enemySize * 5), -(enemySize * 5));
                let ySpawnPos = getRandomNumber(canvasHeight + (enemySize * 5), -(enemySize * 5));
                while (xSpawnPos > 0 && xSpawnPos < canvasWidth) {
                    xSpawnPos = getRandomNumber(canvasWidth + (enemySize * 5), -(enemySize * 5));
                }
                while (ySpawnPos > 0 && ySpawnPos < canvasHeight) {
                    ySpawnPos = getRandomNumber(canvasHeight + (enemySize * 5), -(enemySize * 5));
                }
                if (enemies.length < maxEnemies) {
                    enemies = [...enemies, [xSpawnPos, ySpawnPos, false, false]]
                    // console.log(enemies)
                }
            }, enemySpawnRate)
        }

        //  PROJECTILES
        p5.mousePressed = (event) => { //SHOOT
            const { x: xClick, y: yClick } = event;
            if (event.which === 1) {
                startGame()
                // console.log(projectiles);
                let xDiff = xClick - x + Math.random() * projectileBloom;
                let yDiff = yClick - y + Math.random() * projectileBloom;
                let mouseDir = p5.createVector(xDiff, yDiff);
                mouseDir.normalize();

                if (isFullAuto) {
                    startFullAuto();
                }
                if (xClick > 0 && xClick < canvasWidth && yClick > 0 && yClick < canvasHeight) {
                    if (projectileReady) newProjectile(x, y, mouseDir);
                    projectileReady = false;
                }
            }
        }

        function newProjectile(posX, posY, mouseVector) {
            projectiles.push([posX, posY, mouseVector, penetration]);
            setTimeout(() => { projectileReady = true }, fireRate)
        }

        p5.mouseReleased = () => {
            if (isFullAuto) {
                clearInterval(fullAuto)
            }
        }

        function startFullAuto() {
            fullAuto = setInterval(() => {
                let xDiff = p5.mouseX - x + Math.random() * projectileBloom;
                let yDiff = p5.mouseY - y + Math.random() * projectileBloom;
                let mouseVector = p5.createVector(xDiff, yDiff);
                mouseVector.normalize();
                newProjectile(x, y, mouseVector);
            }, fireRate + 100)
        }

        for (let i = 0; i < projectiles.length; i++) {
            let projectilePosX = projectiles[i][0];
            let projectilePosY = projectiles[i][1];

            projectiles[i][0] += projectiles[i][2].x * projectileSpeed;
            projectiles[i][1] += projectiles[i][2].y * projectileSpeed;
            p5.fill(0, 50, 255);
            p5.stroke(0, 50, 255);
            p5.circle(projectilePosX, projectilePosY, projectileSize, projectileSize);

            // PROJECTILE ENEMY COLLISION DETECTION
            for (let j = 0; j < enemies.length; j++) {
                let enemyPosX = enemies[j][0];
                let enemyPosY = enemies[j][1];

                let d = p5.dist(projectilePosX, projectilePosY, enemyPosX, enemyPosY);

                if (d < (enemySize / 2) + (projectileSize / 2)) {
                    updateMoney(10);
                    enemies.splice(j, 1);
                    if (projectiles[i][3] >= 0) {
                        projectiles[i][3]--;
                    } else {
                        projectiles.splice(i, 1);
                    }
                }
            }
        }

        function gameReset() {
            updateIsAlive(false);
            isGameStarted = false;
            setMoney(0);
            setPlayerSpeed(8);
            setSpeedUpgradeCost(speedCost);
            setFireRate(200);
            setFireRateUpgradeCost(fireRateCost);
            setIsFullAuto(false);
            setProjectileSpeed(15);
            setProjectileSpeedUpgradeCost(projectileSpeedCost);
            setProjectileSize(30);
            setProjectileSizeUpgradeCost(projectileSizeCost);
            setProjectileBloom(200);
            setProjectileSizeUpgradeCost(accuracyCost);
            setPenetration(0);
            setPenetrationUpgradeCost(penetrationCost);
        }

        function getRandomNumber(max, min) {
            return Math.random() * (max - min) + min;
        }


        //  PLAYER
        p5.fill(255);
        p5.stroke(255);
        if (isAlive) {
            p5.ellipse(x, y, playerSize, playerSize)
        }/*  else {
            p5.fill(255, 50, 50);
            p5.stroke(100, 0, 0);
            p5.textSize(canvasWidth / 10);
            p5.text('GAME OVER!', canvasWidth / 4.75, canvasHeight / 2 + canvasHeight / 20)
            p5.textSize(canvasWidth / 30)
            p5.text('Press any key to continue...', canvasWidth / 3.25, canvasHeight / 2 + canvasHeight / 10)
        }; */
    };

    const updateMoney = (value) => {
        setMoney(money + value)
    }

    const [isAlive, setIsAlive] = useState(true);
    const updateIsAlive = (boolean) => {
        setIsAlive(boolean);
    }

    const [money, setMoney] = useState(1000000);

    //  SPEED UPGRADE
    const [playerSpeed, setPlayerSpeed] = useState(8);
    let maxSpeed = 18;
    const [speedUpgradeCost, setSpeedUpgradeCost] = useState(speedCost)
    const upgradeSpeed = (value) => {
        if (money >= speedUpgradeCost) {
            setPlayerSpeed(playerSpeed + value)
            updateMoney(-speedUpgradeCost);
            setSpeedUpgradeCost(speedUpgradeCost + 20)
        }
    }

    //  FIRERATE UGPRADE
    const [fireRate, setFireRate] = useState(200);
    const [fireRateUpgradeCost, setFireRateUpgradeCost] = useState(fireRateCost);
    const upgradeFireRate = (value) => {
        if (money >= fireRateUpgradeCost && fireRate > 0) {
            setFireRate(fireRate - value);
            updateMoney(-fireRateUpgradeCost);
            setFireRateUpgradeCost(fireRateUpgradeCost + 10);
        }
    }

    const [isFullAuto, setIsFullAuto] = useState(false);
    const fullAutoUpgrade = () => {
        if (money > fullAutoCost) {
            setIsFullAuto(true)
            updateMoney(-fullAutoCost);
        }
    }

    const [projectileSpeed, setProjectileSpeed] = useState(15);
    const [projectileSpeedUpgradeCost, setProjectileSpeedUpgradeCost] = useState(projectileSpeedCost);
    let maxProjectileSpeed = 35;
    const projectileSpeedUpgrade = (value) => {
        if (money >= projectileSpeedUpgradeCost) {
            setProjectileSpeed(projectileSpeed + value);
            updateMoney(-projectileSpeedUpgradeCost);
            setProjectileSpeedUpgradeCost(projectileSpeedUpgradeCost + 10);
        }
    }


    const [projectileSize, setProjectileSize] = useState(30);
    const [projectileSizeUpgradeCost, setProjectileSizeUpgradeCost] = useState(projectileSizeCost);
    let maxProjectileSize = playerSize;
    const projectileSizeUpgrade = (value) => {
        if (money >= projectileSizeUpgradeCost) {
            setProjectileSize(projectileSize + value);
            updateMoney(-projectileSizeUpgradeCost);
            setProjectileSizeUpgradeCost(projectileSizeUpgradeCost + 30);
        }
    }

    const [projectileBloom, setProjectileBloom] = useState(200);
    const [bloomUpgradeCost, setBloomUpgradeCost] = useState(accuracyCost);
    const bloomUpgrade = (value) => {
        if (money >= bloomUpgradeCost) {
            setProjectileBloom(projectileBloom - value);
            updateMoney(-bloomUpgradeCost);
            setBloomUpgradeCost(bloomUpgradeCost + 20);
        }
    }

    const [penetration, setPenetration] = useState(0);
    const [penetrationUpgradeCost, setPenetrationUpgradeCost] = useState(penetrationCost);
    let maxPenetration = 5;
    const penetrationUpgrade = (value) => {
        if (money >= penetrationUpgradeCost) {
            setPenetration(penetration + value);
            updateMoney(-penetrationUpgradeCost);
            setPenetrationUpgradeCost(penetrationUpgradeCost + 50);
        }
    }

    return (
        <div className="canvasContainer">
            <Sketch setup={setup} draw={draw} />
            {!isAlive && <div className="gameOver">
                <h1>GAME OVER</h1>
                <p>Press any key to continue...</p>
            </div>}
            <div className="upgradesContainer">
                <h1>${money}</h1>

                <button //speed upgrade button
                    disabled={playerSpeed >= maxSpeed}
                    onClick={() => { upgradeSpeed(2) }}>
                    {playerSpeed >= maxSpeed ? "Upgrade Maxed" : "+ Speed $" + speedUpgradeCost}
                </button>

                <button //fire rate upgrade button
                    disabled={fireRate <= 0}
                    onClick={() => { upgradeFireRate(20) }}>
                    {fireRate <= 0 ? "Upgrade Maxed" : "+ Fire Rate $" + fireRateUpgradeCost}
                </button>

                <button //full auto upgrade button
                    disabled={isFullAuto === true}
                    onClick={() => { fullAutoUpgrade(); }}>
                    {isFullAuto ? "Upgrade Maxed" : "+ Full Auto $" + fullAutoCost}
                </button>

                <button //projectile speed upgrade button
                    disabled={projectileSpeed >= maxProjectileSpeed}
                    onClick={() => { projectileSpeedUpgrade(1) }}>
                    {projectileSpeed >= maxProjectileSpeed ? "Upgrade Maxed" : "+ Projectile Speed $" + projectileSpeedUpgradeCost}
                </button>

                <button //projectile size upgrade button
                    disabled={projectileSize >= maxProjectileSize}
                    onClick={() => { projectileSizeUpgrade(10) }}>
                    {projectileSize >= maxProjectileSize ? "Upgrade Maxed" : "+ Projectile Size $" + projectileSizeUpgradeCost}
                </button>

                <button //projectile accuracy button
                    disabled={projectileBloom <= 0}
                    onClick={() => { bloomUpgrade(20) }}>
                    {projectileBloom <= 0 ? 'Upgrade Maxed' : "+ Accuracy $" + bloomUpgradeCost}
                </button>

                <button
                    disabled={penetration >= maxPenetration}
                    onClick={() => { penetrationUpgrade(1) }}>
                    {penetration >= maxPenetration ? "Upgrade Maxed" : "+ Penetration $" + penetrationUpgradeCost}
                </button>
            </div>
        </div>
    )
}

export default Canvas
