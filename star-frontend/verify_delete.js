const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000';

async function verify() {
    try {
        console.log("1. Logging in as Admin...");
        let adminToken;
        try {
            const loginRes = await axios.post(`${BASE_URL}/token`, {
                username: 'admin_test',
                password: 'admin123'
            });
            adminToken = loginRes.data.access_token;
            console.log("   Login successful as admin_test.");
        } catch (e) {
            console.log("   Login as admin_test failed, trying default admin...");
            const loginRes = await axios.post(`${BASE_URL}/token`, {
                username: 'admin',
                password: 'password123'
            });
            adminToken = loginRes.data.access_token;
            console.log("   Login successful as admin.");
        }

        const adminApi = axios.create({
            baseURL: BASE_URL,
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Unique name
        const uniqueName = `Seva Test ${Date.now()}`;
        console.log(`2. Creating Test Seva '${uniqueName}' (As Admin)...`);
        const createRes = await adminApi.post('/sevas', {
            name_eng: uniqueName,
            price: 50,
            is_active: true
        });
        const sevaId = createRes.data.id;
        console.log(`   Seva created with ID: ${sevaId}`);

        // Create a non-admin user
        const uniqueClerk = `clerk_${Date.now()}`;
        console.log(`3. Creating Non-Admin User '${uniqueClerk}'...`);
        try {
            await adminApi.post('/users', {
                username: uniqueClerk,
                password: 'password123',
                role: 'clerk'
            });
            console.log("   Clerk created.");
        } catch (e) {
            console.log("   Clerk creation failed (might exist):", e.message);
        }

        // Login as Clerk
        console.log("4. Logging in as Clerk...");
        const clerkRes = await axios.post(`${BASE_URL}/token`, {
            username: uniqueClerk,
            password: 'password123'
        });
        const clerkToken = clerkRes.data.access_token;

        const clerkApi = axios.create({
            baseURL: BASE_URL,
            headers: { Authorization: `Bearer ${clerkToken}` }
        });

        console.log(`5. Attempting to Delete Seva ID ${sevaId} as Clerk...`);
        try {
            await clerkApi.delete(`/sevas/${sevaId}`);
            console.error("   FAILURE: Clerk was able to delete the Seva! (Should be Forbidden)");
        } catch (delErr) {
            if (delErr.response && delErr.response.status === 403) {
                console.log("   SUCCESS: Clerk received 403 Forbidden as expected.");
            } else {
                console.error("   UNEXPECTED ERROR:", delErr.response ? delErr.response.status : delErr.message);
            }
        }

        // Clean up
        console.log("6. Cleaning up (Deleting Seva as Admin)...");
        await adminApi.delete(`/sevas/${sevaId}`);
        console.log("   Cleanup successful.");

    } catch (err) {
        console.error("Global Error:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

verify();
