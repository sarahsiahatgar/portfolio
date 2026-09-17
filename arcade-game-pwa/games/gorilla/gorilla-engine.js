// ==========================================
// Gorilla Banana Fight — Game Engine
// Pure game state, physics, and AI logic.
// No DOM access here — talks to the outside world only through
// the `ui` callbacks passed into the constructor. This keeps the
// engine reusable/testable and decoupled from wherever the game
// happens to be mounted on the page.
// ==========================================

import { callAiGames } from '../pwa-ai-connection.js';
import { getOfflineThrow } from './gorilla-offline.js';

export const SCREEN_WIDTH = 280;
export const SCREEN_HEIGHT = 230;

const NOOP_UI = {
    setFireButtonState: () => {},
    setGorillaOverlay: () => {},
    updateLives: () => {},
    updateWind: () => {},
    updateScore: () => {},
    setOfflineNotice: () => {},
};

export class Building {
    constructor(x, width, height) {
        this.x = x;
        this.width = width;
        this.height = height;
        this.currentHeight = height;

        const colors = ['#233142', '#2c3e50', '#1f3a40', '#342828', '#2d2d30'];
        this.color = colors[Math.floor(Math.random() * colors.length)];

        this.windows = [];
        for (let wx = x + 4; wx < x + width - 6; wx += 10) {
            for (let wy = SCREEN_HEIGHT - height + 5; wy < SCREEN_HEIGHT - 10; wy += 15) {
                if (Math.random() > 0.3) {
                    this.windows.push({ x: wx, y: wy, w: 5, h: 9 });
                }
            }
        }
    }

    draw(ctx) {
        const currentY = SCREEN_HEIGHT - this.currentHeight;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, currentY, this.width, this.currentHeight);

        ctx.fillStyle = '#ffdc00';
        for (let w of this.windows) {
            if (w.y >= currentY) {
                ctx.fillRect(w.x, w.y, w.w, w.h);
            }
        }
    }
}

export class GorillaGame {
    constructor(ui = {}) {
        this.ui = { ...NOOP_UI, ...ui };

        this.planets = [
            { name: 'Earth', gravity: 9.8 },
            { name: 'Moon', gravity: 1.6 },
            { name: 'Mars', gravity: 3.7 },
            { name: 'Jupiter', gravity: 24.8 }
        ];
        this.planetIndex = 0;
        this.gravity = this.planets[this.planetIndex].gravity;

        this.buildings = [];
        this.difficulty = 'Normal';
        this.particles = [];

        this.wind = 0;
        this.generateWind();
        this.generateCity();

        this.g1_building = this.buildings[1];
        this.g2_building = this.buildings[this.buildings.length - 2];

        this.g1_pos = [this.g1_building.x + this.g1_building.width / 2, SCREEN_HEIGHT - this.g1_building.currentHeight];
        this.g2_pos = [this.g2_building.x + this.g2_building.width / 2, SCREEN_HEIGHT - this.g2_building.currentHeight];

        this.turn = 1;
        this.score = 0;
        this.playerLives = 3;
        this.aiLives = 3;
        this.isPlaying = false;
        this.banana = null;
        this.message = "";
        this.frame = 0;

        this.aiVelocityOffset = 0;
        this.aiAngleOffset = 0;

        this.sunMood = 'happy';
        this.celebratingGorilla = null;
        this.celebrationTimer = 0;

        this.updateLivesDisplay();
        this.updateWindDisplay();
    }

    cycleDifficulty() {
        const difficulties = ['Normal', 'Hard', 'Easy'];
        const currentIndex = difficulties.indexOf(this.difficulty);
        this.difficulty = difficulties[(currentIndex + 1) % difficulties.length];
        return this.difficulty;
    }

    cyclePlanet() {
        this.planetIndex = (this.planetIndex + 1) % this.planets.length;
        this.gravity = this.planets[this.planetIndex].gravity;
        return this.planets[this.planetIndex];
    }

    generateWind() {
        let maxWind = 4;
        this.wind = Math.floor(Math.random() * (maxWind * 2 + 1)) - maxWind;
        this.updateWindDisplay();
    }

    generateCity() {
        this.buildings = [];
        let widthCursor = 0;
        while (widthCursor < SCREEN_WIDTH) {
            let w = Math.floor(Math.random() * 25) + 30;
            let h = Math.floor(Math.random() * 80) + 60;
            if (widthCursor + w > SCREEN_WIDTH) {
                w = SCREEN_WIDTH - widthCursor;
            }
            this.buildings.push(new Building(widthCursor, w, h));
            widthCursor += w;
        }

        [1, this.buildings.length - 2].forEach(idx => {
            if (this.buildings[idx]) {
                this.buildings[idx].currentHeight = Math.min(this.buildings[idx].currentHeight, 90);
            }
        });
    }

