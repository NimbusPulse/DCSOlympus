export class Dropdown {
    #container: HTMLElement | null;
    #options: string[];
    #open?: boolean;
    #content?: HTMLElement;
    #callback?: CallableFunction;

    constructor(ID: string, options: string[], callback: CallableFunction) {
        this.#container = document.getElementById(ID);
        this.#options = options;
        this.#callback = callback;
        this.close()
        this.#container?.addEventListener("click", () => {
            this.#open ? this.close() : this.open();
        })
        if (this.#container != null && this.#options.length > 0)
            this.#container.innerHTML = this.#options[0];
    }

    open() {
        if (this.#container != null) {
            this.#open = true;
            this.#container.classList.add("ol-dropdown-open");
            this.#container.classList.remove("ol-dropdown-closed");
            this.#content = document.createElement("div");
            this.#content.classList.add("ol-dropdown-content");
            this.#content.style.width = (this.#container.offsetWidth - this.#container.offsetHeight) + "px";

            this.#content.style.left = this.#container.offsetLeft + "px";
            this.#content.style.top = this.#container.offsetTop + this.#container.offsetHeight + "px";
            document.body.appendChild(this.#content);

            var height = 2;
            for (let optionID in this.#options) {
                var node = document.createElement("div");
                node.classList.add("ol-dropdown-element");
                node.appendChild(document.createTextNode(this.#options[optionID]));
                this.#content.appendChild(node);
                height += node.offsetHeight + 2;
                node.addEventListener('click', () => {
                    this.close();
                    if (this.#container != null)
                        this.#container.innerHTML = this.#options[optionID];
                    if (this.#callback != null)
                        this.#callback(this.#options[optionID])
                })
            }
            this.#content.style.height = height + "px";
        }
    }

    close() {
        if (this.#container != null) {
            this.#open = false;
            this.#container?.classList.remove("ol-dropdown-open");
            this.#container?.classList.add("ol-dropdown-closed");
            if (this.#content != null)
                document.body.removeChild(this.#content);
        }
    }
}