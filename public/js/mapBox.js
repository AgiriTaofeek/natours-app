/*eslint-disable */
console.log('mapBox js ')
export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoidG9sYW5pc2lyaXVzIiwiYSI6ImNscm1ucjYzZjA0N3MyanFsc25mOWJybjIifQ.pORofzlGVpCPqEzIVg3l2w'
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/tolanisirius/cl8zdhlw1005s14ldvwgj3bra/draft', // style URL
        scrollZoom: false,
        // center: [-74.5, 40], // starting position [lng, lat]
        // zoom: 9, // starting zoom
    })

    // Creating the boundary. think of it as a container. in js, it returns an object which has a method called extend() which we can use to extend our boundary based on those locations
    const bounds = new mapboxgl.LngLatBounds()
    // console.log(bounds)
    locations.forEach((location) => {
        //create marker
        const el = document.createElement('div')
        el.className = 'marker'

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(location.coordinates)
            .addTo(map)

        // Create and add popup on the marker when hover
        new mapboxgl.Popup({
            offset: 30,
        })
            .setLngLat(location.coordinates)
            .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
            .addTo(map)

        // Extend map bounds to include current location. This makes sure that all the locations are within a boundary using their lng and lat
        bounds.extend(location.coordinates)
    })

    //Make the map visually fit within the boundary we extended above
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    })
}
