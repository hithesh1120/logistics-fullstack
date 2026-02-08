# Project Update Summary

## Recent Changes

### 1. New Shipment Form Redesign
- **Full-Page Split Layout**: The form now uses a large modal with a 2-column grid.
- **Left Panel**: Dedicated map area with discovery tools.
- **Right Panel**: Form fields for Item Name, Dimensions, Volume, and Weight.

### 2. Advanced Pincode Search
- **Boundary Visualization**: Searching a pincode (e.g., `500032`) now draws a **dotted orange boundary** around the postal region.
- **Nearby Areas List**: A sidebar displays villages/suburbs within 5km of the pincode (fetched via Overpass API).
- **Click-to-Select**: Clicking on any name in the "Nearby Areas" list automatically selects that location on the map.

### 3. Volume Unit Selector
- Replaced the simple toggle with a **Dropdown Menu**.
- Supports **m³**, **cm³**, and **ft³**.
- Automatically converts the displayed volume when switching units.

## Key Files Modified
- `frontend/src/pages/MSMEPortal.jsx` (Form logic & Layout)
- `frontend/src/pages/MSMEPortal.css` (Modal & Grid styles)
- `frontend/src/components/LocationPickerMap.jsx` (Map, Geocoding, Boundary, Overpass API)

## How to Run
1. **Backend**: `uvicorn main:app --reload` (Port 8000)
2. **Frontend**: `npm run dev` (Port 5173)
