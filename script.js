// Tab functionality
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove('active');
    }
    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove('active');
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');

    // Trigger animation for content
    document.getElementById(tabName).style.animation = 'none';
    setTimeout(() => {
        document.getElementById(tabName).style.animation = '';
    }, 10);
}

// Initialize first tab
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.tab-button').click();
});

// Calculation Logic
function calculateCoolingLoad() {
    // --- Input Values ---
    const buildingType = document.getElementById('buildingType').value;
    const roomArea = parseFloat(document.getElementById('roomArea').value) || 0;
    const ceilingHeight = parseFloat(document.getElementById('ceilingHeight').value) || 2.8;
    const numOccupants = parseInt(document.getElementById('numOccupants').value) || 0;
    const windowArea = parseFloat(document.getElementById('windowArea').value) || 0;
    const windowFacing = document.getElementById('windowFacing').value;
    const equipmentLoadW = parseFloat(document.getElementById('equipmentLoad').value) || 0;
    const insulationQuality = document.getElementById('insulationQuality').value;

    // --- Basic Heat Load Factors (Simplified - these should be refined based on SS 553 principles) ---
    let baseLoadPerSqm_W = 120; // Base W/m^2 - general for tropical, adjust by building
    let occupantLoad_W_perPerson = 120; // Sensible + Latent (approx 70W sensible, 50W latent)
    let lightingLoad_W_perSqm = 10; // General lighting load

    // Adjust base load by building type (example values)
    switch(buildingType) {
        case 'residential_apartment': baseLoadPerSqm_W = 110; lightingLoad_W_perSqm = 8; break;
        case 'residential_landed': baseLoadPerSqm_W = 120; lightingLoad_W_perSqm = 10; break;
        case 'office_small': baseLoadPerSqm_W = 130; lightingLoad_W_perSqm = 12; occupantLoad_W_perPerson = 130; break;
        case 'office_large': baseLoadPerSqm_W = 150; lightingLoad_W_perSqm = 15; occupantLoad_W_perPerson = 130; break;
        case 'retail_shop': baseLoadPerSqm_W = 180; lightingLoad_W_perSqm = 20; occupantLoad_W_perPerson = 140; break;
        case 'classroom': baseLoadPerSqm_W = 160; lightingLoad_W_perSqm = 18; occupantLoad_W_perPerson = 125; break;
    }

    // --- Calculate Heat Components (in Watts) ---

    // 1. Sensible Load from Structure (Walls, Roof, Floor Conduction) - very simplified
    let structureLoad_W = roomArea * baseLoadPerSqm_W;

    // 2. Solar Gain through Windows (Simplified)
    let windowLoadFactor_W_perSqm = 50; // Base for unshaded
    switch(windowFacing) {
        case 'north': windowLoadFactor_W_perSqm = 80; break; // Can still get diffuse radiation
        case 'south': windowLoadFactor_W_perSqm = 120; break;
        case 'east': windowLoadFactor_W_perSqm = 200; break;
        case 'west': windowLoadFactor_W_perSqm = 280; break; // Highest solar gain
        case 'shaded': windowLoadFactor_W_perSqm = 40; break;
    }
    let windowSolarGain_W = windowArea * windowLoadFactor_W_perSqm;

    // 3. Occupant Load
    let occupantTotalLoad_W = numOccupants * occupantLoad_W_perPerson;

    // 4. Lighting Load
    let lightingTotalLoad_W = roomArea * lightingLoad_W_perSqm;

    // 5. Equipment Load (already in Watts)
    // equipmentLoadW is directly used

    // 6. Ventilation/Infiltration Load (Highly simplified - a proper calculation is complex)
    const roomVolume = roomArea * ceilingHeight;
    let ventilationLoad_W = roomArea * 20; // Simplified: 20 W/m^2 for ventilation/infiltration allowance

    // --- Total Heat Load (Watts) ---
    let totalLoad_W = structureLoad_W + windowSolarGain_W + occupantTotalLoad_W + lightingTotalLoad_W + equipmentLoadW + ventilationLoad_W;

    // Adjust for Insulation Quality
    switch(insulationQuality) {
        case 'good': totalLoad_W *= 0.85; break; // Reduce load by 15%
        case 'average': totalLoad_W *= 1.0; break; // No change
        case 'poor': totalLoad_W *= 1.20; break; // Increase load by 20%
    }

    // Safety Factor (typically 10-20%)
    totalLoad_W *= 1.15; // 15% safety factor

    // --- Convert to BTU/hr ---
    const totalLoad_BTUhr = totalLoad_W * 3.41214;
    const totalLoad_kW = totalLoad_W / 1000;

    // --- Display Results ---
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block'; // Make results visible

    document.getElementById('totalLoadBtu').textContent = `${totalLoad_BTUhr.toFixed(0)} BTU/hr`;
    document.getElementById('totalLoadKw').textContent = `${totalLoad_kW.toFixed(2)} kW`;

    // Animate the result values
    animateValue('totalLoadBtu', totalLoad_BTUhr.toFixed(0) + " BTU/hr");
    animateValue('totalLoadKw', totalLoad_kW.toFixed(2) + " kW");

    // --- AC Sizing and Type Suggestion ---
    let acSizeBTU = 0;
    let acSystem = "N/A";
    if (totalLoad_BTUhr <= 9000) acSizeBTU = 9000;
    else if (totalLoad_BTUhr <= 12000) acSizeBTU = 12000;
    else if (totalLoad_BTUhr <= 18000) acSizeBTU = 18000;
    else if (totalLoad_BTUhr <= 24000) acSizeBTU = 24000;
    else if (totalLoad_BTUhr <= 30000) acSizeBTU = 30000;
    else acSizeBTU = Math.ceil(totalLoad_BTUhr / 1000) * 1000;

    if (acSizeBTU <= 24000 && (buildingType.includes('residential') || buildingType === 'office_small')) {
         acSystem = `1 x ${acSizeBTU} BTU/hr unit (Single Split)`;
    } else if (totalLoad_BTUhr <= 40000 && (buildingType.includes('residential') || buildingType === 'office_small')) {
         acSystem = `Consider Multi-Split System (e.g., System 2 or 3, total ~${acSizeBTU} BTU/hr)`;
    } else if (buildingType.includes('office_large') || buildingType === 'retail_shop' || totalLoad_BTUhr > 40000) {
        acSystem = `Consider Cassette, Ducted, or VRF/VRV system (total ~${acSizeBTU} BTU/hr)`;
    } else {
         acSystem = `~${acSizeBTU} BTU/hr. Consult professional for system type.`;
    }

    document.getElementById('acSizeSuggestion').textContent = `${acSizeBTU} BTU/hr (${acSystem})`;
    animateValue('acSizeSuggestion', `${acSizeBTU} BTU/hr (${acSystem})`);

    let acTypeRec = "Based on load and building type: ";
    if (totalLoad_BTUhr < 28000 && (buildingType.includes('residential') || buildingType === 'office_small')) {
        acTypeRec += "Wall-mounted Split AC is common. ";
        if (roomArea < 15 && totalLoad_BTUhr < 10000) acTypeRec += "A window unit might be an option for very small rooms if permitted. ";
    } else if (buildingType.includes('office_large') || buildingType.includes('retail') || buildingType.includes('classroom') || totalLoad_BTUhr >= 28000) {
        acTypeRec += "Consider Cassette ACs for even distribution in larger spaces, Ducted systems for aesthetics and multiple zone control, or VRF/VRV systems for larger buildings with diverse loads. ";
    } else {
        acTypeRec += "Consult with a professional for optimal AC type. ";
    }
    document.getElementById('acTypeSuggestion').textContent = acTypeRec;

    // --- Brand Recommendations (Generic & Illustrative) ---
    const brandList = document.getElementById('brandList');
    brandList.innerHTML = ''; // Clear previous
    let brands = [];
    if (buildingType.includes('residential')) {
        brands = ["Daikin", "Mitsubishi Electric", "Panasonic", "LG", "Samsung", "Midea"];
    } else if (buildingType.includes('office') || buildingType.includes('retail')) {
        brands = ["Daikin", "Mitsubishi Electric", "Toshiba Carrier", "York", "Trane (for larger systems)"];
    } else {
        brands = ["Daikin", "Mitsubishi Electric", "Panasonic", "LG", "Carrier", "York"];
    }

    const noteLi = document.createElement('li');
    noteLi.textContent = "Always check for models with high NEA Energy Efficiency Ratings (e.g., 5 Ticks).";
    brandList.appendChild(noteLi);

    const noteLi2 = document.createElement('li');
    noteLi2.textContent = "Consider after-sales service and warranty in your region.";
    brandList.appendChild(noteLi2);

    brands.forEach(brand => {
        const li = document.createElement('li');
        li.textContent = `${brand}: Good range for ${buildingType.replace("_", " ")}.`;
        brandList.appendChild(li);
    });

    if (totalLoad_BTUhr > 40000 || buildingType.includes('office_large') || buildingType.includes('retail_shop')) {
         const liVRF = document.createElement('li');
         liVRF.textContent = "For VRF/VRV systems: Daikin, Mitsubishi Electric, Hitachi, Toshiba, Panasonic often have strong offerings.";
         brandList.appendChild(liVRF);
    }

     // Scroll to results with a smooth animation
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Helper function to animate value changes
function animateValue(id, endValue) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('value-highlight');
        element.textContent = endValue; // Update text directly
        setTimeout(() => {
            element.classList.remove('value-highlight');
        }, 1000); // Duration of highlight animation
    }
}

// Add event listeners to inputs for dynamic feedback
const inputs = document.querySelectorAll('#coolingLoadCalc input, #coolingLoadCalc select');
inputs.forEach(input => {
    input.addEventListener('change', () => {
        // Could add a small visual cue or a "recalculate needed" message
        // For now, just rely on the button click
    });
});
