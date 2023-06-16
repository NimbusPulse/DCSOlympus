import { CoalitionArea } from "../map/coalitionarea";
import { groundUnitsDatabase } from "../units/groundunitsdatabase";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { Switch } from "./switch";

const unitRole = ["AAA", "MANPADS", "Short range SAM", "Long range SAM", "Radar"];

export class CoalitionAreaContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #coalitionArea: CoalitionArea|null = null;
    #iadsDensitySlider: Slider;
    #iadsRoleDropdown: Dropdown;
    //#iadsPeriodDropdown: Dropdown;
        
    constructor(id: string) {
        super(id);

        this.#coalitionSwitch = new Switch("coalition-area-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(false);
        this.#iadsRoleDropdown = new Dropdown("iads-units-role-options", () => {});
        //this.#iadsPeriodDropdown = new Dropdown("iads-period-options", () => {});
        this.#iadsDensitySlider = new Slider("iads-density-slider", 5, 100, "%", (value: number) => {});
        this.#iadsDensitySlider.setIncrement(5);
        this.#iadsDensitySlider.setValue(50);
        this.#iadsDensitySlider.setActive(true);

        document.addEventListener("coalitionAreaContextMenuShow", (e: any) => {
            this.showSubMenu(e.detail.type);
        });

        /* Create the checkboxes to select the unit roles */
        this.#iadsRoleDropdown.setOptionsElements(unitRole.map((unitRole: string) => {
            var div = document.createElement("div");
            div.classList.add("ol-checkbox");
            var label = document.createElement("label");
            label.title = `Add ${unitRole}s to the IADS`;
            var input = document.createElement("input");
            input.type = "checkbox";
            var span = document.createElement("span");
            span.innerText = unitRole;
            label.appendChild(input);
            label.appendChild(span);
            div.appendChild(label);
            return div as HTMLElement;
        }));

        

        this.hide();
    }

    showSubMenu(type: string) {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", type !== "iads");
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", type === "iads");
        this.clip();
    }

    getCoalitionArea() {
        return this.#coalitionArea;
    }

    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
    }

    #onSwitchClick(value: boolean) {
        this.getCoalitionArea()?.setCoalition(value? "red": "blue");
    }
}