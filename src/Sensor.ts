import Polygon, {Intersection, lerp} from "./polygon";
import Animal from "./animal";

export interface Touch {
    intersection?: Intersection;
    animal?: Animal;
}

export default class Sensor {
    count: number;
    length: number;
    spread: number;
    rays: Polygon[] = [];
    touches: Touch[] = [];
    animal: Animal;

    constructor(count: number, length: number, spread: number, animal: Animal) {
        this.count = count;
        this.length = length;
        this.spread = spread;
        this.animal = animal;
    }

    update() {
        this.generateRays();
        this.touches = [];
        this.rays.forEach((ray) => {
            let closestTouch: Touch|undefined;
            (window as any).engine.animals.forEach((animal: Animal) => {
                if (animal.id === this.animal.id) {
                    return;
                }
                const touch = ray.Touches(animal.polygon);
                if (touch && (!closestTouch || !closestTouch.intersection || closestTouch.intersection.offset > touch.offset)) {
                    closestTouch = {
                        intersection: touch,
                        animal,
                    };
                }
            });

            if (!closestTouch) {
                closestTouch = {
                    intersection: undefined
                }
            }

            // @ts-ignore
            this.touches.push(closestTouch);
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = 0.4;
        this.rays.forEach((ray) => {
            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.strokeStyle="yellow";
            ctx.moveTo(
                ray.points[0].x,
                ray.points[0].y,
            );
            ctx.lineTo(
                ray.points[1].x,
                ray.points[1].y,
            );
            ctx.stroke();
        })
        ctx.globalAlpha = 1;
    }

    generateRays() {
        this.rays = Array(this.count).fill(0).map((_, i) => {
            const rayAngle = lerp(this.spread/2, -this.spread/2, this.count==1?0.5:i/(this.count-1)) + this.animal.angle;
            const start = { x:this.animal.position.x, y:this.animal.position.y };
            const end = {
                x:this.animal.position.x - Math.sin(rayAngle) * this.length,
                y:this.animal.position.y - Math.cos(rayAngle) * this.length
            };
            const poly = new Polygon([start, end], 0);
            return poly;
        });
    }
}