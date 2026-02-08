const axios = require('axios');

async function testPincode() {
    try {
        const res = await axios.get('https://api.postalpincode.in/pincode/110001');
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testPincode();
