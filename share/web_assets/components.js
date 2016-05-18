/*
 * Copyright 2012 the original author or authors.
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class RCStateComponent
{
    static get annotations()
    {
        return [new ng.core.Component({
            selector: 'rcstate',
            template: '<div>RC Channels: {{channels | async}}</div>'
        })];
    }

    static get parameters()
    {
        return [Copter];
    }

    constructor(Copter)
    {
        this.channels = Copter.getRCChannels();
    }
}

class WaypointComponent
{
    static get annotations()
    {
        return [new ng.core.Component({
            selector: 'rospilotwaypoint',
            template: "<div>Lat: {{latitude | async | number:'1.1-5'}}, Lng: {{longitude | async | number:'1.1-5'}}, Alt: {{altitude | async | number:'1.1-1'}}m</div>"
        })];
    }

    static get parameters()
    {
        return [Copter];
    }

    constructor(Copter)
    {
        this.latitude = Copter.getWaypoint()
            .map(waypoint => waypoint.latitude);
        this.longitude = Copter.getWaypoint()
            .map(waypoint => waypoint.longitude);
        this.altitude = Copter.getWaypoint()
            .map(waypoint => waypoint.altitude);
    }
}

class GlobalPositionComponent
{
    static get annotations()
    {
        return [new ng.core.Component({
            selector: 'globalposition',
            template: '<div>Lat: {{latitude | async}}, Lng: {{longitude | async}}</div>'
        })];
    }

    static get parameters()
    {
        return [Copter];
    }

    constructor(Copter)
    {
        this.latitude = Copter.getGlobalPosition()
            .map(position => position.latitude);
        this.longitude = Copter.getGlobalPosition()
            .map(position => position.longitude);
    }
}

class MapComponent
{
    static get annotations()
    {
        return [new ng.core.Component({
            selector: 'rospilotmap',
            template: ''
        })];
    }

    static get parameters()
    {
        return [Copter];
    }

    constructor(Copter)
    {
        var map = L.map('map', {
            crs: L.CRS.EPSG3857,
            center: {lat: 37.77, lng: -122.49},
            zoom: 10,
            contextmenu: true,
            contextmenuWidth: 150,
            contextmenuItems: [
                {
                    text: 'Set Waypoint',
                    callback: function(e) {
                        Copter.setWaypoint(e.latlng.lat, e.latlng.lng);
                    },
                }
            ],
        });
        var server_name = window.location.hostname;
        var mapnik_url = 'http://' + server_name + ':8086/ex/{z}/{x}/{y}.png';

        L.tileLayer(mapnik_url, {
            maxZoom: 18,
        }).addTo(map);

        var copterIcon = L.AwesomeMarkers.icon({
            prefix: 'fa',
            icon: 'plane',
            markerColor: 'red'
        });

        this.marker = L.marker([37.77, -122.49], {
            title: 'Multicopter',
            icon: copterIcon
        }).addTo(map);

        var waypointIcon = L.AwesomeMarkers.icon({
            prefix: 'fa',
            icon: 'flag',
            markerColor: 'green'
        });

        this.waypoint_marker = L.marker([37.77, -122.49], {
            title: 'Waypoint',
            icon: waypointIcon
        }).addTo(map);

        Copter.getWaypoint().subscribe((waypoint) => {
            var lat = waypoint.latitude;
            var lng = waypoint.longitude;
            this.waypoint_marker.setLatLng([lat, lng]);
        });

        Copter.getGlobalPosition().subscribe((position) => {
            this.marker.setLatLng([position.latitude, position.longitude]);
        });
    }
}

class ComeHereComponent
{
    static get annotations()
    {
        return [new ng.core.Component({
            selector: 'rospilotcomehere',
            template: '<button type="button" class="btn" (click)="clicked()">Come To Me</button>'
        })];
    }

    static get parameters()
    {
        return [Copter];
    }

    constructor(Copter)
    {
        this.copter = Copter;
    }

    clicked()
    {
        navigator.geolocation.getCurrentPosition((loc) => {
            this.copter.setWaypoint(loc.coords.latitude, loc.coords.longitude);
        });
    }
}