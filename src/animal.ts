import Sensor from "./Sensor";
import Polygon, {Position, randomPosition} from "./polygon";
import {NeuralNetwork} from "./network";
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

export interface AnimalConfig {
    name: string;
    health: number;
    startHealth: number;
    attack: number;
    speed: number;
    prey: string[];
    predators: string[];
    size: number;
    color: string;
    healthPerTurn: number;
    reproduceHealth: number;
}

export const WolfConfig: AnimalConfig = {
    name: 'wolf',
    health: 10,
    attack: 5,
    speed: 1,
    size: 10,
    prey: ['sheep'],
    predators: [],
    color: '#333333',
    healthPerTurn: -0.1,
    reproduceHealth: 20,
    startHealth: 10
}

export const SheepConfig: AnimalConfig = {
    name: 'sheep',
    health: 10,
    attack: 1,
    speed: 1,
    size: 10,
    prey: [],
    predators: ['wolf'],
    color: '#ffffff',
    healthPerTurn: 0.01,
    reproduceHealth: 20,
    startHealth: 10
}

export default class Animal {
    name: string;
    health: number;
    startHealth: number;
    attack: number;
    speed: number;
    prey: string[];
    predators: string[];
    sensor: Sensor;
    position: Position;
    polygon: Polygon;
    size: number;
    alive = true;
    brain: NeuralNetwork;
    id: string;
    color: string;
    angle: number;
    healthPerTurn: number;
    reproduceHealth: number;
    reproductions = 0;
    config: AnimalConfig;

    constructor(config: AnimalConfig, start?: Position, angle?: number) {
        this.config = config;
        this.name = config.name;
        this.health = config.health;
        this.startHealth = config.health;
        this.attack = config.attack;
        this.speed = config.speed;
        this.size = config.size;
        this.prey = config.prey;
        this.predators = config.predators;
        if (start) {
            this.position = start;
        } else {
            this.position = randomPosition();
        }
        this.id = uuidv4();
        this.color = config.color;
        if (angle) {
            this.angle = angle;
        } else {
            this.angle = Math.floor(Math.random() * 360);
        }
        this.healthPerTurn = config.healthPerTurn;
        this.reproduceHealth = config.reproduceHealth;
        this.sensor = new Sensor(40, 100, Math.PI * 2, this);
        this.polygon = Polygon.Rectangle(this.position, this.size, this.size, this.angle);

        // neurons = 20 for distances, 20 for type ally, neutral, enemy
        this.brain = new NeuralNetwork([40,6]);
    }

