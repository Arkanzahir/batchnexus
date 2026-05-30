export const DEMO_USERS = [
    { id: "USR-001", name: "Dimas Pratama", role: "Receiving Operator" },
    { id: "USR-002", name: "Rani Wulandari", role: "QC Staff" },
    { id: "USR-003", name: "Budi Hartono", role: "PPIC Planner" },
    { id: "USR-004", name: "Andi Saputra", role: "Warehouse Admin" },
    { id: "USR-005", name: "Maya Santoso", role: "Operations Manager" },
    { id: "USR-006", name: "Sari Putri", role: "Customer Service" },
];

export const DEMO_SUPPLIERS = [
    { id: "SUP-002", name: "Java Citrus Farm", country: "Indonesia" }
];

export const DEMO_MATERIALS = [
    {
        id: "MAT-002",
        material_code: "CIT-EXT-001",
        name: "Citrus Peel Extract",
        category: "Extract Liquid",
        hazard_class: "Flammable",
        temp_min: -20,
        temp_max: -4,
        qc_profile: "extract-liquid-visual"
    }
];

export const DEMO_RECEIPTS = [
    {
        id: "REC-2026-002",
        supplier_id: "SUP-002",
        material_id: "MAT-002",
        receipt_no: "REC-2026-002",
        arrival_time: "2026-05-28T09:10:00+07:00",
        date_created: "2026-05-28T09:10:00+07:00",
        quantity: 12,
        unit: "drums",
        batch_reference: "JCF-CIT-0526",
        temperature_requirement: "-20°C to -4°C",
        hazard_class: "Flammable",
        extraction_confidence: 0.91,
        status: "Pending QC",
        created_by: "USR-001"
    }
];

export const DEMO_QC_INSPECTIONS = [
    {
        id: "QC-2026-002",
        receipt_id: "REC-2026-002",
        colour_score: 87,
        defect_risk: "Low",
        foreign_matter_risk: "Low",
        recommendation: "Pass with human review",
        confidence: 0.86,
        reason_codes: [
            "Colour is within expected range",
            "No visible dark spots detected",
            "Texture appears consistent"
        ],
        human_decision: "QC Released",
        inspected_by: "USR-002",
        date_created: "2026-05-28T10:42:00+07:00",
        inspected_at: "2026-05-28T10:42:00+07:00"
    }
];

export const DEMO_LOTS = [
    {
        id: "LOT-2026-051",
        lot_number: "LOT-2026-051",
        source_receipt_id: "REC-2026-002",
        material_id: "MAT-002",
        quantity: 12,
        status: "Stored",
        current_location: "HAZ-D-04",
        released_at: "2026-05-28T10:45:00+07:00",
        date_created: "2026-05-28T10:45:00+07:00"
    }
];

export const DEMO_WAREHOUSE_ZONES = [
    { id: "AMB-A", name: "Ambient storage", temp_min: 15, temp_max: 30, hazard_policy: "No flammable", status: "Active" },
    { id: "COLD-B", name: "Cold storage", temp_min: -4, temp_max: 4, hazard_policy: "No flammable", status: "Active" },
    { id: "FRZ-C", name: "Freezer storage", temp_min: -20, temp_max: -4, hazard_policy: "No flammable", current_temperature: -3, status: "Cold-chain Alert" },
    { id: "HAZ-D", name: "Hazard-compatible storage", temp_min: -20, temp_max: 25, hazard_policy: "Flammable allowed", capacity: 30, occupied: 20, status: "Active" },
    { id: "HOLD-QC", name: "Quarantine", status: "QC hold" }
];

export const DEMO_WAREHOUSE_BINS = [
    { id: "BIN-HAZ-D-04", zone_id: "HAZ-D", bin_code: "HAZ-D-04", capacity: 12, occupied: 12, status: "Occupied" }
];

export const DEMO_INVENTORY_MOVES = [
    {
        id: "MOVE-2026-001",
        lot_id: "LOT-2026-051",
        to_bin_id: "BIN-HAZ-D-04",
        quantity: 12,
        moved_by: "USR-004",
        date_created: "2026-05-28T11:05:00+07:00",
        moved_at: "2026-05-28T11:05:00+07:00",
        reason: "AI recommended slot accepted"
    }
];

export const DEMO_SAMPLE_DISPATCHES = [
    {
        id: "DSP-001",
        lot_id: "LOT-2026-051",
        lot_number: "LOT-2026-051",
        customer_name: "AromaWell Singapore",
        destination: "Export — Singapore",
        dispatch_type: "Sample",
        quantity_sample: 2,
        status: "In Dispatch",
        date_created: "2026-05-29T09:00:00+07:00"
    },
    {
        id: "DSP-002",
        lot_id: "LOT-2026-051",
        lot_number: "LOT-2026-051",
        customer_name: "Nusantara Beverage Lab",
        destination: "Local — Jakarta",
        dispatch_type: "Sample",
        quantity_sample: 1,
        status: "Pending Courier",
        date_created: "2026-05-29T10:00:00+07:00"
    }
];

export const DEMO_AUDIT_LOG = [
    {
        id: "AUD-001",
        timestamp: "2026-05-28T09:10:00+07:00",
        date_created: "2026-05-28T09:10:00+07:00",
        actor: "Dimas Pratama",
        role: "Receiving Operator",
        action: "Completed AI extraction",
        entity: "REC-2026-002",
        change_detail: "Supplier, material, quantity, temperature, and hazard fields extracted with 91% confidence."
    },
    {
        id: "AUD-002",
        timestamp: "2026-05-28T09:18:00+07:00",
        date_created: "2026-05-28T09:18:00+07:00",
        actor: "Dimas Pratama",
        role: "Receiving Operator",
        action: "Submitted receipt to QC",
        entity: "REC-2026-002",
        change_detail: "Status changed from Draft to Pending QC."
    },
    {
        id: "AUD-003",
        timestamp: "2026-05-28T10:42:00+07:00",
        date_created: "2026-05-28T10:42:00+07:00",
        actor: "Rani Wulandari",
        role: "QC Staff",
        action: "Approved QC release",
        entity: "QC-2026-002",
        change_detail: "Status changed from Pending QC to QC Released."
    },
    {
        id: "AUD-004",
        timestamp: "2026-05-28T10:45:00+07:00",
        date_created: "2026-05-28T10:45:00+07:00",
        actor: "System",
        role: "BatchNexus",
        action: "Generated lot number",
        entity: "LOT-2026-051",
        change_detail: "Lot created from REC-2026-002."
    },
    {
        id: "AUD-005",
        timestamp: "2026-05-28T11:05:00+07:00",
        date_created: "2026-05-28T11:05:00+07:00",
        actor: "Andi Saputra",
        role: "Warehouse Admin",
        action: "Assigned warehouse slot",
        entity: "MOVE-2026-001",
        change_detail: "LOT-2026-051 assigned to HAZ-D-04."
    }
];

export const INITIAL_DB = {
    users: DEMO_USERS,
    suppliers: DEMO_SUPPLIERS,
    materials: DEMO_MATERIALS,
    inbound_receipts: DEMO_RECEIPTS,
    qc_inspections: DEMO_QC_INSPECTIONS,
    lots: DEMO_LOTS,
    warehouse_zones: DEMO_WAREHOUSE_ZONES,
    warehouse_bins: DEMO_WAREHOUSE_BINS,
    inventory_moves: DEMO_INVENTORY_MOVES,
    sample_dispatches: DEMO_SAMPLE_DISPATCHES,
    audit_logs: DEMO_AUDIT_LOG
};
