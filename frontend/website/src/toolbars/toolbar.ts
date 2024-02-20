export class Toolbar {
    #element: HTMLElement
    #visible: boolean = true;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        this.#element = document.getElementById(ID) as HTMLElement;
    }

    show() {
        this.#element.classList.toggle("hide", false);
        this.#visible = true;
    }

    hide() {
        this.#element.classList.toggle("hide", true);
        this.#visible = false;
    }

    toggle() {
        // Simple way to track if currently visible
        if (this.#visible)
            this.hide();
        else 
            this.show();
    }

    getElement() {
        return this.#element;
    }

    getVisible(){
        return this.#visible;
    }
}