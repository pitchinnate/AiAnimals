import Engine from "./engine";
import Animal, {SheepConfig, WolfConfig} from "./animal";

(window as any).engine = new Engine('game');

for (let i=0; i<30; i++) {
    const sheep = new Animal(SheepConfig);
    (window as any).engine.addAnimal(sheep);
}

for (let i=0; i<30; i++) {
    const wolf = new Animal(WolfConfig);
    (window as any).engine.addAnimal(wolf);
}

(window as any).engine.start();

document.addEventListener("keypress", (event) => {
    switch (event.code) {
        case 'Space':
            (window as any).engine.toggle();
            break;
        case 'KeyG':
            (window as any).engine.animate();
            break;
    }
});
