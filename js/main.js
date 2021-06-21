/* This will let you use the .remove() function later on */
if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function () {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtZWRtZXJhIiwiYSI6ImNrcDY1d2h6czA4ZXMydm9mdzV4MmU3YWYifQ.If5WGfRC1pqanDDc8t9pDg';

let COORDS = [];
const prefix = "./img/";

/**
 * Add the map to the page
 */
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [9.203526, 45.4804689],
    zoom: 13,
    scrollZoom: false
});

const stores = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [9.2228424, 45.476403]
            },
            'properties': {
                'available': generateNumber(),
                'image': prefix + 'pascoli-10-agosto.jpeg',
                'address': 'Via G. Pascoli, 100',
                'city': 'Milano',
                'country': 'Italia'
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [9.2148213, 45.4866637]
            },
            'properties': {
                'available': generateNumber(),
                'image': prefix + 'mussolini_loreto.jpeg',
                'address': 'Piazzale Loreto, 10',
                'city': 'Milano',
                'country': 'Italia'
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [9.1963736, 45.4655698]
            },
            'properties': {
                'available': generateNumber(),
                'image': prefix + 'r75_v4.jpg',
                'address': 'Via Durini, 28',
                'city': 'Milano',
                'country': 'Italia'
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [9.1896341, 45.4649405]
            },
            'properties': {
                'available': generateNumber(),
                'image': prefix + 'dannunzio.jpeg',
                'address': 'P.za del Duomo, Rinascente',
                'city': 'Milano',
                'country': 'Italia'
            }
        }

    ]
};

/**
 * Assign a unique id to each store. You'll use this `id`
 * later to associate each point on the map with a listing
 * in the sidebar.
 */
stores.features.forEach(function (store, i) {
    store.properties.id = i;
});

/**
 * Wait until the map loads to make changes to the map.
 */
map.on('load', function (e) {
    /**
     * This is where your '.addLayer()' used to be, instead
     * add only the source without styling a layer
     */
    map.addSource('places', {
        'type': 'geojson',
        'data': stores
    });

    /**
     * Create a new MapboxGeocoder instance.
     */
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: true,
        bbox: [9.1743, 45.292389, 9.2594723, 45.5112239]
    });


    /**
     * create a new GeolocateControl instance
     */
    const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    })


    /**
     * Add all the things to the page:
     * - The location listings on the side of the page
     * - The search box (MapboxGeocoder) onto the map
     * - The markers onto the map
     */
    buildLocationList(stores);
    map.addControl(geocoder, 'top-left');
    map.addControl(geolocate);
    addMarkers();

    /**
     * Listen for when a geocoder result is returned. When one is returned:
     * - Calculate distances
     * - Sort stores by distance
     * - Rebuild the listings
     * - Adjust the map camera
     * - Open a popup for the closest store
     * - Highlight the listing for the closest store.
     */
    geocoder.on('result', function (ev) {
        /* Get the coordinate of the search result */
        const searchResult = ev.result.geometry;

        console.log(searchResult)

        /**
         * Calculate distances:
         * For each store, use turf.disance to calculate the distance
         * in miles between the searchResult and the store. Assign the
         * calculated value to a property called `distance`.
         */
        const options = {units: 'miles'};
        stores.features.forEach(function (store) {
            Object.defineProperty(store.properties, 'distance', {
                value: turf.distance(searchResult, store.geometry, options),
                writable: true,
                enumerable: true,
                configurable: true
            });
        });

        /**
         * Sort stores by distance from closest to the `searchResult`
         * to furthest.
         */
        stores.features.sort(function (a, b) {
            if (a.properties.distance > b.properties.distance) {
                return 1;
            }
            if (a.properties.distance < b.properties.distance) {
                return -1;
            }
            return 0; // a must be equal to b
        });

        /**
         * Rebuild the listings:
         * Remove the existing listings and build the location
         * list again using the newly sorted stores.
         */
        const listings = document.getElementById('listings');
        while (listings.firstChild) {
            listings.removeChild(listings.firstChild);
        }
        buildLocationList(stores);

        /* Open a popup for the closest store. */
        createPopUp(stores.features[0]);

        /** Highlight the listing for the closest store. */
        const activeListing = document.getElementById(
            'listing-' + stores.features[0].properties.id
        );
        activeListing.classList.add('active');

        /**
         * Adjust the map camera:
         * Get a bbox that contains both the geocoder result and
         * the closest store. Fit the bounds to that bbox.
         */
        const bbox = getBbox(stores, 0, searchResult);
        map.fitBounds(bbox, {
            padding: 100
        });
    });


    /**
     * Listen for location of user
     * - Calculate distances
     * - Sort stores by distance
     * - Rebuild the listings
     * - Adjust the map camera
     * - Open a popup for the closest store
     * - Highlight the listing for the closest store.
     */
    geolocate.on('geolocate', function (ev) {
        /* Get the coordinate of user */
        const coords = {type: "Point", coordinates: Array.of(ev.coords.longitude, ev.coords.latitude)};

        /**
         * Calculate distances:
         * For each store, use turf.disance to calculate the distance
         * in miles between the coords and the store. Assign the
         * calculated value to a property called `distance`.
         */
        const options = {units: 'miles'};
        stores.features.forEach(function (store) {
            Object.defineProperty(store.properties, 'distance', {
                value: turf.distance(coords, store.geometry, options),
                writable: true,
                enumerable: true,
                configurable: true
            });
        });

        /**
         * Sort stores by distance from closest to the `coords`
         * to furthest.
         */
        stores.features.sort(function (a, b) {
            if (a.properties.distance > b.properties.distance) {
                return 1;
            }
            if (a.properties.distance < b.properties.distance) {
                return -1;
            }
            return 0; // a must be equal to b
        });

        /**
         * Rebuild the listings:
         * Remove the existing listings and build the location
         * list again using the newly sorted stores.
         */
        const listings = document.getElementById('listings');
        while (listings.firstChild) {
            listings.removeChild(listings.firstChild);
        }
        buildLocationList(stores);

        /* Open a popup for the closest store. */
        createPopUp(stores.features[0]);

        /** Highlight the listing for the closest store. */
        const activeListing = document.getElementById(
            'listing-' + stores.features[0].properties.id
        );
        activeListing.classList.add('active');

        /**
         * Adjust the map camera:
         * Get a bbox that contains both the geocoder result and
         * the closest store. Fit the bounds to that bbox.
         */
        const bbox = getBbox(stores, 0, coords);
        map.fitBounds(bbox, {
            padding: 100
        });
    });


});