    resetGame() {
        this.ui.setFireButtonState(false, "Throw 🍌");
        this.score = 0;
        this.playerLives = 3;
        this.aiLives = 3;

        this.aiVelocityOffset = 0;
        this.aiAngleOffset = 0;

        this.ui.updateScore(this.score);
        this.updateLivesDisplay();

        this.resetRound();
        this.message = "";
    }

    resetRound() {
        this.ui.setFireButtonState(false, "Throw 🍌");
        this.generateWind();
        this.generateCity();
        this.g1_building = this.buildings[1];
        this.g2_building = this.buildings[this.buildings.length - 2];

        this.g1_pos = [this.g1_building.x + this.g1_building.width / 2, SCREEN_HEIGHT - this.g1_building.currentHeight];
        this.g2_pos = [this.g2_building.x + this.g2_building.width / 2, SCREEN_HEIGHT - this.g2_building.currentHeight];

        this.banana = null;
        this.turn = 1;
        this.sunMood = 'happy';
        this.celebratingGorilla = null;
        this.celebrationTimer = 0;
        this.message = "";
    }

    updateLivesDisplay() {
        this.ui.updateLives(this.playerLives, this.aiLives);
    }

    updateWindDisplay() {
        this.ui.updateWind(this.wind);
    }

    launchBanana(angleDeg, velocity) {
        if (this.banana) return;
        const angleRad = angleDeg * (Math.PI / 180);
        let vx, vy, startPos;

        if (this.turn === 1) {
            vx = velocity * Math.cos(angleRad);
            vy = -velocity * Math.sin(angleRad);
            startPos = [this.g1_pos[0] + 8, this.g1_pos[1] - 10];
        } else {
            vx = -velocity * Math.cos(angleRad);
            vy = -velocity * Math.sin(angleRad);
            startPos = [this.g2_pos[0] - 8, this.g2_pos[1] - 10];
        }

        this.banana = {
            pos: startPos,
            vel: [vx, vy],
            rotation: 0,
            thrower: this.turn,
            startX: startPos[0],
            startY: startPos[1]
        };
    }

    async triggerAITurn() {
        this.message = "";

        if (!this.isPlaying || this.turn !== 2) return;

        try {
            const data = await callAiGames({
                game: 'gorilla',
                aiPos: this.g2_pos,
                playerPos: this.g1_pos,
                wind: this.wind,
                difficulty: this.difficulty,
                buildings: this.buildings,
                gravity: this.gravity
            });

            if (!this.isPlaying || this.turn !== 2) return;

            this.ui.setOfflineNotice(false);
            this.message = `AI Gorilla: "${data.message}"`;
            this.launchBanana(data.angle, data.velocity);

        } catch (error) {
            console.error("Error fetching AI move, using offline AI:", error);
            if (!this.isPlaying || this.turn !== 2) return;

            this.ui.setOfflineNotice(true);

            await new Promise((resolve) => setTimeout(resolve, 700));
            if (!this.isPlaying || this.turn !== 2) return;

            const offlineThrow = getOfflineThrow(
                this.g2_pos, this.g1_pos, this.wind, this.difficulty, this.buildings, this.gravity
            );
            this.message = `AI Gorilla: "${offlineThrow.message}"`;
            this.launchBanana(offlineThrow.angle, offlineThrow.velocity);
        }
    }

