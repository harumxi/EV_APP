<?php
class EvCatalogService {
    // Logic for filtering EV variants and specifications [cite: 21]
    public function getVariantSpecs($variantData) {
        return [
            'battery_capacity' => $variantData['capacity'],
            'range' => $variantData['nominal_range']
        ];
    }
}