/**
 * Using the coordinates (lng, lat) for
 * (1) the search result and
 * (2) the closest store
 * construct a bbox that will contain both points
 */
function getBbox(sortedStores, storeIdentifier, searchResult) {
    const lats = [
        sortedStores.features[storeIdentifier].geometry.coordinates[1],
        searchResult.coordinates[1]
    ];
    const lons = [
        sortedStores.features[storeIdentifier].geometry.coordinates[0],
        searchResult.coordinates[0]
    ];
    const sortedLons = lons.sort(function (a, b) {
        if (a > b) {
            return 1;
        }
        if (a.distance < b.distance) {
            return -1;
        }
        return 0;
    });
    const sortedLats = lats.sort(function (a, b) {
        if (a > b) {
            return 1;
        }
        if (a.distance < b.distance) {
            return -1;
        }
        return 0;
    });
    return [
        [sortedLons[0], sortedLats[0]],
        [sortedLons[1], sortedLats[1]]
    ];
}

/**
 * Add a marker to the map for every store listing.
 **/
function addMarkers() {
    /* For each feature in the GeoJSON object above: */
    stores.features.forEach(function (marker) {
        /* Create a div element for the marker. */
        const el = document.createElement('div');
        /* Assign a unique `id` to the marker. */
        el.id = 'marker-' + marker.properties.id;
        /* Assign the `marker` class to each marker for styling. */
        el.className = 'marker';

        /**
         * Create a marker using the div element
         * defined above and add it to the map.
         **/
        new mapboxgl.Marker(el, {offset: [0, -23]})
            .setLngLat(marker.geometry.coordinates)
            .addTo(map);

        /**
         * Listen to the element and when it is clicked, do three things:
         * 1. Fly to the point
         * 2. Close all other popups and display popup for clicked store
         * 3. Highlight listing in sidebar (and remove highlight for all other listings)
         **/
        el.addEventListener('click', function (e) {
            flyToStore(marker);
            createPopUp(marker);
            const activeItem = document.getElementsByClassName('active');
            e.stopPropagation();
            if (activeItem[0]) {
                activeItem[0].classList.remove('active');
            }
            const listing = document.getElementById(
                'listing-' + marker.properties.id
            );
            listing.classList.add('active');
        });
    });
}

/**
 * Add a listing for each store to the sidebar.
 **/