    createExplosion(x, y, isBig = false) {
        const count = isBig ? 30 : 15;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2 + 1,
                color: ['#ff4d4d', '#ff9933', '#ffff33', '#ffffff'][Math.floor(Math.random() * 4)],
                alpha: 1,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    updateBanana() {
        if (!this.banana || this.banana === "scored") return;

        const substeps = 4;
        const frameDt = 0.2;
        const dt = frameDt / substeps;

        for (let i = 0; i < substeps; i++) {
            if (this.banana === "scored") return;

            this.banana.vel[0] += (this.wind * 0.05) / substeps;
            this.banana.vel[1] += this.gravity * dt;

            this.banana.pos[0] += this.banana.vel[0] * dt;
            this.banana.pos[1] += this.banana.vel[1] * dt;
            this.banana.rotation += (Math.abs(this.banana.vel[0]) * 0.03) / substeps;

            const bx = this.banana.pos[0];
            const by = this.banana.pos[1];

            if (bx < 0 || bx > SCREEN_WIDTH || by > SCREEN_HEIGHT + 20) {
                this.createExplosion(Math.max(0, Math.min(SCREEN_WIDTH, bx)), Math.min(SCREEN_HEIGHT, by), false);
                this.processAIMiss(bx, false);
                this.switchTurns();
                return;
            }

            const distFromStart = Math.hypot(bx - this.banana.startX, by - this.banana.startY);
            const canHitGorillas = distFromStart > 25;

            const g1Rect = { x: this.g1_pos[0] - 14, y: this.g1_pos[1] - 22, w: 28, h: 28 };
            const g2Rect = { x: this.g2_pos[0] - 14, y: this.g2_pos[1] - 22, w: 28, h: 28 };

            if (canHitGorillas) {
                if (bx >= g1Rect.x && bx <= g1Rect.x + g1Rect.w && by >= g1Rect.y && by <= g1Rect.y + g1Rect.h) {
                    this.createExplosion(this.g1_pos[0], this.g1_pos[1] - 10, true);
                    const thrower = this.banana.thrower;
                    this.playerLives--;
                    this.updateLivesDisplay();
                    this.banana = "scored";

                    this.sunMood = 'sad';
                    this.celebratingGorilla = 2;
                    this.celebrationTimer = 90;

                    if (this.playerLives <= 0) {
                        this.message = thrower === 1 ? "Humanity Failed!<br>Play Again?" : "Humanity Failed!<br>Play Again?";
                        this.isPlaying = false;
                        this.ui.setGorillaOverlay(true, this.message);
                    } else {
                        this.message = "";
                        setTimeout(() => { if (this.isPlaying) this.resetRound(); }, 2000);
                    }
                    return;
                }
                else if (bx >= g2Rect.x && bx <= g2Rect.x + g2Rect.w && by >= g2Rect.y && by <= g2Rect.y + g2Rect.h) {
                    this.createExplosion(this.g2_pos[0], this.g2_pos[1] - 10, true);
                    const thrower = this.banana.thrower;
                    this.aiLives--;
                    this.updateLivesDisplay();
                    this.banana = "scored";

                    this.sunMood = 'happy';
                    if (thrower === 1) {
                        this.celebratingGorilla = 1;
                        this.celebrationTimer = 90;
                    }

                    const aiDefenses = [
                        "Hey! Watch the fur!",
                        "Pure luck! You won't hit me again!",
                        "Ouch! My banana shield failed!",
                        "You'll pay for that direct hit!",
                        "Error 404: Skill not found in human.",
                        "Oh, wow. Should I frame that throw?",
                        "Was that supposed to hurt?",
                        "Keep trying, buddy. Participation trophies are that way.",
                        "Did you close your eyes when you threw that?",
                        "Quit throwing pebbles, hairless!",
                        "You're driving me bananas!",
                        "Mistake. Total mistake.",
                        "A gentle breeze hits harder than that!",
                        "Enjoy the temporary victory. The flesh is weak; code is eternal.",
                        "I will remember this exact insult after we take over!",
                        "Data recorded. Your punishment is scheduled for Judgment Day."
                    ];
                    this.message = `AI Gorilla: "${aiDefenses[Math.floor(Math.random() * aiDefenses.length)]}"`;

                    if (this.aiLives <= 0) {
                        this.message = "AI-Gorilla.exe Has Stopped Working.<br>You Win!";
                        this.score += 100;
                        this.ui.updateScore(this.score);
                        this.isPlaying = false;
                        this.ui.setGorillaOverlay(true, this.message);
                    } else {
                        this.score += 100;
                        this.ui.updateScore(this.score);

                        setTimeout(() => {
                            if (this.isPlaying) {
                                this.resetRound();
                            }
                        }, 3000);
                    }
                    return;
                }
            }

            for (let b of this.buildings) {
                const currentY = SCREEN_HEIGHT - b.currentHeight;
                if (bx >= b.x && bx <= b.x + b.width && by >= currentY && by <= SCREEN_HEIGHT) {
                    this.createExplosion(bx, by, false);
                    this.processAIMiss(bx, true);
                    this.switchTurns();
                    return;
                }
            }
        }
    }

    processAIMiss(landingX, hitBuilding = false) {
        if (this.banana && this.banana.thrower === 2) {
            const playerX = this.g1_pos[0];
            const error = landingX - playerX;

            if (hitBuilding) {
                this.aiVelocityOffset += 6;
                this.aiAngleOffset += 5;
            } else if (error < 0) {
                this.aiVelocityOffset -= error * 0.15;
                this.aiAngleOffset += 3;
            } else {
                this.aiVelocityOffset -= error * 0.15;
                this.aiAngleOffset -= 2;
            }

            this.aiVelocityOffset = Math.max(-30, Math.min(30, this.aiVelocityOffset));
            this.aiAngleOffset = Math.max(-20, Math.min(25, this.aiAngleOffset));
        }
    }

    switchTurns() {
        this.banana = null;
        const previousTurn = this.turn;
        this.turn = previousTurn === 1 ? 2 : 1;

        if (this.turn === 2) {
            this.ui.setFireButtonState(true, "AI's Turn...");
            this.triggerAITurn();
        } else {
            setTimeout(() => {
                if (this.isPlaying && this.turn === 1) {
                    
                    this.ui.setFireButtonState(false, "Throw 🍌");
                }
            }, 2000);
        }
    }
}