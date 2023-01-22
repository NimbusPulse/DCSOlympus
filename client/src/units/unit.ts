import { Marker, LatLng, Polyline, Icon } from 'leaflet';
import { ConvertDDToDMS } from '../other/utils';
import { getMap, getUnitsManager, getVisibilitySettings } from '..';
import { UnitMarker, MarkerOptions, AircraftMarker, HelicopterMarker, GroundUnitMarker, NavyUnitMarker, WeaponMarker } from './unitmarker';
import { addDestination, attackUnit, changeAltitude, changeSpeed } from '../dcs/dcs';

var pathIcon = new Icon({
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit {
    ID: number = -1;
    leader: boolean = false;
    wingman: boolean = false;
    wingmen: Unit[] = [];
    formation: string = "";
    name: string = "";
    unitName: string = "";
    groupName: string = "";
    latitude: number = 0;
    longitude: number = 0;
    altitude: number = 0;
    heading: number = 0;
    speed: number = 0;
    coalitionID: number = -1;
    alive: boolean = true;
    currentTask: string = "";
    fuel: number = 0;
    type: any = null;
    flags: any = null;
    activePath: any = null;
    ammo: any = null;
    targets: any = null;

    #selectable: boolean;
    #selected: boolean = false;
    #preventClick: boolean = false;
    #pathMarkers: Marker[] = [];
    #pathPolyline: Polyline;
    #targetsPolylines: Polyline[];
    #marker: UnitMarker;
    #timer: number = 0;

    static getConstructor(name: string) {
        if (name === "GroundUnit") return GroundUnit;
        if (name === "Aircraft") return Aircraft;
        if (name === "Helicopter") return Helicopter;
        if (name === "Missile") return Missile;
        if (name === "Bomb") return Bomb;
        if (name === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number, marker: UnitMarker) {
        this.ID = ID;

        this.#selectable = true;

        /* The marker is set by the inherited class */
        this.#marker = marker;
        this.#marker.on('click', (e) => this.#onClick(e));
        this.#marker.on('dblclick', (e) => this.#onDoubleClick(e));

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];
    }

    update(response: JSON) {
        for (let entry in response) {
            // @ts-ignore
            this[entry] = response[entry];
        }

        this.#updateMarker();

        this.#clearTargets();
        if (this.getSelected())
        {
            this.#drawPath();
            this.#drawTargets();
        }
        else
            this.#clearPath();

        /*
        this.wingmen = [];
        if (response["wingmenIDs"] != null)
        {
            for (let ID of response["wingmenIDs"])
            {
                this.wingmen.push(unitsManager.getUnitByID(ID));
            }
        }
        this.formation = response["formation"];

        this.missionData = missionData.getUnitData(this.ID)

        this.setSelected(this.getSelected() && this.alive)
        */
    }

    setSelected(selected: boolean) {
        /* Only alive units can be selected. Some units are not selectable (weapons) */
        if ((this.alive || !selected) && this.#selectable && this.#selected != selected) {
            this.#selected = selected;
            this.#marker.setSelected(selected);
            getUnitsManager().onUnitSelection();
        }
    }

    getSelected() {
        return this.#selected;
    }

    addDestination(latlng: L.LatLng) {
        var path: any = {};
        if (this.activePath != null) {
            path = this.activePath;
            path[(Object.keys(path).length + 1).toString()] = latlng;
        }
        else {
            path = { "1": latlng };
        }
        addDestination(this.ID, path);
    }

    clearDestinations() {
        this.activePath = null;
    }

    getHidden() {
        return false;
    }

    #onClick(e: any) {
        this.#timer = setTimeout(() => {
            if (!this.#preventClick) {
                if (getMap().getState() === 'IDLE' || getMap().getState() === 'MOVE_UNIT' || e.originalEvent.ctrlKey) {
                    if (!e.originalEvent.ctrlKey) {
                        getUnitsManager().deselectAllUnits();
                    }
                    this.setSelected(true);
                }
            }
            this.#preventClick = false;
        }, 200);
    }

    #onDoubleClick(e: any) {
        clearTimeout(this.#timer);
        this.#preventClick = true;

        var options = [
            { 'tooltip': 'Attack', 'src': 'attack.png', 'callback': () => { getMap().hideSelectionWheel(); getUnitsManager().attackUnit(this.ID); } },
            { 'tooltip': 'Go to tanker', 'src': 'tanker.png', 'callback': () => { getMap().hideSelectionWheel(); /*showMessage("Function not implemented yet");*/ } },
            { 'tooltip': 'RTB', 'src': 'rtb.png', 'callback': () => { getMap().hideSelectionWheel(); /*showMessage("Function not implemented yet");*/ } }
        ]

        if (!this.leader && !this.wingman) {
            options.push({ 'tooltip': 'Create formation', 'src': 'formation.png', 'callback': () => { getMap().hideSelectionWheel(); /*unitsManager.createFormation(this.ID);*/ } });
        }

        getMap().showSelectionWheel(e.originalEvent, options, false);
    }

    #updateMarker() {
        /* Add the marker if not present */
        if (!getMap().hasLayer(this.#marker) && !this.getHidden()) {
            this.#marker.addTo(getMap());
        }

        /* Hide the marker if necessary*/
        if (getMap().hasLayer(this.#marker) && this.getHidden()) {
            getMap().removeLayer(this.#marker);
        }
        else
        {
            this.#marker.setLatLng(new LatLng(this.latitude, this.longitude));
            this.#marker.draw({
                heading: this.heading,
                speed: this.speed,
                altitude: this.altitude,
                alive: this.alive
            });
        }
    }

    #drawPath() {
        if (this.activePath != null) {
            var _points = [];
            _points.push(new LatLng(this.latitude, this.longitude));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.activePath).length) {
                var marker = new Marker([0, 0], { icon: pathIcon }).addTo(getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.activePath).length) {
                getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
                this.#pathMarkers.splice(this.#pathMarkers.length - 1, 1)
            }

            /* Update the position of the existing markers (to avoid creating markers uselessly) */
            for (let WP in this.activePath) {
                var destination = this.activePath[WP];
                this.#pathMarkers[parseInt(WP) - 1].setLatLng([destination.lat, destination.lng]);
                _points.push(new LatLng(destination.lat, destination.lng));
                this.#pathPolyline.setLatLngs(_points);
            }
        }
    }

    #clearPath() {
        for (let WP in this.#pathMarkers) {
            getMap().removeLayer(this.#pathMarkers[WP]);
        }
        this.#pathMarkers = [];
        this.#pathPolyline.setLatLngs([]);
    }

    
    #drawTargets()
    {
        for (let typeIndex in this.targets)
        {
            for (let index in this.targets[typeIndex])
            {
                var targetData = this.targets[typeIndex][index];
                var target = getUnitsManager().getUnitByID(targetData.object["id_"])
                if (target != null){
                    var startLatLng = new LatLng(this.latitude, this.longitude)
                    var endLatLng = new LatLng(target.latitude, target.longitude)
                    
                    var color;
                    if (typeIndex === "radar")
                    {
                        color = "#FFFF00";
                    }
                    else if (typeIndex === "visual")
                    {
                        color = "#FF00FF";
                    }
                    else if (typeIndex === "rwr")
                    {
                        color = "#00FF00";
                    }
                    else
                    {
                        color = "#FFFFFF";
                    }
                    var targetPolyline = new Polyline([startLatLng, endLatLng], {color: color, weight: 3, opacity: 1, smoothFactor: 1});
                    targetPolyline.addTo(getMap());
                    this.#targetsPolylines.push(targetPolyline)
                }
            }
        }
    }

    #clearTargets()
    {
        for (let index in this.#targetsPolylines)
        {
            getMap().removeLayer(this.#targetsPolylines[index])
        }
    }
    

    attackUnit(targetID: number) {
        /* Call DCS attackUnit function */
        if (this.ID != targetID) {
            attackUnit(this.ID, targetID);
        }
        else {
            // TODO: show a message
        }
    }

    
    changeSpeed(speedChange: string)
    {
       changeSpeed(this.ID, speedChange);
    }

    changeAltitude(altitudeChange: string)
    {
        changeAltitude(this.ID, altitudeChange);
    }

    /*
    setformation(formation)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " formation change: " + formation);
            }
        };

        var command = {"ID": this.ID, "formation": formation}
        var data = {"setFormation": command}

        xhr.send(JSON.stringify(data));
    }

    setLeader(wingmenIDs)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " created formation with: " + wingmenIDs);
            }
        };

        var command = {"ID": this.ID, "wingmenIDs": wingmenIDs}
        var data = {"setLeader": command}

        xhr.send(JSON.stringify(data));
    }
    */
}

export class AirUnit extends Unit {
    getHidden() {
        if (this.alive)
        {
            if (this.flags.user && getVisibilitySettings().user === "hidden")
                return true
            else if (!this.flags.user && getVisibilitySettings().ai === "hidden")
                return true
        }
        else
            return getVisibilitySettings().dead === "hidden"
        return false;
    }
}

export class Aircraft extends AirUnit {
    constructor(ID: number, options: MarkerOptions) {
        var marker = new AircraftMarker(options);
        super(ID, marker);
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number, options: MarkerOptions) {
        var marker = new HelicopterMarker(options);
        super(ID, marker);
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number, options: MarkerOptions) {
        var marker = new GroundUnitMarker(options);
        super(ID, marker);
    }

    getHidden() {
        if (this.alive)
        {
            if (this.flags.user && getVisibilitySettings().user === "hidden")
                return true
            else if (!this.flags.user && getVisibilitySettings().ai === "hidden")
                return true
        }
        else
            return getVisibilitySettings().dead === "hidden"
        return false;
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number, options: MarkerOptions) {
        var marker = new NavyUnitMarker(options);
        super(ID, marker);
    }

    getHidden() {
        if (this.alive)
        {
            if (this.flags.user && getVisibilitySettings().user === "hidden")
                return true
            else if (!this.flags.user && getVisibilitySettings().ai === "hidden")
                return true
        }
        else
            return getVisibilitySettings().dead === "hidden"
        return false;
    }
}

export class Weapon extends Unit {
    getHidden() {
        if (this.alive)
        {
            if (!this.flags.user && getVisibilitySettings().weapon === "hidden")
                return true
        }
        else
            return getVisibilitySettings().dead === "hidden"
        return false;
    }
}

export class Missile extends Weapon {
    constructor(ID: number, options: MarkerOptions) {
        var marker = new WeaponMarker(options);
        super(ID, marker);
    }
}

export class Bomb extends Weapon {
    constructor(ID: number, options: MarkerOptions) {
        var marker = new WeaponMarker(options);
        super(ID, marker);
    }
}
