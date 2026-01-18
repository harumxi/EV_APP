<?php
// BACKEND/CONFIG/api_keys.php

return [
    // 1. OpenRouteService (Route Calculation)
    'ors' => [
        'api_key'   => 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE5YjQxNDViMTMyMTQ5MmQ4ZTg1MjBmYWRjOTNhMDU0IiwiaCI6Im11cm11cjY0In0=',
        'base_url'  => 'https://api.openrouteservice.org/v2/directions/'
    ],

    // 2. API Ninjas (EV Specifications & Backup Charger Search)
    'api_ninjas' => [
        'api_key'   => 'LbrluHCyTzaxVI1CJAtO2LQMnrcfstO5gnjABkWh',
        'base_url'  => 'https://api.api-ninjas.com/v1/'
    ],

    // 3. OpenChargeMap (Primary Charger Search)
    'ocm' => [
        'api_key'   => 'b81965b3-ac20-4da1-af40-4b450c802e3e',
        'base_url'  => 'https://api.openchargemap.io/v3/poi/'
    ],

    // 4. Photon / Komoot (Search & Geocoding - Free, No Key)
    'photon' => [
        'api_key'   => null,
        'base_url'  => 'https://photon.komoot.io/api/'
    ],

    // 5. Open-Meteo (Weather - Free, No Key)
    'open_meteo' => [
        'api_key'   => null,
        'base_url'  => 'https://api.open-meteo.com/v1/forecast'
    ]
];
?>