function buildLocationList(data) {
    data.features.forEach(function (store, i) {
        /**
         * Create a shortcut for `store.properties`,
         * which will be used several times below.
         **/
        const prop = store.properties;

        /* Add a new listing section to the sidebar. */
        const listings = document.getElementById('listings');
        const listing = listings.appendChild(document.createElement('div'));
        /* Assign a unique `id` to the listing. */
        listing.id = 'listing-' + prop.id;
        /* Assign the `item` class to each listing for styling. */
        listing.className = 'item';

        /* Add the link to the individual listing created above. */
        const link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.id = 'link-' + prop.id;
        link.innerHTML = prop.address;

        /* Add details to the individual listing. */
        const details = listing.appendChild(document.createElement('div'));
        details.innerHTML = prop.city + ' &middot;  ';

        details.innerHTML += (prop.available) ? ('<b>' + prop.available + '</b>' + ' bike available') : ' <b> No bike available </b>';

        if (prop.distance) {
            const roundedDistance = Math.round(prop.distance * 100) / 100;
            details.innerHTML +=
                '<p><strong>' + roundedDistance + ' miles away</strong></p>';
        }

        /**
         * Listen to the element and when it is clicked, do four things:
         * 1. Update the `currentFeature` to the store associated with the clicked link
         * 2. Fly to the point
         * 3. Close all other popups and display popup for clicked store
         * 4. Highlight listing in sidebar (and remove highlight for all other listings)
         **/
        link.addEventListener('click', function (e) {
            for (let i = 0; i < data.features.length; i++) {
                if (this.id === 'link-' + data.features[i].properties.id) {
                    const clickedListing = data.features[i];
                    flyToStore(clickedListing);
                    createPopUp(clickedListing);
                }
            }
            const activeItem = document.getElementsByClassName('active');
            if (activeItem[0]) {
                activeItem[0].classList.remove('active');
            }
            this.parentNode.classList.add('active');
        });
    });
}

/**
 * Use Mapbox GL JS's `flyTo` to move the camera smoothly
 * a given center point.
 **/
function flyToStore(currentFeature) {
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 15
    });
}

/**
 * Create a Mapbox GL JS `Popup`.
 **/
function createPopUp(currentFeature) {
    const popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) popUps[0].remove();



    const bikeAvailable = (currentFeature.properties.available) ? ('<h2> <b>' + currentFeature.properties.available + ' <i class="fas fa-bicycle"></i> </b> </h2>') : (' <h4> No bike available </h4>');
    const popup = new mapboxgl.Popup({closeOnClick: false})
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(
            '<h3>M-Bike</h3>' +
            '<h4>' +
            currentFeature.properties.address +
            '</h4>' + bikeAvailable +
            '<h2><a href="javascript:void(0)" class="links" id = "#' + currentFeature.properties.id +'" onclick="openPopUp(this)">Scopri di più <i class="fas fa-gift"></i></a></h2>'
        )
        .addTo(map);
}



/**
 * Use Mapbox GL JS's `flyTo` to move the camera smoothly
 * a given center point.
 **/
function flyToNormal(currentPosition) {
    Array.from(document.getElementsByClassName('mapboxgl-popup')).forEach(popUp => popUp.remove()) // remove popUp
    Array.from(document.getElementsByClassName('active')).forEach(item => item.classList.remove("active")) // remove active class

    map.flyTo({
        center: currentPosition,
        zoom: 13
    });
}


map.on("click", e => {
    closeAllPopUp();
    flyToNormal(e.lngLat.wrap())
})

map.on('mousemove', e => {
    COORDS = e.lngLat.wrap();
    // console.log(COORDS)
});


/**
 * generate number
 * @return {number}
 */
function generateNumber() {
    return Math.floor(Math.random() * 51);
}


/**
 * change copyright
 */
(function changeCopyRight() {
    const copyRightBottomRight = document.getElementsByClassName("mapboxgl-ctrl-bottom-right")[0],
        copyRightBottomLeft = document.getElementsByClassName("mapboxgl-ctrl-bottom-left")[0],
        div = document.createElement('div'),
        anchor = document.createElement('a');


    div.setAttribute("class", "mapboxgl-ctrl m-bike");
    div.style.display = "block";

    anchor.setAttribute('href', "https://mera.ddns.net");
    anchor.setAttribute('target', "_blank");

    anchor.appendChild(document.createTextNode("Ahmed Mera"));
    div.appendChild(anchor)

    copyRightBottomLeft.remove();
    copyRightBottomRight.innerHTML = "";

    copyRightBottomRight.appendChild(div)
}())


/**
 * funtion to create popup
 * @param urlImage
 * @param id
 * @return {HTMLDivElement}
 */
function createPopUpWithFoto(urlImage, id){

    let el = document.createElement("div"),
        image = document.createElement("img"),
        i = document.createElement("i");


    i.setAttribute("class", "fas fa-times close");
    i.setAttribute("id", id);
    i.setAttribute("onclick", "closePopUp(this)");

    image.setAttribute("src", urlImage);
    image.setAttribute("alt", "foto");

    el.setAttribute("class", "popup-foto")
    el.setAttribute("id", id);


    el.appendChild(image);
    el.appendChild(i);

    return el;
}


/**
 * function to open popUp
 * @param e
 */
function openPopUp(e) {
    document.getElementById(e.getAttribute("id").replace("#", "")).style.display = "block";
}


/**
 * function to open popUp
 * @param e
 */
function closePopUp(e) {
    document.getElementById(e.getAttribute("id")).style.display = "none";
    flyToNormal(COORDS)
}


function closeAllPopUp(){
    Array.from(document.getElementsByClassName("popup-foto")).forEach(item => item.style.display = "none");
}

/**
 * create popip with foto
 */
stores.features.forEach(item => document.body.appendChild(createPopUpWithFoto( item.properties.image, item.properties.id)))


