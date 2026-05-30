import { INITIAL_DB } from '../lib/demoData';

const DAAS_URL = 'https://29dd52b2-e0be-43c7-a587-2c78d2dc107a.daas4.buildpad.ai';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("❌ Usage: node setup_daas.js <email> <password>");
    process.exit(1);
}

const email = args[0];
const password = args[1];

async function run() {
    console.log("🚀 Starting Enterprise DaaS Setup...");
    
    // 1. Login
    console.log("🔑 Logging into DaaS as Admin...");
    const loginRes = await fetch(`${DAAS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!loginRes.ok) {
        console.error("❌ Login failed. Please check your email and password.");
        console.error(await loginRes.text());
        process.exit(1);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.data.access_token;
    console.log("✅ Logged in successfully.");

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Iterate and create collections and data
    for (const [collectionName, dataArray] of Object.entries(INITIAL_DB)) {
        if (!dataArray || dataArray.length === 0) continue;
        
        console.log(`\n📦 Processing Collection: ${collectionName}`);
        
        // Ensure collection exists (if it fails, it usually means it exists)
        const createCollRes = await fetch(`${DAAS_URL}/collections`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                collection: collectionName,
                meta: { icon: "database" },
                schema: { name: collectionName }
            })
        });

        if (createCollRes.ok) {
            console.log(`   ✅ Created collection '${collectionName}'`);
            
            // Extract fields from the first object
            const sampleObj = dataArray[0];
            for (const [key, value] of Object.entries(sampleObj)) {
                if (key === 'id') continue; // ID is usually auto-managed
                
                let type = 'string';
                if (typeof value === 'number') type = 'integer';
                if (typeof value === 'boolean') type = 'boolean';
                
                // Create field
                await fetch(`${DAAS_URL}/fields/${collectionName}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        field: key,
                        type: type,
                        schema: { data_type: type === 'integer' ? 'int' : 'varchar' }
                    })
                });
            }
            console.log(`   ✅ Created fields for '${collectionName}'`);
            
            // Allow public read/write for the hackathon prototype
            // We find the Public role ID first
            const rolesRes = await fetch(`${DAAS_URL}/roles`, { headers });
            const rolesData = await rolesRes.json();
            const publicRole = rolesData.data.find((r: any) => r.name === 'Public');
            if (publicRole) {
                await fetch(`${DAAS_URL}/permissions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        role: publicRole.id,
                        collection: collectionName,
                        action: 'read',
                        permissions: {}
                    })
                });
                await fetch(`${DAAS_URL}/permissions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        role: publicRole.id,
                        collection: collectionName,
                        action: 'create',
                        permissions: {}
                    })
                });
                await fetch(`${DAAS_URL}/permissions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        role: publicRole.id,
                        collection: collectionName,
                        action: 'update',
                        permissions: {}
                    })
                });
            }
        } else {
            console.log(`   ℹ️ Collection '${collectionName}' already exists or cannot be created.`);
        }

        // 3. Insert Data
        console.log(`   📥 Inserting ${dataArray.length} records into '${collectionName}'...`);
        const insertRes = await fetch(`${DAAS_URL}/items/${collectionName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(dataArray)
        });
        
        if (insertRes.ok) {
            console.log(`   ✅ Successfully seeded ${collectionName}.`);
        } else {
            console.error(`   ❌ Failed to seed ${collectionName}.`);
            console.error(await insertRes.text());
        }
    }

    console.log("\n🎉 ENTERPRISE DAAS SETUP COMPLETE! 🎉");
    console.log("Your cloud database is now fully populated with the golden demo data.");
}

run();
