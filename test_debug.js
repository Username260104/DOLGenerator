// Native fetch is available in Node 18+

async function testModel(target, label) {
    const modelUrl = target.url || target;
    const version = target.version;

    console.log(`\n--- Testing ${label} ---`);
    console.log(`Target URL: ${modelUrl}`);
    if (version) console.log(`Version: ${version}`);

    try {
        const body = {
            url: modelUrl,
            method: 'POST',
            input: {
                prompt: "a futuristic cyberpunk city, in the style of DOL",
                model: "schnell",
                lora_scale: 1,
                num_inference_steps: 4,
                megapixels: "1",
                num_outputs: 1,
                aspect_ratio: "1:1",
                output_format: "jpg",
                output_quality: 100
            }
        };

        if (version) body.version = version;

        const response = await fetch('http://localhost:3001/api/replicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ [${label}] Success! Status: ${response.status}`);
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.error(`❌ [${label}] Failed! Status: ${response.status}`);
            console.error('Error Body:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error(`💥 [${label}] Exception:`, error.message);
    }
}

async function runTests() {
    await testModel(
        {
            url: 'https://api.replicate.com/v1/predictions',
            version: '2cd10ef9753da87b7b691018bcdcd695c844a02e75542db7950cd19cb7be71f6'
        },
        'DOL_LORA_VERSION_SPECIFIC'
    );

    // 2. Test generic Flux Schnell (control group)
    // Note: Official model usually needs version hash or just models endpoint if public
    // Let's try models endpoint for official flux-schnell
    await testModel(
        'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
        'FLUX_SCHNELL'
    );
}

runTests();