    update() {
        if (this.healthPerTurn) {
            this.health += this.healthPerTurn;
        }

        if (this.health <= 0) {
            // console.log(`a ${this.name} died`);
            if (!(window as any).engine.scores[`${this.name} deaths`]) {
                (window as any).engine.scores[`${this.name} deaths`] = 0;
            }
            (window as any).engine.scores[`${this.name} deaths`] += 1;
            this.alive = false;
            return;
        }

        this.sensor.update();
        const touches = this.sensor.touches;
        const inputs: number[] = [];
        
        touches.forEach((touch) => {
            let ateAlready = false;
            const offset = touch.intersection ? 1 - touch.intersection.offset : 0;
            inputs.push(offset);

            let moveTowards = 0.5;
            if (touch.animal) {
                const diffX = this.position.x - touch.animal.position.x;
                const diffY = this.position.y - touch.animal.position.y;
                const realDistance = Math.sqrt(diffX * diffX + diffY * diffY);
                if (this.prey.includes(touch.animal.name)) {
                    // console.log(`A ${this.name} ${this.id} saw a ${touch.animal.name} at ${this.position.x},${this.position.y} and ${touch.animal.position.x},${touch.animal.position.y} distance: ${realDistance}`);
                    moveTowards = 1;
                    if (touch.intersection && realDistance < this.size && !ateAlready) {
                        // console.log(`A ${this.name} attacked a ${touch.animal.name} for ${this.attack} damage at ${this.position.x},${this.position.y} and ${touch.animal.position.x},${touch.animal.position.y}`);
                        const dmg = this.attack >= touch.animal.health ? this.attack : touch.animal.health;
                        touch.animal.health -= dmg;
                        this.health += dmg;
                        ateAlready = true;

                        if (!(window as any).engine.scores[`${this.name} attacks`]) {
                            (window as any).engine.scores[`${this.name} attacks`] = 0;
                        }
                        (window as any).engine.scores[`${this.name} attacks`] += 1;
                    }
                } else if (this.predators.includes(touch.animal.name)) {
                    // console.log(`A ${this.name} ${this.id} saw a ${touch.animal.name} at ${this.position.x},${this.position.y} and ${touch.animal.position.x},${touch.animal.position.y} distance: ${realDistance}`);
                    moveTowards = 0;
                } else if (this.name === touch.animal.name) {
                    // moveTowards = 0.5;
                    // moveTowards = 0;
                }
            }

            inputs.push(moveTowards);
        });

        // console.log(inputs);

        const outputs = NeuralNetwork.feedForward(inputs, this.brain);

        let moveX = 0;
        let moveY = 0;
        let turn = 0

        if (outputs[0]) {
            moveX += this.speed;
        }
        if (outputs[1]) {
            moveX -= this.speed;
        }
        if (outputs[3]) {
            moveY += this.speed;
        }
        if (outputs[4]) {
            moveY -= this.speed;
        }
        if (outputs[5]) {
            turn += Math.PI / 180 * this.speed;
        }
        if (outputs[6]) {
            turn -= Math.PI / 180 * this.speed;
        }

        if (this.health >= this.reproduceHealth) {
            const currentCount = (window as any).engine.animals.filter((a: Animal) => a.name === this.name).length;
            if (currentCount < 100) {
                const newPosition = {
                    x: this.position.x + Math.floor(Math.random() * 10),
                    y: this.position.y + Math.floor(Math.random() * 10),
                }
                const baby = new Animal(this.config, newPosition);
                baby.brain = _.cloneDeep(this.brain);
                // NeuralNetwork.mutate(baby.brain, 0.1);
                (window as any).engine.addAnimal(baby);
                // console.log(`a ${this.name} reproduced`);
                this.reproductions += 1;

                if (this.name === 'wolf' && (window as any).engine.bestWolf && (window as any).engine.bestWolf.reproductions < this.reproductions) {
                    (window as any).engine.bestWolf = this;
                }
                if (this.name === 'sheep' && (window as any).engine.bestSheep && (window as any).engine.bestSheep.reproductions < this.reproductions) {
                    (window as any).engine.bestSheep = this;
                }
                if (!(window as any).engine.scores[`${this.name} births`]) {
                    (window as any).engine.scores[`${this.name} births`] = 0;
                }
                (window as any).engine.scores[`${this.name} births`] += 1;
            }
            this.health = this.startHealth;
        }
        
        // const newX = this.position.x + moveX;
        // if (newX < 0) {
        //     this.position.x = 0;
        //     moveX = 0 - this.position.x;
        // } else if (newX > this.engine.width) {
        //     this.position.x = this.engine.width;
        //     moveX = this.engine.width - this.position.x;
        // }
        //
        // const newY = this.position.y + moveY;
        // if (newY < 0) {
        //     this.position.y = 0;
        //     moveY = 0 - this.position.y;
        // } else if (newY > this.engine.height) {
        //     this.position.y = this.engine.height;
        //     moveY = this.engine.height - this.position.y;
        // }

        this.position.x += moveX;
        if (this.position.x < 0) {
            this.position.x += (window as any).engine.width;
        } else if (this.position.x > (window as any).engine.width) {
            this.position.x -= (window as any).engine.width
        }
        
        this.position.y += moveY;
        if (this.position.y < 0) {
            this.position.y += (window as any).engine.height;
        } else if (this.position.y > (window as any).engine.height) {
            this.position.y -= (window as any).engine.height
        }
        
        this.angle += turn;

        // console.log(this.name, moveX, moveY, turn, this.health);

        this.polygon = Polygon.Rectangle(this.position, this.size, this.size, this.angle);
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.polygon.draw(ctx, this.color);
        // this.sensor.draw(ctx);
    }
}