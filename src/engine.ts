import Animal, {SheepConfig, WolfConfig} from "./animal";
import _ from "lodash";
import {NeuralNetwork} from "./network";

export default class Engine {
    canvas: HTMLCanvasElement;
    parent: HTMLDivElement;
    context: CanvasRenderingContext2D;
    running = false;
    height = 100;
    width = 100;
    animals: Animal[] = [];

    bestWolf?: Animal;
    bestSheep?: Animal;

    scoresDiv: HTMLDivElement;

    scores: any = {};

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.parent = this.canvas.parentElement as HTMLDivElement;
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        this.scoresDiv = document.getElementById('scores') as HTMLDivElement;
    }

    start() {
        this.running = true;
        this.animate();
    }

    stop() {
        this.running = false;
    }

    toggle() {
        this.running = !this.running;
        if (this.running) {
            this.animate();
        } else {

        }
    }

    addAnimal(animal: Animal) {
        this.animals.push(animal);
    }

    animate() {
        if (!this.running) {
            return;
        }

        const wolves = this.animals.filter((a) => a.name === 'wolf');
        if (wolves.length === 0) {
            for (let i=0; i<30; i++) {
                const wolf = new Animal(WolfConfig);

                if (this.bestWolf) {
                    wolf.brain = _.cloneDeep(this.bestWolf.brain);
                    if (i > 5) {
                        NeuralNetwork.mutate(wolf.brain, 0.1);
                    }
                }

                this.addAnimal(wolf);
            }
        }
        this.scores['wolves alive'] = wolves.length;

        const sheep = this.animals.filter((a) => a.name === 'sheep');
        if (sheep.length === 0) {
            for (let i=0; i<30; i++) {
                const sheep = new Animal(SheepConfig);

                if (this.bestSheep) {
                    sheep.brain = _.cloneDeep(this.bestSheep.brain);
                    if (i > 5) {
                        NeuralNetwork.mutate(sheep.brain, 0.1);
                    }
                }

                this.addAnimal(sheep);
            }
        }
        this.scores['sheep alive'] = sheep.length;

        let updateHtml = '';
        Object.keys(this.scores).map((key) => {
           updateHtml += `<div>${key}: ${this.scores[key]}</div>`;
        });
        this.scoresDiv.innerHTML = updateHtml;

        // this.canvas.height = this.parent.clientHeight - (window.innerHeight * .08);
        // this.canvas.width = this.parent.clientWidth - (window.innerWidth * .08);
        this.height = this.canvas.height;
        this.width = this.canvas.width;

        this.context.fillStyle = "#1e9c48";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.animals = this.animals.filter((d) => d.alive);
        this.animals.forEach((animal) => {
            animal.update();
            animal.draw(this.context);
        });

        requestAnimationFrame(() => {
            setTimeout(() => {
                this.animate();
            }, 10);
        })
    }
}