try {
    const res = await fetch('https://api.postalpincode.in/pincode/110001');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
} catch (err) {
    console.error(err);
}
